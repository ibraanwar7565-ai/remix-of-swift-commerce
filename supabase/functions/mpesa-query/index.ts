import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// M-Pesa API endpoints — SANDBOX
// Switch to https://api.safaricom.co.ke/... when going LIVE
const MPESA_AUTH_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const MPESA_QUERY_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";

async function getMpesaAccessToken() {
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
  if (!consumerKey || !consumerSecret) throw new Error("M-Pesa credentials not configured");
  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const response = await fetch(MPESA_AUTH_URL, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
  });
  const text = await response.text();
  if (!response.ok) {
    console.error("M-Pesa auth failed:", response.status, text.substring(0, 200));
    throw new Error("Failed to get M-Pesa access token");
  }
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("M-Pesa auth non-JSON response:", text.substring(0, 200));
    throw new Error("M-Pesa auth returned non-JSON response");
  }
  return data.access_token;
}

function generateTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
}

app.options("*", (c) => new Response(null, { status: 200, headers: corsHeaders }));

app.post("*", async (c) => {
  try {
    const { checkoutRequestId, orderId } = await c.req.json();

    if (!checkoutRequestId || !orderId) {
      return c.json({ success: false, message: "Missing required fields" }, 400, corsHeaders);
    }

    const shortcode = Deno.env.get("MPESA_SHORTCODE") || "174379";
    const passkey = Deno.env.get("MPESA_PASSKEY");
    if (!passkey) {
      return c.json({ success: false, message: "M-Pesa passkey not configured" }, 500, corsHeaders);
    }

    const accessToken = await getMpesaAccessToken();
    const timestamp = generateTimestamp();
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    const queryResponse = await fetch(MPESA_QUERY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const queryText = await queryResponse.text();
    console.log("STK Query raw response:", queryText.substring(0, 500));

    let queryResult: any;
    try {
      queryResult = JSON.parse(queryText);
    } catch {
      console.error("Non-JSON response from Safaricom:", queryText.substring(0, 200));
      // Treat unparseable responses as pending
      return c.json({
        success: true,
        status: "pending",
        message: "Payment is still being processed...",
      }, 200, corsHeaders);
    }
    console.log("STK Query result:", JSON.stringify(queryResult));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle rate limit / spike arrest from Safaricom
    if (queryResult?.fault) {
      console.log("Safaricom rate limit hit, treating as pending");
      return c.json({
        success: true,
        status: "pending",
        message: "Payment is still being processed",
      }, 200, corsHeaders);
    }

    // Normalize ResultCode to number for reliable comparison
    const resultCode = Number(queryResult.ResultCode);

    // ResultCode 0 = success
    if (resultCode === 0) {
      // Get the order to find its branch_id
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, total_amount, branch_id")
        .eq("id", orderId)
        .single();

      // Payment confirmed — auto-confirm order
      const { data: updatedOrder } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          mpesa_receipt_number: queryResult.ResultDesc || "Confirmed",
        })
        .eq("id", orderId)
        .select()
        .single();

      // Auto-record M-Pesa payment as revenue with branch_id
      if (updatedOrder) {
        const expensePayload: any = {
          order_id: updatedOrder.id,
          amount: updatedOrder.total_amount,
          type: "mpesa_payment",
          description: `M-Pesa payment received — ${queryResult.ResultDesc || "Confirmed"}`,
        };
        if (orderData?.branch_id) {
          expensePayload.branch_id = orderData.branch_id;
        }
        await supabase.from("expenses").insert(expensePayload);
      }

      return c.json({
        success: true,
        status: "completed",
        message: "Payment confirmed! Your order is being prepared.",
        resultDesc: queryResult.ResultDesc,
      }, 200, corsHeaders);
    }
    
    // ResultCode 1032 = cancelled by user, 2001 = wrong PIN
    if (resultCode === 1032 || resultCode === 2001) {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);

      return c.json({
        success: true,
        status: "failed",
        message: resultCode === 1032 
          ? "Payment was cancelled. Please try again."
          : "Wrong M-Pesa PIN entered. Please try again.",
      }, 200, corsHeaders);
    }
    
    // ResultCode 1037 = timeout (no user response), 1 = insufficient funds, 4999 = still processing
    if (resultCode === 1037) {
      return c.json({
        success: true,
        status: "pending",
        message: "Waiting for you to enter your M-Pesa PIN...",
      }, 200, corsHeaders);
    }

    if (resultCode === 4999) {
      return c.json({
        success: true,
        status: "pending",
        message: "Payment is still being processed...",
      }, 200, corsHeaders);
    }

    if (resultCode === 1) {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
      return c.json({
        success: true,
        status: "failed",
        message: "Insufficient M-Pesa balance. Please top up and try again.",
      }, 200, corsHeaders);
    }

    // Any other unknown state — keep pending
    return c.json({
      success: true,
      status: "pending",
      message: queryResult.ResultDesc || "Still processing...",
    }, 200, corsHeaders);

  } catch (error: unknown) {
    console.error("Error in mpesa-query:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return c.json({ success: false, message }, 500, corsHeaders);
  }
});

Deno.serve(app.fetch);
