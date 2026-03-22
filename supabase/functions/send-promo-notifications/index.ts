import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    // 1. Get active promotions within date range
    const { data: promotions, error: promoError } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now);

    if (promoError) throw promoError;
    if (!promotions || promotions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active promotions", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get all user IDs (from profiles table)
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select("user_id");

    if (userError) throw userError;
    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSent = 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const promo of promotions) {
      // For each user, check if they've already been notified in the last 24h
      const { data: recentLogs } = await supabase
        .from("promotion_notification_logs")
        .select("user_id")
        .eq("promotion_id", promo.id)
        .gte("sent_at", oneDayAgo);

      const notifiedUserIds = new Set(
        (recentLogs || []).map((l: any) => l.user_id)
      );

      const eligibleUsers = users.filter(
        (u: any) => !notifiedUserIds.has(u.user_id)
      );

      if (eligibleUsers.length === 0) continue;

      // Also check global rate limit: max 1 promo notification per user per day (across all promos)
      const logsToInsert: any[] = [];

      for (const user of eligibleUsers) {
        const { count } = await supabase
          .from("promotion_notification_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.user_id)
          .gte("sent_at", oneDayAgo);

        if ((count || 0) >= 1) continue; // Already got a promo notification today

        logsToInsert.push({
          promotion_id: promo.id,
          user_id: user.user_id,
        });
      }

      if (logsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("promotion_notification_logs")
          .insert(logsToInsert);

        if (!insertError) {
          totalSent += logsToInsert.length;

          // Update last_sent_at on the promotion
          await supabase
            .from("promotions")
            .update({ last_sent_at: now })
            .eq("id", promo.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${totalSent} promotional notifications`,
        sent: totalSent,
        promotions_processed: promotions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
