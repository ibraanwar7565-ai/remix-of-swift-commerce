import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "ibraanwar7565@gmail.com";

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

    const { data: lowStockProducts, error } = await supabase
      .from("products")
      .select("id, name, inventory_count, category")
      .eq("is_active", true)
      .lte("inventory_count", 5)
      .order("inventory_count", { ascending: true });

    if (error) throw error;
    if (!lowStockProducts || lowStockProducts.length === 0) {
      return new Response(JSON.stringify({ message: "No low stock items" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = lowStockProducts.map(p =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${p.name}</td><td style="padding:8px;border-bottom:1px solid #eee">${p.category || '-'}</td><td style="padding:8px;border-bottom:1px solid #eee;color:${p.inventory_count === 0 ? '#dc2626' : '#f59e0b'};font-weight:bold">${p.inventory_count}</td></tr>`
    ).join("");

    const html = `
      <h2>⚠️ Low Stock Alert</h2>
      <p>${lowStockProducts.length} product(s) are running low:</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Product</th><th style="padding:8px;text-align:left">Category</th><th style="padding:8px;text-align:left">Stock</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:16px;color:#6b7280">Please restock these items soon.</p>
    `;

    const emailRes = await resend.emails.send({
      from: "Stock Alerts <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `🚨 Low Stock Alert: ${lowStockProducts.length} item(s) need restocking`,
      html,
    });

    return new Response(JSON.stringify({ sent: true, count: lowStockProducts.length, emailRes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
