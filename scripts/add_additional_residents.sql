-- Add additional residents to the database
-- Insert the new residents along with the original three

INSERT INTO public.residents (full_name) VALUES
  -- Original residents
  ('Bartholomew Johnson'),
  ('Quandale Dingle'),
  ('Jeronimo Tzib'),
  -- New residents
  ('Maya Serrano'),
  ('Daniel Okoye'),
  ('Priya Nambiar'),
  ('Marcus Green'),
  ('Elena Rossi'),
  ('Jamal Thompson'),
  ('Sofia Alvarez'),
  ('Kaito Watanabe'),
  ('Amara Mensah'),
  ('Tomas Novak')
ON CONFLICT (full_name) DO NOTHING;

-- Verify the residents were added
SELECT 'Total residents:' as info, count(*) as count FROM public.residents;
SELECT 'Active residents:' as info, full_name FROM public.residents WHERE is_active = true ORDER BY full_name;
