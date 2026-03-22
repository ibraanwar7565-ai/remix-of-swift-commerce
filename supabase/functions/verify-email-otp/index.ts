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
    const { email, code, fullName } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(JSON.stringify({ error: 'Invalid or expired verification code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark OTP as verified
    await supabase.from('otp_codes').update({ verified: true }).eq('id', otpRecord.id);

    // Check if user exists by email in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', email) // we stored email in phone field too
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.user_id;
    } else {
      // Also check auth users by email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user
        const password = crypto.randomUUID();
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName || '' },
        });

        if (createError) {
          console.error('Create user error:', createError);
          throw new Error('Failed to create account');
        }

        userId = newUser.user.id;

        // Update profile
        await supabase.from('profiles').upsert({
          user_id: userId,
          full_name: fullName || null,
          phone: email,
        }, { onConflict: 'user_id' });

        // Assign customer role
        await supabase.from('user_roles').insert({
          user_id: userId,
          role: 'customer',
        });
      }
    }

    // Generate magic link for sign-in
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Failed to create session');
    }

    // Clean up used OTPs
    await supabase.from('otp_codes').delete().eq('email', email);

    return new Response(JSON.stringify({
      success: true,
      token_hash: sessionData.properties?.hashed_token,
      verification_url: sessionData.properties?.action_link,
    }), {
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
