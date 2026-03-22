import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'A valid email address is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Delete old OTPs for this email
    await supabase.from('otp_codes').delete().eq('email', email);

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP
    const { error: insertError } = await supabase.from('otp_codes').insert({
      email,
      phone: email, // required field, reuse for email
      code,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('OTP insert error:', insertError);
      throw new Error('Failed to generate verification code');
    }

    // Send branded email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a1f14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a1f14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#122a1c;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0df233,#0ac22a);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#0a1f14;font-size:28px;font-weight:800;letter-spacing:-0.5px;">HALLOFRESH</h1>
              <p style="margin:8px 0 0;color:#0a1f14;font-size:13px;opacity:0.7;">Premium Delivery Services</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#f2f2f2;font-size:22px;font-weight:700;">Verification Code</h2>
              <p style="margin:0 0 28px;color:#8a9b90;font-size:14px;line-height:1.6;">
                Please use the following code to verify your identity. This code will expire in 10 minutes.
              </p>
              
              <!-- OTP Code -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#0a1f14;border-radius:12px;padding:24px;text-align:center;border:1px solid #1a3d2a;">
                    <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#0df233;font-family:'Courier New',monospace;">${code}</span>
                  </td>
                </tr>
              </table>
              
              <p style="margin:24px 0 0;color:#8a9b90;font-size:13px;line-height:1.6;">
                If you did not request this code, please disregard this email. Do not share this code with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 32px;border-top:1px solid #1a3d2a;">
              <p style="margin:24px 0 0;color:#5a6b60;font-size:11px;line-height:1.6;text-align:center;">
                © ${new Date().getFullYear()} HALLOFRESH Grocery Inc. All rights reserved.<br>
                Nairobi, Kenya
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HALLOFRESH <onboarding@resend.dev>',
        to: [email],
        subject: `${code} — Your HALLOFRESH Verification Code`,
        html: emailHtml,
      }),
    });

    const resendText = await resendRes.text();
    console.log('Resend response:', resendRes.status, resendText);

    if (!resendRes.ok) {
      console.error('Resend error:', resendText);
      // Parse Resend error for better user messaging
      try {
        const resendError = JSON.parse(resendText);
        if (resendError.statusCode === 403 && resendError.message?.includes('testing emails')) {
          throw new Error('Email delivery is restricted in test mode. Please use the account owner email or sign in with password for demo accounts.');
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.includes('restricted')) throw parseErr;
      }
      throw new Error('Failed to send verification email. Please try again later.');
    }

    return new Response(JSON.stringify({ success: true, message: 'Verification code sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
