
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title TEXT;
  _body TEXT;
BEGIN
  -- Only fire when status actually changes and user_id exists
  IF NEW.status = OLD.status OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'confirmed' THEN
      _title := '✅ Order Confirmed';
      _body := 'Your order #' || upper(left(NEW.id::text, 8)) || ' has been confirmed and is being processed.';
    WHEN 'processing' THEN
      _title := '👨‍🍳 Order Being Prepared';
      _body := 'Your order #' || upper(left(NEW.id::text, 8)) || ' is now being prepared.';
    WHEN 'out_for_delivery' THEN
      _title := '🚴 Order On the Way!';
      _body := 'Your order #' || upper(left(NEW.id::text, 8)) || ' is on its way to you.';
    WHEN 'delivered' THEN
      _title := '🎉 Order Delivered';
      _body := 'Your order #' || upper(left(NEW.id::text, 8)) || ' has been delivered. Enjoy!';
    WHEN 'cancelled' THEN
      _title := '❌ Order Cancelled';
      _body := 'Your order #' || upper(left(NEW.id::text, 8)) || ' has been cancelled.';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (NEW.user_id, 'order_update', _title, _body);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change_notify
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();
