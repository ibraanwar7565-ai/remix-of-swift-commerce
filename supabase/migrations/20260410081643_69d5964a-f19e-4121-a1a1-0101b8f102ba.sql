
-- Fix: Branch admins should NOT be able to insert 'admin' roles
DROP POLICY IF EXISTS "Branch admins can insert branch roles" ON public.user_roles;

CREATE POLICY "Branch admins can insert branch roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
  AND NOT is_main_admin()
  AND branch_id = get_user_branch_id()
  AND role != 'admin'
);

-- Also fix the update policy to prevent role escalation
DROP POLICY IF EXISTS "Branch admins can update branch roles" ON public.user_roles;

CREATE POLICY "Branch admins can update branch roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  is_admin()
  AND NOT is_main_admin()
  AND branch_id = get_user_branch_id()
  AND role != 'admin'
);
