-- Drop existing restrictive policies on branches
DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Branches are publicly readable" ON public.branches;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can manage branches"
ON public.branches
AS PERMISSIVE
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Branches are publicly readable"
ON public.branches
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Make latitude/longitude have defaults so they're not required
ALTER TABLE public.branches ALTER COLUMN latitude SET DEFAULT -1.2921;
ALTER TABLE public.branches ALTER COLUMN longitude SET DEFAULT 36.8219;