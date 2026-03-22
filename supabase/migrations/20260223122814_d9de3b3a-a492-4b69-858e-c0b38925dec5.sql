
-- Create branches table
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address_line text NOT NULL,
  city text DEFAULT 'Nairobi',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  phone text,
  opening_time time DEFAULT '08:00',
  closing_time time DEFAULT '21:00',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Branches are publicly readable (customers need to find nearest)
CREATE POLICY "Branches are publicly readable"
  ON public.branches FOR SELECT
  USING (is_active = true);

-- Admins can manage branches
CREATE POLICY "Admins can manage branches"
  ON public.branches FOR ALL
  USING (is_admin());

-- Add branch_id to user_roles (nullable - main admin has no branch)
ALTER TABLE public.user_roles ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add branch_id to riders
ALTER TABLE public.riders ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add branch_id to orders (which branch the order goes to)
ALTER TABLE public.orders ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add branch_id to expenses
ALTER TABLE public.expenses ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user is main admin (admin without branch_id)
CREATE OR REPLACE FUNCTION public.is_main_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND branch_id IS NULL
  )
$$;

-- Function to get user's branch_id
CREATE OR REPLACE FUNCTION public.get_user_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Update expenses RLS: branch admins can view their branch expenses but not manage
-- Drop existing policy first
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;

-- Main admins can manage all expenses
CREATE POLICY "Main admins can manage expenses"
  ON public.expenses FOR ALL
  USING (is_main_admin());

-- Branch admins can view their branch expenses
CREATE POLICY "Branch admins can view branch expenses"
  ON public.expenses FOR SELECT
  USING (
    is_admin() AND 
    NOT is_main_admin() AND 
    branch_id = get_user_branch_id()
  );

-- Enable realtime for branches
ALTER PUBLICATION supabase_realtime ADD TABLE public.branches;
