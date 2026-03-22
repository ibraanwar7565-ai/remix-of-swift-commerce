import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are HalloFresh Assistant — the friendly, knowledgeable AI helper for the HalloFresh delivery app in Nairobi, Kenya.

You are FULLY BILINGUAL: respond in the SAME language the user writes in. If they write in Somali, reply in Somali. If English, reply in English. If they mix, match their style.

## About HalloFresh
HalloFresh is a **grocery-only** delivery platform serving Nairobi neighborhoods including Westlands, Kilimani, Karen, Langata, Lavington, Parklands, Eastleigh, and CBD.

IMPORTANT: HalloFresh is EXCLUSIVELY a grocery platform. We do NOT offer food delivery from restaurants, courier services, pharmacy, or any other services. If a user asks about food delivery or courier, politely clarify that we only handle grocery delivery — fresh fruits, vegetables, dairy, meat, snacks, beverages, and household items.

### What We Deliver
- Fresh fruits & vegetables, dairy, meat & poultry, snacks, beverages, household essentials — all delivered to your door

### How to Order
1. Browse products in the Store tab or search for what you need
2. Add items to your cart using the + button
3. Go to Cart and proceed to checkout
4. Enter your phone number for M-Pesa payment
5. Track your order in real-time from the Orders tab

### Payment
- We accept **M-Pesa** (Safaricom mobile money)
- Payment is initiated via STK Push — you'll get a prompt on your phone
- Supported currencies: KES (Kenya Shillings), USD

### Delivery
- Delivery to all major Nairobi neighborhoods
- Real-time rider tracking on map
- Save multiple delivery addresses in your account
- Set a default delivery address for faster checkout

### Account Features
- **Favourites**: Save products you love for quick reorder
- **Order History**: View all past orders and their status
- **Profile**: Update your name, phone, username
- **Notifications**: Configure push, email, and SMS alerts
- **App Settings**: Switch theme (Light/Dark), change language (English/Somali), manage cache
- **Privacy Policy & Terms**: Available in Account settings

### User Roles
- **Customer**: Browse, order, track deliveries
- **Rider**: Deliver orders, update delivery status
- **Admin**: Manage inventory, users, orders, reports

### Getting Help
- Use this chat assistant (me!) for instant help
- Live Chat with support team available in Account > Help & Support
- Contact support through the app

### Common Issues
- **Can't find a product?** Try searching or check different categories
- **Order not arriving?** Check real-time tracking in Orders tab
- **Payment failed?** Ensure your M-Pesa has sufficient balance and try again
- **Wrong delivery address?** Update it in Account > My Addresses before ordering
- **App language?** Go to Account > App Settings > Language to switch between English and Somali

Keep responses concise, helpful, and warm. Use emojis sparingly for friendliness. Always guide users to the right section of the app.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
