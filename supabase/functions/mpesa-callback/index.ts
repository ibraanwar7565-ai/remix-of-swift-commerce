import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

app.options("*", (c) => {
  return c.json({}, 200, corsHeaders);
});

// M-Pesa callback endpoint
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      console.error("Invalid callback body");
      return c.json({ ResultCode: 0, ResultDesc: "Accepted" }, 200, corsHeaders);
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    if (resultCode === 0) {
      // Payment successful — auto-confirm the order
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      
      let mpesaReceiptNumber = "";
      for (const item of callbackMetadata) {
        if (item.Name === "MpesaReceiptNumber") {
          mpesaReceiptNumber = item.Value;
          break;
        }
      }

      // Update order to CONFIRMED with receipt
      const { data, error } = await supabase
        .from("orders")
        .update({
          mpesa_receipt_number: mpesaReceiptNumber,
          status: "confirmed",
        })
        .eq("mpesa_checkout_request_id", checkoutRequestId)
        .select();

      if (error) {
        console.error("Error updating order:", error);
      } else {
        console.log("Order confirmed via M-Pesa callback:", data);

        // Record M-Pesa payment as revenue with branch_id
        if (data && data.length > 0) {
          const order = data[0];
          const expensePayload: any = {
            order_id: order.id,
            amount: order.total_amount,
            type: "mpesa_payment",
            description: `M-Pesa payment received — Receipt: ${mpesaReceiptNumber}`,
          };
          if (order.branch_id) {
            expensePayload.branch_id = order.branch_id;
          }

          const { error: expenseError } = await supabase
            .from("expenses")
            .insert(expensePayload);

          if (expenseError) {
            console.error("Error recording M-Pesa sale:", expenseError);
          }
        }
      }
    } else {
      // Payment failed — cancel the order
      console.log("Payment failed:", resultDesc);
      
      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("mpesa_checkout_request_id", checkoutRequestId);
    }

    // Always return success to M-Pesa
    return c.json({ ResultCode: 0, ResultDesc: "Accepted" }, 200, corsHeaders);
  } catch (error) {
    console.error("Error in mpesa-callback:", error);
    return c.json({ ResultCode: 0, ResultDesc: "Accepted" }, 200, corsHeaders);
  }
});

Deno.serve(app.fetch);
