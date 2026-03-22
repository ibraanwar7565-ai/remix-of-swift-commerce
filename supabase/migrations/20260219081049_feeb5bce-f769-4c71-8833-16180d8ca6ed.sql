
-- Drop the restrictive UPDATE policies
DROP POLICY "Admins can update orders" ON public.orders;
DROP POLICY "Riders can update assigned orders" ON public.orders;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (is_admin());

CREATE POLICY "Riders can update assigned orders"
ON public.orders FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM rider_assignments ra
  JOIN riders r ON r.id = ra.rider_id
  WHERE ra.order_id = orders.id AND r.user_id = auth.uid()
));
