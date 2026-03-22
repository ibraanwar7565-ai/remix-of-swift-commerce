
-- Promo codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL, -- null = unlimited
  uses_count INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track per-user usage
CREATE TABLE public.promo_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Promo codes: publicly readable (active ones), admins manage
CREATE POLICY "Active promo codes are readable" ON public.promo_codes
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Promo code uses: users can see their own, admins all
CREATE POLICY "Users can view their own promo uses" ON public.promo_code_uses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promo uses" ON public.promo_code_uses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all promo uses" ON public.promo_code_uses
  FOR SELECT USING (is_admin());

-- Add promo_code_id to orders for tracking
ALTER TABLE public.orders ADD COLUMN promo_code_id UUID REFERENCES public.promo_codes(id);
ALTER TABLE public.orders ADD COLUMN discount_amount NUMERIC DEFAULT 0;

-- Trigger to update updated_at
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
