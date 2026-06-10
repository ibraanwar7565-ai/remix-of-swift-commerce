
-- Tighten branch admin role assignment: whitelist allowed roles (no admin escalation, no privileged staff roles)
DROP POLICY IF EXISTS "Branch admins can insert branch roles" ON public.user_roles;
DROP POLICY IF EXISTS "Branch admins can update branch roles" ON public.user_roles;

CREATE POLICY "Branch admins can insert branch roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
  AND NOT is_main_admin()
  AND branch_id = get_user_branch_id()
  AND role IN ('rider'::app_role, 'order_manager'::app_role, 'inventory_manager'::app_role, 'support'::app_role, 'customer'::app_role)
);

CREATE POLICY "Branch admins can update branch roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  is_admin()
  AND NOT is_main_admin()
  AND branch_id = get_user_branch_id()
  AND role IN ('rider'::app_role, 'order_manager'::app_role, 'inventory_manager'::app_role, 'support'::app_role, 'customer'::app_role)
)
WITH CHECK (
  is_admin()
  AND NOT is_main_admin()
  AND branch_id = get_user_branch_id()
  AND role IN ('rider'::app_role, 'order_manager'::app_role, 'inventory_manager'::app_role, 'support'::app_role, 'customer'::app_role)
);

-- Explicit deny SELECT on otp_codes for client roles (service-role only reads via edge functions)
REVOKE SELECT ON public.otp_codes FROM anon, authenticated;

CREATE POLICY "No client read access to otp_codes"
ON public.otp_codes
FOR SELECT
TO anon, authenticated
USING (false);
