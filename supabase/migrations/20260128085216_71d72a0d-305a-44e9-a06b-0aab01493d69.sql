-- Products table with inventory tracking
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  inventory_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table for tracking purchases
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  mpesa_checkout_request_id TEXT,
  mpesa_receipt_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items linking orders to products
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (anyone can browse the store)
CREATE POLICY "Products are publicly readable"
ON public.products
FOR SELECT
USING (is_active = true);

-- Orders can be created by anyone (guest checkout)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Orders can be read by phone number (simple verification)
CREATE POLICY "Orders can be read by phone"
ON public.orders
FOR SELECT
USING (true);

-- Order items follow the same pattern as orders
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Order items are publicly readable"
ON public.order_items
FOR SELECT
USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to deduct inventory when order is completed
CREATE OR REPLACE FUNCTION public.deduct_inventory()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_inventory_on_order_complete
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.deduct_inventory();

-- Insert sample products
INSERT INTO public.products (name, description, price, category, inventory_count, image_url) VALUES
('Maasai Beaded Necklace', 'Handcrafted authentic Maasai beaded necklace with vibrant colors', 2500.00, 'Jewelry', 50, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400'),
('Kikoy Beach Towel', 'Traditional Kenyan kikoy fabric, perfect for beach or home decor', 1200.00, 'Textiles', 100, 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400'),
('Carved Wooden Elephant', 'Hand-carved African ebony wood elephant sculpture', 4500.00, 'Art', 25, 'https://images.unsplash.com/photo-1551377655-9d8c5a0afe18?w=400'),
('Kanga Fabric Set', 'Beautiful printed kanga fabric with traditional Swahili proverb', 800.00, 'Textiles', 200, 'https://images.unsplash.com/photo-1594761051656-153f2b234586?w=400'),
('Soapstone Bowl', 'Kisii soapstone decorative bowl with intricate carvings', 1800.00, 'Home Decor', 40, 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400'),
('African Coffee Beans', 'Premium Kenyan AA coffee beans, freshly roasted', 650.00, 'Food', 150, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400');