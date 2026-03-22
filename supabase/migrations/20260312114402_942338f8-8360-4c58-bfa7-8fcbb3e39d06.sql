ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (
  status = ANY (
    ARRAY[
      'unpaid'::text,
      'pending'::text,
      'confirmed'::text,
      'processing'::text,
      'out_for_delivery'::text,
      'delivered'::text,
      'completed'::text,
      'failed'::text,
      'cancelled'::text
    ]
  )
);