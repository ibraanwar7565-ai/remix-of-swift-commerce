
-- Create expenses table to track cash collected by riders
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  rider_id UUID NOT NULL REFERENCES public.riders(id),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'cash_collection',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (is_admin());

-- Riders can view their own expenses
CREATE POLICY "Riders can view their expenses" ON public.expenses FOR SELECT
  USING (EXISTS (SELECT 1 FROM riders WHERE riders.id = expenses.rider_id AND riders.user_id = auth.uid()));

-- Riders can insert their own expenses
CREATE POLICY "Riders can insert expenses" ON public.expenses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM riders WHERE riders.id = expenses.rider_id AND riders.user_id = auth.uid()));
