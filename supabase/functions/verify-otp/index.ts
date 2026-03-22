import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code, fullName } = await req.json();

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'Phone and code required' }), {
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
      .eq('phone', phone)
      .eq('code', code)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark OTP as verified
    await supabase.from('otp_codes').update({ verified: true }).eq('id', otpRecord.id);

    // Check if user exists by looking up profiles with this phone
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      userId = existingProfile.user_id;
    } else {
      // Check if user already exists by dummy email (profile phone might not be set)
      const email = `${phone.replace('+', '')}@phone.hallofresh.app`;
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        userId = existingUser.id;
        // Ensure profile has phone
        await supabase.from('profiles').update({ phone, full_name: fullName || null }).eq('user_id', userId);
      } else {
        // Create new user
        const password = crypto.randomUUID();
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName || '', phone },
        });

        if (createError) {
          console.error('Create user error:', createError);
          throw new Error('Failed to create account');
        }

        userId = newUser.user.id;
        isNewUser = true;

        await supabase.from('profiles').update({ phone, full_name: fullName || null }).eq('user_id', userId);
        await supabase.from('user_roles').insert({ user_id: userId, role: 'customer' });
      }
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone.replace('+', '')}@phone.hallofresh.app`,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Failed to create session');
    }

    // Clean up used OTPs for this phone
    await supabase.from('otp_codes').delete().eq('phone', phone);

    return new Response(JSON.stringify({
      success: true,
      isNewUser,
      // Return the token properties for client to use
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
