import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find products that are back in stock with pending notifications
    const { data: notifications, error } = await supabase
      .from("product_notifications")
      .select("id, email, product_id, products(name, price, image_url)")
      .eq("notified", false);

    if (error) throw error;
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: "No pending notifications" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to only products that are actually back in stock
    const productIds = [...new Set(notifications.map(n => n.product_id))];
    const { data: products } = await supabase
      .from("products")
      .select("id, inventory_count")
      .in("id", productIds)
      .gt("inventory_count", 0);

    const inStockIds = new Set(products?.map(p => p.id) || []);
    const toNotify = notifications.filter(n => inStockIds.has(n.product_id));

    if (toNotify.length === 0) {
      return new Response(JSON.stringify({ message: "No products back in stock yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    for (const notif of toNotify) {
      const product = notif.products as any;
      try {
        await resend.emails.send({
          from: "Store Notifications <onboarding@resend.dev>",
          to: [notif.email],
          subject: `🎉 ${product.name} is back in stock!`,
          html: `
            <div style="font-family:sans-serif;max-width:500px">
              <h2>Good news! ${product.name} is back in stock</h2>
              ${product.image_url ? `<img src="${product.image_url}" style="width:200px;border-radius:12px" />` : ''}
              <p style="font-size:18px;font-weight:bold">KES ${product.price?.toLocaleString()}</p>
              <p>Hurry — grab it before it sells out again!</p>
            </div>
          `,
        });

        await supabase
          .from("product_notifications")
          .update({ notified: true })
          .eq("id", notif.id);

        sentCount++;
      } catch (e) {
        console.error(`Failed to send to ${notif.email}:`, e);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
