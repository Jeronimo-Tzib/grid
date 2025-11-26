-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('theft', 'vandalism', 'assault', 'suspicious_activity', 'traffic', 'noise', 'other')),
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  risk_score DECIMAL(3, 2) CHECK (risk_score BETWEEN 0 AND 1),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  media_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_location ON public.incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON public.incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Policies for incidents
CREATE POLICY "Anyone can view incidents"
  ON public.incidents FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own incidents"
  ON public.incidents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders and officers can update any incident"
  ON public.incidents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('leader', 'officer', 'admin')
    )
  );

CREATE POLICY "Users can delete their own incidents"
  ON public.incidents FOR DELETE
  USING (auth.uid() = user_id);
