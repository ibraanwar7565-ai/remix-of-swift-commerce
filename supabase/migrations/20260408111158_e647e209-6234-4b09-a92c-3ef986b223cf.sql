
-- 1. Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Price watches table
CREATE TABLE public.price_watches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  watched_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_price_watches_product ON public.price_watches(product_id);

ALTER TABLE public.price_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watches"
  ON public.price_watches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watches"
  ON public.price_watches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watches"
  ON public.price_watches FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Price drop trigger function
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when price actually decreased
  IF NEW.price < OLD.price THEN
    INSERT INTO public.notifications (user_id, type, title, body, product_id)
    SELECT
      pw.user_id,
      'price_drop',
      '💰 Price Drop on ' || NEW.name,
      NEW.name || ' dropped from KSh ' || OLD.price::TEXT || ' to KSh ' || NEW.price::TEXT || '!',
      NEW.id
    FROM public.price_watches pw
    WHERE pw.product_id = NEW.id
      AND NEW.price < pw.watched_price;

    -- Update watched_price to new price so they get notified again on further drops
    UPDATE public.price_watches
    SET watched_price = NEW.price
    WHERE product_id = NEW.id
      AND NEW.price < watched_price;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_product_price_change
  AFTER UPDATE OF price ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_price_drop();

-- 4. Back-in-stock notification trigger
CREATE OR REPLACE FUNCTION public.notify_back_in_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When inventory goes from 0 to > 0
  IF OLD.inventory_count = 0 AND NEW.inventory_count > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, body, product_id)
    SELECT
      pn.user_id,
      'back_in_stock',
      '🔔 Back in Stock: ' || NEW.name,
      NEW.name || ' is back in stock! Get it before it runs out.',
      NEW.id
    FROM public.product_notifications pn
    WHERE pn.product_id = NEW.id
      AND pn.notified = false;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_product_restock
  AFTER UPDATE OF inventory_count ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_back_in_stock();

-- 5. Add banner columns to promotions
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_link TEXT DEFAULT '/grocery';
