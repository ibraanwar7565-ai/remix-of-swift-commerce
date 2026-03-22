
CREATE POLICY "Branch admins can insert expenses"
ON public.expenses FOR INSERT
TO public
WITH CHECK (
  is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id()
);

CREATE POLICY "Branch admins can manage expenses"
ON public.expenses FOR ALL
TO public
USING (
  is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id()
)
WITH CHECK (
  is_admin() AND NOT is_main_admin() AND branch_id = get_user_branch_id()
);
