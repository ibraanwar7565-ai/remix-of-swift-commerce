
-- Allow riders to update orders they are assigned to (mark as completed)
CREATE POLICY "Riders can update assigned orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM rider_assignments ra
    JOIN riders r ON r.id = ra.rider_id
    WHERE ra.order_id = orders.id
    AND r.user_id = auth.uid()
  )
);

-- Enable realtime for rider_assignments so riders get instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_assignments;
