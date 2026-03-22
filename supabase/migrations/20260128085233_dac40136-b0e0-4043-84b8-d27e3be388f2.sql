-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_path for deduct_inventory function
CREATE OR REPLACE FUNCTION public.deduct_inventory()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.products
    SET inventory_count = inventory_count - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
    AND products.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;