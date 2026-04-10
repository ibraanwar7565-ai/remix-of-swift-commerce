
-- ============================================
-- 1. FIX ORDERS: Replace overly permissive SELECT and INSERT
-- ============================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Orders can be read by phone" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Customers can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all orders (scoped by branch for branch admins)
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  is_main_admin()
  OR (is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id())
);

-- Riders can view orders assigned to them
CREATE POLICY "Riders can view assigned orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rider_assignments ra
    JOIN riders r ON r.id = ra.rider_id
    WHERE ra.order_id = orders.id AND r.user_id = auth.uid()
  )
);

-- Authenticated users can create orders only for themselves
CREATE POLICY "Authenticated users can create their own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous order creation (guest checkout) only if user_id is null
CREATE POLICY "Guest checkout orders"
ON public.orders FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- ============================================
-- 2. FIX ORDER_ITEMS: Replace overly permissive SELECT and INSERT
-- ============================================

DROP POLICY IF EXISTS "Order items are publicly readable" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Users can view items from their own orders
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
TO authenticated
USING (is_admin());

-- Riders can view items for assigned orders
CREATE POLICY "Riders can view assigned order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rider_assignments ra
    JOIN riders r ON r.id = ra.rider_id
    WHERE ra.order_id = order_items.order_id AND r.user_id = auth.uid()
  )
);

-- Authenticated users can insert items for their own orders
CREATE POLICY "Users can insert items for own orders"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

-- Admins can insert order items
CREATE POLICY "Admins can insert order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Guest can insert items for guest orders (user_id IS NULL)
CREATE POLICY "Guest can insert order items"
ON public.order_items FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id AND o.user_id IS NULL
  )
);

-- ============================================
-- 3. FIX ORDER_TRACKING: Replace overly permissive SELECT
-- ============================================

DROP POLICY IF EXISTS "Anyone can view order tracking" ON public.order_tracking;

-- Users can view tracking for their own orders
CREATE POLICY "Users can view own order tracking"
ON public.order_tracking FOR SELECT
TO authenticated
USING (user_owns_order(order_id));

-- Riders can view tracking for assigned orders
CREATE POLICY "Riders can view assigned order tracking"
ON public.order_tracking FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rider_assignments ra
    JOIN riders r ON r.id = ra.rider_id
    WHERE ra.order_id = order_tracking.order_id AND r.user_id = auth.uid()
  )
);

-- Admins can view all tracking
CREATE POLICY "Admins can view all order tracking"
ON public.order_tracking FOR SELECT
TO authenticated
USING (is_admin());

-- ============================================
-- 4. FIX OTP_CODES: Ensure no public access
-- ============================================

-- Make sure RLS is enabled (it should be)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Explicitly block all client access (edge functions use service role)
DROP POLICY IF EXISTS "No public access to OTP codes" ON public.otp_codes;

-- ============================================
-- 5. FIX get_user_branch_id(): Disambiguate branch lookup
-- ============================================

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
    AND role = 'admin'
    AND branch_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1
$$;
