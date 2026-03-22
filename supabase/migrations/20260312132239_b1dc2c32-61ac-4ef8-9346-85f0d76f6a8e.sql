
CREATE OR REPLACE FUNCTION public.get_profile_display(_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = _user_id
  LIMIT 1
$$;
