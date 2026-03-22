-- Extend the app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'order_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'inventory_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rider';

-- Create riders table for rider-specific information
CREATE TABLE public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'offline')),
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  vehicle_type TEXT DEFAULT 'motorcycle',
  license_plate TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on riders
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

-- Riders can view and update their own record
CREATE POLICY "Riders can view their own record"
ON public.riders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Riders can update their own record"
ON public.riders FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all riders
CREATE POLICY "Admins can view all riders"
ON public.riders FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert riders"
ON public.riders FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update riders"
ON public.riders FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete riders"
ON public.riders FOR DELETE
USING (is_admin());

-- Create rider_assignments table for order-rider linking
CREATE TABLE public.rider_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  rider_id UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rider_assignments
ALTER TABLE public.rider_assignments ENABLE ROW LEVEL SECURITY;

-- Riders can view their own assignments
CREATE POLICY "Riders can view their assignments"
ON public.rider_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.riders
    WHERE riders.id = rider_assignments.rider_id
    AND riders.user_id = auth.uid()
  )
);

-- Riders can update their assignments
CREATE POLICY "Riders can update their assignments"
ON public.rider_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.riders
    WHERE riders.id = rider_assignments.rider_id
    AND riders.user_id = auth.uid()
  )
);

-- Admins can manage all assignments
CREATE POLICY "Admins can view all assignments"
ON public.rider_assignments FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert assignments"
ON public.rider_assignments FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update assignments"
ON public.rider_assignments FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete assignments"
ON public.rider_assignments FOR DELETE
USING (is_admin());

-- Create order_tracking table for real-time updates
CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on order_tracking
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Anyone can view order tracking (for customer tracking)
CREATE POLICY "Anyone can view order tracking"
ON public.order_tracking FOR SELECT
USING (true);

-- Riders and admins can insert tracking updates
CREATE POLICY "Riders can insert tracking updates"
ON public.order_tracking FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rider_assignments ra
    JOIN public.riders r ON r.id = ra.rider_id
    WHERE ra.order_id = order_tracking.order_id
    AND r.user_id = auth.uid()
  )
  OR is_admin()
);

-- Update trigger for riders table
CREATE TRIGGER update_riders_updated_at
BEFORE UPDATE ON public.riders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Extend profiles RLS so admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_admin());