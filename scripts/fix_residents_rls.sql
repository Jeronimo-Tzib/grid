-- Temporary fix for residents RLS policy
-- This allows unauthenticated users to view active residents for the dropdown

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view active residents" ON public.residents;

-- Create a more permissive policy that allows anyone to view active residents
-- This is needed for the login/signup dropdowns to work
CREATE POLICY "Anyone can view active residents"
  ON public.residents FOR SELECT
  USING (is_active = true);

-- Keep the admin policy for management
DROP POLICY IF EXISTS "Admins can manage residents" ON public.residents;
CREATE POLICY "Admins can manage residents"
  ON public.residents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
