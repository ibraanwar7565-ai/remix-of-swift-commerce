-- Drop the foreign key constraint on rider_id so expenses can be recorded without a rider
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_rider_id_fkey;

-- Make rider_id nullable so M-Pesa payments can be auto-recorded without a rider
ALTER TABLE public.expenses ALTER COLUMN rider_id DROP NOT NULL;