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
    const { action, email, phone, code, newPassword } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ACTION 1: Look up phone by email and send OTP
    if (action === 'send-otp') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!user) {
        return new Response(JSON.stringify({ error: 'No account found with this email' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get phone from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', user.id)
        .maybeSingle();

      const userPhone = profile?.phone || user.user_metadata?.phone;

      if (!userPhone) {
        return new Response(JSON.stringify({ error: 'No phone number linked to this account. Contact your administrator.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate 6-digit OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Store OTP (use email field to link to reset flow)
      const { error: insertError } = await supabase.from('otp_codes').insert({
        phone: userPhone,
        email: email.toLowerCase(),
        code: otpCode,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error('OTP insert error:', insertError);
        throw new Error('Failed to generate OTP');
      }

      // Send via Advanta
      const advantaApiKey = Deno.env.get('ADVANTA_API_KEY');
      const advantaPartnerId = Deno.env.get('ADVANTA_PARTNER_ID');

      if (!advantaApiKey || !advantaPartnerId) {
        throw new Error('SMS provider not configured');
      }

      const smsRes = await fetch('https://quicksms.advantasms.com/api/services/sendsms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: advantaApiKey.trim(),
          partnerID: advantaPartnerId.trim(),
          message: `Your HALLOFRESH password reset code is ${otpCode}. Expires in 5 min. Do not share this code.`,
          shortcode: 'Hallo Fresh',
          mobile: userPhone,
        }),
      });

      if (!smsRes.ok) {
        throw new Error('SMS delivery failed');
      }

      // Mask phone for display (e.g., +254***456789 → +254***789)
      const maskedPhone = userPhone.slice(0, 4) + '****' + userPhone.slice(-3);

      return new Response(JSON.stringify({ success: true, maskedPhone, phone: userPhone }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION 2: Verify OTP and reset password
    if (action === 'reset-password') {
      if (!email || !code || !newPassword) {
        return new Response(JSON.stringify({ error: 'Email, code, and new password are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find valid OTP by email
      const { data: otpRecord, error: otpError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', code)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (otpError || !otpRecord) {
        return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark OTP as verified
      await supabase.from('otp_codes').update({ verified: true }).eq('id', otpRecord.id);

      // Find user and update password
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw new Error('Failed to update password');
      }

      // Cleanup OTPs
      await supabase.from('otp_codes').delete().eq('email', email.toLowerCase());

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('staff-password-reset error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
