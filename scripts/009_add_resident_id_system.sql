-- Add ResidentID system to restrict access to verified residents only

-- Create residents table to store approved resident names
CREATE TABLE IF NOT EXISTS public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on residents table
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view active residents" ON public.residents;
DROP POLICY IF EXISTS "Admins can manage residents" ON public.residents;

-- Policy for residents table - all authenticated users can view residents for validation
CREATE POLICY "Users can view active residents"
  ON public.residents FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Only admins can manage residents
CREATE POLICY "Admins can manage residents"
  ON public.residents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert predefined residents
INSERT INTO public.residents (full_name) VALUES
  ('Bartholomew Johnson'),
  ('Quandale Dingle'),
  ('Jeronimo Tzib')
ON CONFLICT (full_name) DO NOTHING;

-- Add resident_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES public.residents(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_resident_id ON public.profiles(resident_id);

-- Update the handle_new_user function to validate resident_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resident_exists BOOLEAN := false;
BEGIN
  -- Check if resident_id is provided and valid
  IF NEW.raw_user_meta_data->>'resident_id' IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.residents 
      WHERE id = (NEW.raw_user_meta_data->>'resident_id')::UUID 
      AND is_active = true
    ) INTO resident_exists;
    
    -- If resident_id is provided but invalid, raise an error
    IF NOT resident_exists THEN
      RAISE EXCEPTION 'Invalid or inactive resident ID provided';
    END IF;
  ELSE
    -- If no resident_id provided, raise an error
    RAISE EXCEPTION 'Resident ID is required for registration';
  END IF;

  -- Insert profile with resident_id
  INSERT INTO public.profiles (id, email, full_name, role, resident_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    (NEW.raw_user_meta_data->>'resident_id')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update existing profiles to have a default resident before adding constraint
-- Assign all existing profiles without resident_id to 'Jeronimo Tzib' as default
UPDATE public.profiles 
SET resident_id = (SELECT id FROM public.residents WHERE full_name = 'Jeronimo Tzib' LIMIT 1)
WHERE resident_id IS NULL;

-- Add constraint to ensure profiles must have a resident_id (after updating existing records)
-- Drop existing constraint if it exists
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_resident_id_required;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_resident_id_required 
CHECK (resident_id IS NOT NULL);
