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

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // New arrivals (added in last 7 days)
    const { data: newArrivals } = await supabase
      .from("products")
      .select("name, price, category, image_url, discount_percent")
      .eq("is_active", true)
      .gt("inventory_count", 0)
      .gte("created_at", oneWeekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    // Deals (products with discounts)
    const { data: deals } = await supabase
      .from("products")
      .select("name, price, original_price, discount_percent, category, image_url")
      .eq("is_active", true)
      .gt("inventory_count", 0)
      .gt("discount_percent", 0)
      .order("discount_percent", { ascending: false })
      .limit(10);

    // Get all customer emails from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id");

    // Get emails from auth (via profiles user_ids)
    // Since we can't query auth.users, we'll send to admin for now
    // In production, you'd store customer emails in profiles

    const productCard = (p: any) => `
      <div style="display:inline-block;width:180px;margin:8px;vertical-align:top;border:1px solid #eee;border-radius:12px;overflow:hidden">
        ${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:120px;object-fit:cover" />` : '<div style="height:120px;background:#f3f4f6;display:flex;align-items:center;justify-content:center">🥬</div>'}
        <div style="padding:8px">
          <p style="margin:0;font-weight:600;font-size:14px">${p.name}</p>
          <p style="margin:4px 0 0;font-weight:bold;color:#16a34a">KES ${p.price?.toLocaleString()}</p>
          ${p.discount_percent ? `<span style="background:#ef4444;color:white;padding:2px 6px;border-radius:4px;font-size:12px">-${p.discount_percent}%</span>` : ''}
        </div>
      </div>
    `;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#16a34a">🛒 Weekly Store Update</h1>
        
        ${newArrivals && newArrivals.length > 0 ? `
          <h2>🆕 New Arrivals</h2>
          <div>${newArrivals.map(productCard).join("")}</div>
        ` : ''}
        
        ${deals && deals.length > 0 ? `
          <h2>🔥 Hot Deals</h2>
          <div>${deals.map(productCard).join("")}</div>
        ` : ''}
        
        ${(!newArrivals?.length && !deals?.length) ? '<p>No new arrivals or deals this week. Check back soon!</p>' : ''}
        
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
        <p style="color:#9ca3af;font-size:12px">You're receiving this because you subscribed to weekly updates.</p>
      </div>
    `;

    // Send to admin (can be extended to all customers with email stored in profiles)
    const emailRes = await resend.emails.send({
      from: "Weekly Digest <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `🛒 This Week: ${newArrivals?.length || 0} New Arrivals & ${deals?.length || 0} Deals`,
      html,
    });

    return new Response(JSON.stringify({ sent: true, emailRes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
