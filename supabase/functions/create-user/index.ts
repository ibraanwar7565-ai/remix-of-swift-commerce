import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'admin' | 'order_manager' | 'inventory_manager' | 'support' | 'rider' | 'customer';
  branchId?: string | null;
  vehicleType?: string;
  licensePlate?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await userClient.rpc('is_admin');
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: CreateUserRequest = await req.json();
    const { email, password, fullName, phone, role, branchId, vehicleType, licensePlate } = body;

    if (!email || !password || !fullName || !phone || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create or find user
    let userId: string;
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      if (createError.message.includes('already been registered')) {
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === email);
        if (listError || !existingUser) {
          return new Response(JSON.stringify({ error: 'User exists but could not be found' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        userId = existingUser.id;
      } else {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      userId = newUser.user.id;
    }

    // Upsert profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({ user_id: userId, phone, full_name: fullName }, { onConflict: 'user_id' });
    if (profileError) console.error('Profile update error:', profileError);

    // Assign role with branch_id
    const rolePayload: any = { user_id: userId, role };
    if (branchId) rolePayload.branch_id = branchId;

    const { error: roleInsertError } = await adminClient
      .from('user_roles')
      .upsert(rolePayload, { onConflict: 'user_id,role' });

    if (roleInsertError) {
      console.error('Role insert error:', roleInsertError);
      return new Response(JSON.stringify({ error: 'Failed to assign role' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If rider, create rider record with branch
    if (role === 'rider') {
      const riderPayload: any = {
        user_id: userId, phone,
        vehicle_type: vehicleType || 'motorcycle',
        license_plate: licensePlate || null,
        status: 'offline',
      };
      if (branchId) riderPayload.branch_id = branchId;

      const { error: riderError } = await adminClient.from('riders').insert(riderPayload);
      if (riderError) console.error('Rider insert error:', riderError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email, fullName, role, branchId: branchId || null },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
