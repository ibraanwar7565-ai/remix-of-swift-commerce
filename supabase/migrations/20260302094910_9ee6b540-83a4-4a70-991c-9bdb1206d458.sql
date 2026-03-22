
-- Create helper functions to break RLS recursion

-- Function to check if a user owns an order (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_owns_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = _order_id AND user_id = auth.uid()
  )
$$;

-- Function to check if a rider is assigned to any of the user's orders (bypasses RLS)  
CREATE OR REPLACE FUNCTION public.rider_assigned_to_user_order(_rider_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rider_assignments ra
    JOIN public.orders o ON o.id = ra.order_id
    WHERE ra.rider_id = _rider_id AND o.user_id = auth.uid()
  )
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Customers can view their order assignments" ON public.rider_assignments;
DROP POLICY IF EXISTS "Customers can view assigned rider details" ON public.riders;

-- Recreate with SECURITY DEFINER functions to break recursion
CREATE POLICY "Customers can view their order assignments"
ON public.rider_assignments FOR SELECT
USING (user_owns_order(order_id));

CREATE POLICY "Customers can view assigned rider details"
ON public.riders FOR SELECT
USING (rider_assigned_to_user_order(id));
