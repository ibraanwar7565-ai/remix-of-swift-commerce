import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let phone = raw.trim().replace(/\s+/g, '').replace(/-/g, '');

  // Remove leading + if present
  if (phone.startsWith('+')) phone = phone.slice(1);

  // 07XXXXXXXX or 01XXXXXXXX → 2547... or 2541...
  if (/^0[17]\d{8}$/.test(phone)) {
    phone = '254' + phone.slice(1);
  }

  // 7XXXXXXXX or 1XXXXXXXX (9 digits, starting with 7 or 1)
  if (/^[17]\d{8}$/.test(phone)) {
    phone = '254' + phone;
  }

  // Add + prefix
  if (!phone.startsWith('+')) {
    phone = '+' + phone;
  }

  // Validate final format: +254 followed by 9 digits starting with 7 or 1
  if (/^\+254[17]\d{8}$/.test(phone)) {
    return phone;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone: rawPhone } = await req.json();
    const phone = normalizePhone(rawPhone);

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Valid Kenyan phone number required (07XXXXXXXX or +254XXXXXXXXX)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Normalized phone:', phone);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit: max 3 OTPs per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', tenMinutesAgo);

    if (count && count >= 3) {
      return new Response(JSON.stringify({ error: 'Too many OTP requests. Please wait a few minutes.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete all previous OTP rows for this phone (cleanup)
    const { error: deleteError, count: deleteCount } = await supabase
      .from('otp_codes')
      .delete()
      .eq('phone', phone)
      .select('id', { count: 'exact', head: true });

    console.log('OTP cleanup for', phone, '- deleted:', deleteCount ?? 0, deleteError ? `error: ${deleteError.message}` : 'ok');

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store OTP
    const { error: insertError } = await supabase.from('otp_codes').insert({
      phone,
      code,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('OTP insert error:', insertError.message);
      throw new Error('Failed to generate OTP');
    }

    console.log('OTP inserted for', phone);

    // Send via Advanta Africa (LIVE)
    const advantaApiKey = Deno.env.get('ADVANTA_API_KEY');
    const advantaPartnerId = Deno.env.get('ADVANTA_PARTNER_ID');

    if (!advantaApiKey || !advantaPartnerId) {
      console.error('Missing Advanta credentials:', { hasApiKey: !!advantaApiKey, hasPartnerId: !!advantaPartnerId });
      throw new Error('SMS provider not configured');
    }

    const advantaUrl = 'https://quicksms.advantasms.com/api/services/sendsms/';

    const smsBody = JSON.stringify({
      apikey: advantaApiKey.trim(),
      partnerID: advantaPartnerId.trim(),
      message: `Your HALLOFRESH code is ${code}. Expires in 5 min. Do not share this code.`,
      shortcode: 'Hallo Fresh',
      mobile: phone,
    });

    console.log('Advanta request:', { url: advantaUrl, partnerID: advantaPartnerId.trim(), to: phone });

    const smsRes = await fetch(advantaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: smsBody,
    });

    const smsText = await smsRes.text();
    console.log('Advanta response status:', smsRes.status, 'body:', smsText);

    if (!smsRes.ok) {
      console.error('Advanta HTTP error:', smsRes.status, smsText);
      throw new Error('SMS delivery failed');
    }

    let smsData;
    try {
      smsData = JSON.parse(smsText);
    } catch {
      console.error('Advanta response not JSON:', smsText);
      throw new Error('SMS provider error');
    }

    console.log('Advanta parsed response:', JSON.stringify(smsData));

    // Check for Advanta-level errors
    if (smsData?.responses) {
      const resp = smsData.responses[0];
      const code_val = resp?.['response-code'];
      if (resp && code_val !== undefined && code_val !== 200 && code_val !== '0200') {
        console.error('Advanta delivery failed:', resp);
        throw new Error(resp['response-description'] || 'SMS could not be delivered');
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('send-otp error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send OTP' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
