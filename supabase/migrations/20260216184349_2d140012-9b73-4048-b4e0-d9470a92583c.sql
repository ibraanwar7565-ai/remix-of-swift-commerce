-- Add email column to otp_codes for email-based OTP
ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS email text;
