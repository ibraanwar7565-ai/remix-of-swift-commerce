
-- Table for "Notify Me" back-in-stock subscriptions
CREATE TABLE public.product_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.product_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe to notifications"
  ON public.product_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe"
  ON public.product_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Allow edge functions (service role) to update notified status
CREATE POLICY "Service can update notifications"
  ON public.product_notifications FOR UPDATE
  USING (true);
