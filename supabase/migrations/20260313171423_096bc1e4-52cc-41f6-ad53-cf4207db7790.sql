
-- Promotions table
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  message TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification delivery logs
CREATE TABLE public.promotion_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_notification_logs ENABLE ROW LEVEL SECURITY;

-- Promotions policies: admins manage, active ones readable by all authenticated
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Active promotions readable" ON public.promotions FOR SELECT USING (is_active = true AND now() BETWEEN start_date AND end_date);

-- Notification logs policies
CREATE POLICY "Admins can view all logs" ON public.promotion_notification_logs FOR SELECT USING (is_admin());
CREATE POLICY "Users can view own logs" ON public.promotion_notification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert logs" ON public.promotion_notification_logs FOR INSERT WITH CHECK (true);

-- Enable realtime for logs so clients get live notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotion_notification_logs;

-- Index for efficient querying
CREATE INDEX idx_promo_logs_user_sent ON public.promotion_notification_logs(user_id, sent_at);
CREATE INDEX idx_promotions_active ON public.promotions(is_active, start_date, end_date);
