
-- Fix overly permissive update policy
DROP POLICY "Service can update notifications" ON public.product_notifications;

CREATE POLICY "Service can update notifications"
  ON public.product_notifications FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());
