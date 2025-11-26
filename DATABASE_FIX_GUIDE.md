# Database Schema Fix Guide

## Issue
The incident status update is failing because the database schema is missing:
1. New status options (`dispatched`, `false_alarm`)
2. Response time tracking columns
3. Proper RLS policies for updates

## Solution

### Step 1: Run Database Migration

Go to your **Supabase Dashboard → SQL Editor** and run this SQL:

```sql
-- Update incidents table to support new status options and response time tracking

-- Add new status options to the CHECK constraint
ALTER TABLE public.incidents 
DROP CONSTRAINT IF EXISTS incidents_status_check;

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
DROP CONSTRAINT IF EXISTS incident_logs_action_check;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_responded_at ON public.incidents(responded_at);
CREATE INDEX IF NOT EXISTS idx_incidents_response_time ON public.incidents(response_time_minutes);
```

### Step 2: Test the Fix

After running the migration, you can test if it works by:

1. **Navigate to** `/api/test-incident-update` (POST request)
2. **Or try updating an incident status** in the UI

### Step 3: Verify Schema

Your incidents table should now have:

**New Columns:**
- `responded_at` (timestamp with time zone)
- `resolved_at` (timestamp with time zone) 
- `response_time_minutes` (integer)

**Updated Status Options:**
- `pending`, `reviewing`, `resolved`, `dismissed`, `dispatched`, `false_alarm`

**RLS Policies:**
- Users can view all incidents
- Users can create incidents
- Only officers/leaders/admins can update incidents

## What This Fixes

✅ **Status Management:** Officers can now update incident status to all 6 options  
✅ **Response Time Tracking:** Automatic tracking when status changes to "dispatched"  
✅ **RLS Permissions:** Proper access control for incident updates  
✅ **Database Constraints:** Status field accepts new values  

## Troubleshooting

If you still get errors after running the migration:

1. **Check RLS Policies:** Make sure the user has the correct role in the profiles table
2. **Verify Columns:** Confirm the new columns were added to the incidents table
3. **Test API:** Use `/api/test-incident-update` to get detailed error information
4. **Check Constraints:** Ensure the status constraint includes all 6 status options

## API Endpoints for Testing

- **GET** `/api/migrate-incidents` - Shows the migration SQL
- **POST** `/api/test-incident-update` - Tests if incident updates work
- **GET** `/api/debug-profile` - Checks user profile and permissions
