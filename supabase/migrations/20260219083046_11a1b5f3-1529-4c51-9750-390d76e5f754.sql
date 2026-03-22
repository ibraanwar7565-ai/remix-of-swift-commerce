
ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status = ANY (ARRAY['unpaid', 'pending', 'confirmed', 'processing', 'out_for_delivery', 'completed', 'failed', 'cancelled']));
