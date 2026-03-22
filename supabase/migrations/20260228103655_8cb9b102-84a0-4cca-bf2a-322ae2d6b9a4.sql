
-- Allow customers to see rider_assignments for their own orders
CREATE POLICY "Customers can view their order assignments"
ON public.rider_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = rider_assignments.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Allow customers to see rider details for their assigned orders
CREATE POLICY "Customers can view assigned rider details"
ON public.riders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.rider_assignments ra
    JOIN public.orders o ON o.id = ra.order_id
    WHERE ra.rider_id = riders.id
    AND o.user_id = auth.uid()
  )
);
