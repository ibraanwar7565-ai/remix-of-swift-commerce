
-- Add delivery detail columns to delivery_addresses
ALTER TABLE public.delivery_addresses
ADD COLUMN IF NOT EXISTS building_name text,
ADD COLUMN IF NOT EXISTS house_number text,
ADD COLUMN IF NOT EXISTS floor text,
ADD COLUMN IF NOT EXISTS delivery_instructions text;
