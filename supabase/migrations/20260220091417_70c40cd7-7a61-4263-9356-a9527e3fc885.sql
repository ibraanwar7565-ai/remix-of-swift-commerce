
-- Allow riders to view delivery addresses for orders assigned to them
CREATE POLICY "Riders can view delivery addresses for assigned orders"
ON public.delivery_addresses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.rider_assignments ra ON ra.order_id = o.id
    JOIN public.riders r ON r.id = ra.rider_id
    WHERE o.delivery_address_id = delivery_addresses.id
      AND r.user_id = auth.uid()
  )
);

-- Allow admins to view all delivery addresses
CREATE POLICY "Admins can view all delivery addresses"
ON public.delivery_addresses
FOR SELECT
USING (public.is_admin());
