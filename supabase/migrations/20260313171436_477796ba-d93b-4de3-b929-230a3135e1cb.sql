
-- Tighten the insert policy on promotion_notification_logs to only allow service role (via edge function)
DROP POLICY "System can insert logs" ON public.promotion_notification_logs;
CREATE POLICY "Authenticated can insert own logs" ON public.promotion_notification_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
