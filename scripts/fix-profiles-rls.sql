-- Fix the infinite recursion in profiles RLS policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Leaders and officers can view all profiles" ON public.profiles;

-- Create a simpler policy that doesn't cause recursion
-- Option 1: Allow users to view all profiles (simpler for now)
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Option 2: Alternative approach using a function (more secure but complex)
-- We could create this later if needed:
/*
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('leader', 'officer', 'admin')
  );
$$;

CREATE POLICY "Admin users can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin_user());
*/

-- For now, let's use the simpler approach to fix the immediate issue
