-- Create incident insights table for aggregated analytics
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_incident_insights_date ON public.incident_insights(date DESC);

-- Enable RLS
ALTER TABLE public.incident_insights ENABLE ROW LEVEL SECURITY;

-- Policies for incident insights
CREATE POLICY "Leaders and officers can view insights"
  ON public.incident_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('leader', 'officer', 'admin')
    )
  );

-- Function to update insights (called by trigger or scheduled job)
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
