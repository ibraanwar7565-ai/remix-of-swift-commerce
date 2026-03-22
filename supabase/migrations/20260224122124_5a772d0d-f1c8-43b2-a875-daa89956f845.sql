
-- Fix branches RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Branches are publicly readable" ON public.branches;
DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;

-- Permissive: anyone can read active branches
CREATE POLICY "Branches are publicly readable"
  ON public.branches FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Permissive: admins can do everything
CREATE POLICY "Admins can manage branches"
  ON public.branches FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create table to store client's selected branch
CREATE TABLE IF NOT EXISTS public.user_selected_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_selected_branches ENABLE ROW LEVEL SECURITY;

-- Users can view their own selection
CREATE POLICY "Users can view their own branch selection"
  ON public.user_selected_branches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own selection
CREATE POLICY "Users can insert their branch selection"
  ON public.user_selected_branches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own selection
CREATE POLICY "Users can update their branch selection"
  ON public.user_selected_branches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all selections
CREATE POLICY "Admins can view all branch selections"
  ON public.user_selected_branches FOR SELECT
  TO authenticated
  USING (is_admin());

-- Branch admins can view selections for their branch
CREATE POLICY "Branch admins can view their branch selections"
  ON public.user_selected_branches FOR SELECT
  TO authenticated
  USING (
    NOT is_main_admin() AND is_admin() AND branch_id = get_user_branch_id()
  );

-- Trigger for updated_at
CREATE TRIGGER update_user_selected_branches_updated_at
  BEFORE UPDATE ON public.user_selected_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
