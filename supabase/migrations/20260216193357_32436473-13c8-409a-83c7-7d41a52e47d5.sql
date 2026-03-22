-- Add service_type to products for multi-service support
ALTER TABLE public.products 
ADD COLUMN service_type text NOT NULL DEFAULT 'grocery';

-- Create index for filtering by service
CREATE INDEX idx_products_service_type ON public.products(service_type);

-- Add a comment for allowed values
COMMENT ON COLUMN public.products.service_type IS 'Service type: food, grocery, pharmacy, courier';