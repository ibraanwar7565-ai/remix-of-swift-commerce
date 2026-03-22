
CREATE OR REPLACE FUNCTION public.find_support_user(_exclude_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.user_roles
  WHERE role IN ('admin', 'support')
    AND user_id != _exclude_user_id
  LIMIT 1
$$;
