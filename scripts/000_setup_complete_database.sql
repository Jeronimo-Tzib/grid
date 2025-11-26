-- ============================================
-- Community Safety App - Complete Database Setup
-- ============================================
-- Run this entire script in your Supabase SQL Editor
-- to set up all tables, indexes, and security policies

-- ============================================
-- 1. Enable PostGIS Extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 2. Create Profiles Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader', 'officer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Leaders and officers can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('leader', 'officer', 'admin')
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. Create Incidents Table
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_incidents_location ON public.incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON public.incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- 4. Create Alerts Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON public.alerts(is_active);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active alerts"
  ON public.alerts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Leaders and officers can create alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('leader', 'officer', 'admin')
    )
  );

CREATE POLICY "Leaders and officers can update alerts"
  ON public.alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('leader', 'officer', 'admin')
    )
  );

-- ============================================
-- 5. Create Chat Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders and officers can view all chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('leader', 'officer', 'admin')
    )
  );

-- ============================================
-- 6. Create Incident Insights Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.incident_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  incident_count INTEGER NOT NULL DEFAULT 0,
  avg_severity DECIMAL(3, 2),
  avg_risk_score DECIMAL(3, 2),
  high_risk_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, category)
);

CREATE INDEX IF NOT EXISTS idx_incident_insights_date ON public.incident_insights(date DESC);

ALTER TABLE public.incident_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaders and officers can view insights"
  ON public.incident_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('leader', 'officer', 'admin')
    )
  );

-- Function to update insights
CREATE OR REPLACE FUNCTION public.update_incident_insights()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.incident_insights (date, category, incident_count, avg_severity, avg_risk_score, high_risk_count)
  SELECT
    DATE(created_at) as date,
    category,
    COUNT(*) as incident_count,
    AVG(severity) as avg_severity,
    AVG(risk_score) as avg_risk_score,
    COUNT(*) FILTER (WHERE risk_score > 0.8 OR severity >= 4) as high_risk_count
  FROM public.incidents
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(created_at), category
  ON CONFLICT (date, category)
  DO UPDATE SET
    incident_count = EXCLUDED.incident_count,
    avg_severity = EXCLUDED.avg_severity,
    avg_risk_score = EXCLUDED.avg_risk_score,
    high_risk_count = EXCLUDED.high_risk_count,
    created_at = NOW();
END;
$$;

-- ============================================
-- 7. Create Auto-Alert Trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.create_alert_for_high_risk_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (NEW.risk_score > 0.8 OR NEW.severity >= 4) THEN
    INSERT INTO public.alerts (incident_id, title, message, severity, expires_at)
    VALUES (
      NEW.id,
      'High-Risk Incident Alert: ' || NEW.category,
      'A ' || NEW.category || ' incident with ' || 
      CASE 
        WHEN NEW.severity >= 4 THEN 'high severity'
        ELSE 'elevated risk'
      END || ' has been reported in your area. Stay vigilant and follow safety protocols.',
      NEW.severity,
      NOW() + INTERVAL '24 hours'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_alert_for_high_risk ON public.incidents;

CREATE TRIGGER trigger_create_alert_for_high_risk
  AFTER INSERT ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.create_alert_for_high_risk_incident();

-- ============================================
-- Setup Complete!
-- ============================================
-- You can now use the application with a fully configured database
