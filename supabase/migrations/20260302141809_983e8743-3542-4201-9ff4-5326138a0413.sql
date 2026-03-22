
-- Update products RLS to allow inventory_manager role to manage products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Admins and inventory managers can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (is_admin() OR has_role(auth.uid(), 'inventory_manager'));

CREATE POLICY "Admins and inventory managers can update products"
ON public.products FOR UPDATE
TO authenticated
USING (is_admin() OR has_role(auth.uid(), 'inventory_manager'));

CREATE POLICY "Admins and inventory managers can delete products"
ON public.products FOR DELETE
TO authenticated
USING (is_admin() OR has_role(auth.uid(), 'inventory_manager'));
