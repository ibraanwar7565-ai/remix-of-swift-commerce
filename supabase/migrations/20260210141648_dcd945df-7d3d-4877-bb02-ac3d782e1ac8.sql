-- Enable realtime for rider_assignments so riders get instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_assignments;