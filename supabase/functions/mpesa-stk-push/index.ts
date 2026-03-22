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
const MPESA_STK_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

async function getMpesaAccessToken() {
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not configured");
  }

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

function generatePassword(shortcode: string, passkey: string, timestamp: string) {
  return btoa(`${shortcode}${passkey}${timestamp}`);
}

function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

app.options("*", (c) => {
  return new Response(null, { status: 200, headers: corsHeaders });
});

app.post("*", async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, phone, amount } = body;

    if (!orderId || !phone || !amount) {
      return c.json(
        { success: false, message: "Missing required fields" },
        400,
        corsHeaders
      );
    }

    const shortcode = Deno.env.get("MPESA_SHORTCODE") || "174379";
    const passkey = Deno.env.get("MPESA_PASSKEY");
    const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL");

    if (!passkey) {
      return c.json(
        { success: false, message: "M-Pesa passkey not configured" },
        500,
        corsHeaders
      );
    }

    const accessToken = await getMpesaAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);

    console.log("Initiating STK push:", { phone, amount: Math.ceil(amount), orderId: orderId.substring(0, 8) });

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: Math.ceil(amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl || `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`,
      AccountReference: "HALLOFRESH",
      TransactionDesc: `Payment for order ${orderId.substring(0, 8)}`,
    };

    const stkResponse = await fetch(MPESA_STK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const stkText = await stkResponse.text();
    console.log("STK push raw response:", stkText.substring(0, 500));

    let stkResult: any;
    try {
      stkResult = JSON.parse(stkText);
    } catch {
      console.error("STK push non-JSON response:", stkText.substring(0, 200));
      return c.json(
        { success: false, message: "M-Pesa service temporarily unavailable. Please try again." },
        503,
        corsHeaders
      );
    }
    console.log("STK push response:", JSON.stringify(stkResult));

    if (stkResult.ResponseCode === "0") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("orders")
        .update({
          mpesa_checkout_request_id: stkResult.CheckoutRequestID,
          status: "pending",
        })
        .eq("id", orderId);

      return c.json(
        {
          success: true,
          message: "M-Pesa prompt sent to your phone. Enter your PIN to complete payment.",
          checkoutRequestId: stkResult.CheckoutRequestID,
        },
        200,
        corsHeaders
      );
    } else {
      console.error("M-Pesa STK Push failed:", stkResult);
      return c.json(
        {
          success: false,
          message: stkResult.errorMessage || stkResult.CustomerMessage || "Failed to initiate payment",
        },
        400,
        corsHeaders
      );
    }
  } catch (error: unknown) {
    console.error("Error in mpesa-stk-push:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return c.json({ success: false, message }, 500, corsHeaders);
  }
});

Deno.serve(app.fetch);
