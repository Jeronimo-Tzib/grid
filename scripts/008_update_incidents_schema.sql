-- Update incidents table to support new status options and response time tracking

-- Add new status options to the CHECK constraint
ALTER TABLE public.incidents 
DROP CONSTRAINT incidents_status_check;

ALTER TABLE public.incidents 
ADD CONSTRAINT incidents_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text, 'dispatched'::text, 'false_alarm'::text]));

-- Add response time tracking columns
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS response_time_minutes integer;

-- Update incident_logs action constraint to include new actions
ALTER TABLE public.incident_logs 
DROP CONSTRAINT incident_logs_action_check;

ALTER TABLE public.incident_logs 
ADD CONSTRAINT incident_logs_action_check 
CHECK (action = ANY (ARRAY['created'::text, 'updated'::text, 'resolved'::text, 'dismissed'::text, 'alert_triggered'::text, 'dispatched'::text, 'false_alarm'::text]));

-- Create or update RLS policies for incidents table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Officers can update incidents" ON public.incidents;

-- Enable RLS on incidents table
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Policy for viewing incidents - all authenticated users can view
CREATE POLICY "Users can view incidents"
  ON public.incidents FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy for creating incidents - all authenticated users can create
CREATE POLICY "Users can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating incidents - only officers, leaders, and admins can update
CREATE POLICY "Officers can update incidents"
  ON public.incidents FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('officer', 'leader', 'admin')
    )
  );

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_responded_at ON public.incidents(responded_at);
CREATE INDEX IF NOT EXISTS idx_incidents_response_time ON public.incidents(response_time_minutes);
