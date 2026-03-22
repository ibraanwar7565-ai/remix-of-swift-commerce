
-- Replace deduct_inventory trigger to fire on 'confirmed' instead of 'completed'
CREATE OR REPLACE FUNCTION public.deduct_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Deduct stock when order moves to 'confirmed' (payment verified or admin accepted)
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE public.products
    SET inventory_count = GREATEST(inventory_count - oi.quantity, 0)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
    AND products.id = oi.product_id;
  END IF;

  -- Restore stock when order is cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.products
    SET inventory_count = inventory_count + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
    AND products.id = oi.product_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on orders table
DROP TRIGGER IF EXISTS deduct_inventory_trigger ON public.orders;
CREATE TRIGGER deduct_inventory_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_inventory();
