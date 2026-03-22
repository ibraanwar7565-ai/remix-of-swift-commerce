
-- ============================================================
-- Scope Branch Admins to their own branch data
-- Main Admins (branch_id IS NULL) keep full access
-- ============================================================

-- Helper: check if user is a branch-scoped admin for a given branch
CREATE OR REPLACE FUNCTION public.is_branch_admin_for(_branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND branch_id IS NOT NULL
      AND branch_id = _branch_id
  )
$$;

-- ===================== ORDERS =====================
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id())
  );

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id())
  );

-- ===================== RIDERS =====================
DROP POLICY IF EXISTS "Admins can view all riders" ON public.riders;
DROP POLICY IF EXISTS "Admins can insert riders" ON public.riders;
DROP POLICY IF EXISTS "Admins can update riders" ON public.riders;
DROP POLICY IF EXISTS "Admins can delete riders" ON public.riders;

CREATE POLICY "Admins can view all riders" ON public.riders
  FOR SELECT USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id())
    OR (auth.uid() = user_id)
  );

CREATE POLICY "Admins can insert riders" ON public.riders
  FOR INSERT WITH CHECK (
    is_main_admin() OR (is_admin() AND NOT is_main_admin())
  );

CREATE POLICY "Admins can update riders" ON public.riders
  FOR UPDATE USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id())
    OR (auth.uid() = user_id)
  );

CREATE POLICY "Admins can delete riders" ON public.riders
  FOR DELETE USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id())
  );

-- Remove old rider self-view/update policies (now merged above)
DROP POLICY IF EXISTS "Riders can view their own record" ON public.riders;
DROP POLICY IF EXISTS "Riders can update their own record" ON public.riders;

-- ===================== RIDER ASSIGNMENTS =====================
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.rider_assignments;
DROP POLICY IF EXISTS "Admins can insert assignments" ON public.rider_assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON public.rider_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON public.rider_assignments;

CREATE POLICY "Admins can view all assignments" ON public.rider_assignments
  FOR SELECT USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND EXISTS (
      SELECT 1 FROM public.riders r WHERE r.id = rider_assignments.rider_id AND r.branch_id = get_user_branch_id()
    ))
  );

CREATE POLICY "Admins can insert assignments" ON public.rider_assignments
  FOR INSERT WITH CHECK (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND EXISTS (
      SELECT 1 FROM public.riders r WHERE r.id = rider_assignments.rider_id AND r.branch_id = get_user_branch_id()
    ))
  );

CREATE POLICY "Admins can update assignments" ON public.rider_assignments
  FOR UPDATE USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND EXISTS (
      SELECT 1 FROM public.riders r WHERE r.id = rider_assignments.rider_id AND r.branch_id = get_user_branch_id()
    ))
  );

CREATE POLICY "Admins can delete assignments" ON public.rider_assignments
  FOR DELETE USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND EXISTS (
      SELECT 1 FROM public.riders r WHERE r.id = rider_assignments.rider_id AND r.branch_id = get_user_branch_id()
    ))
  );

-- ===================== PROFILES =====================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = profiles.user_id AND ur.branch_id = get_user_branch_id()
    ))
  );

-- ===================== USER ROLES =====================
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (
    is_main_admin() OR (is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id())
    OR (auth.uid() = user_id)
  );

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    is_main_admin()
  ) WITH CHECK (
    is_main_admin()
  );

-- Branch admins can insert/update roles scoped to their branch
CREATE POLICY "Branch admins can insert branch roles" ON public.user_roles
  FOR INSERT WITH CHECK (
    is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id()
  );

CREATE POLICY "Branch admins can update branch roles" ON public.user_roles
  FOR UPDATE USING (
    is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id()
  );
