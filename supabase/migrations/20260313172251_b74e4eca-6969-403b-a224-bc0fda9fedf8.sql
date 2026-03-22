
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow admins and inventory managers to upload
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (public.is_admin() OR public.has_role(auth.uid(), 'inventory_manager')));

-- Allow admins to delete product images
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (public.is_admin() OR public.has_role(auth.uid(), 'inventory_manager')));

-- Public read access
CREATE POLICY "Product images are publicly readable" ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
