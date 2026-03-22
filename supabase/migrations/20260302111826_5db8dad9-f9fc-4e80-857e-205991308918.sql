-- Drop existing restrictive policies on branches
DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Branches are publicly readable" ON public.branches;

-- Recreate as PERMISSIVE (default) so they use OR logic
CREATE POLICY "Admins can manage branches"
ON public.branches
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Branches are publicly readable"
ON public.branches
FOR SELECT
USING (is_active = true);