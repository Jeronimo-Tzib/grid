import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ 
        error: "Admin access required" 
      }, { status: 403 })
    }

    const checks = {
      incidents_table: false,
      new_columns: false,
      status_constraint: false,
      rls_policies: false,
      incident_logs_constraint: false
    }

    const issues = []
    const suggestions = []

    // Check if incidents table exists and has new columns
    try {
      const { data: incident, error: incidentError } = await supabase
        .from("incidents")
        .select("id, status, responded_at, resolved_at, response_time_minutes")
        .limit(1)

      if (!incidentError) {
        checks.incidents_table = true
        
        // Check if new columns exist by looking at the first incident
        if (incident && incident.length > 0) {
          const firstIncident = incident[0]
          if ('responded_at' in firstIncident && 'resolved_at' in firstIncident && 'response_time_minutes' in firstIncident) {
            checks.new_columns = true
          }
        } else {
          // No incidents to check columns, assume they exist if no error
          checks.new_columns = true
        }
      } else {
        issues.push("Cannot access incidents table: " + incidentError.message)
      }
    } catch (error) {
      issues.push("Incidents table check failed: " + (error as Error).message)
    }

    // Try to update an incident with new status to test constraint
    try {
      // First, try to create a test incident with new status
      const { error: statusTestError } = await supabase
        .from("incidents")
        .insert({
          user_id: user.id,
          title: "Schema Test Incident",
          description: "Testing new status values",
          category: "other",
          severity: 1,
          latitude: 0,
          longitude: 0,
          is_anonymous: false,
          status: "dismissed" // Test new status
        })

      if (!statusTestError) {
        checks.status_constraint = true
        
        // Clean up test incident
        await supabase
          .from("incidents")
          .delete()
          .eq("title", "Schema Test Incident")
          .eq("user_id", user.id)
      } else {
        if (statusTestError.code === '23514') {
          issues.push("Status constraint doesn't include new values (dismissed, dispatched, false_alarm)")
          suggestions.push("Run: ALTER TABLE incidents DROP CONSTRAINT incidents_status_check; ALTER TABLE incidents ADD CONSTRAINT incidents_status_check CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text, 'dispatched'::text, 'false_alarm'::text]));")
        } else {
          issues.push("Status constraint test failed: " + statusTestError.message)
        }
      }
    } catch (error) {
      issues.push("Status constraint check failed: " + (error as Error).message)
    }

    // Check incident_logs constraint
    try {
      const { error: logTestError } = await supabase
        .from("incident_logs")
        .insert({
          incident_id: "test-id",
          user_id: user.id,
          action: "dismissed", // Test new action
          details: "Schema test"
        })

      if (!logTestError) {
        checks.incident_logs_constraint = true
        
        // Clean up
        await supabase
          .from("incident_logs")
          .delete()
          .eq("details", "Schema test")
          .eq("user_id", user.id)
      } else {
        if (logTestError.code === '23514') {
          issues.push("Incident logs action constraint doesn't include new actions")
          suggestions.push("Update incident_logs action constraint to include: dismissed, dispatched, false_alarm")
        }
      }
    } catch (error) {
      issues.push("Incident logs constraint check failed: " + (error as Error).message)
    }

    // Check RLS policies by trying to update an incident
    try {
      const { data: testIncidents } = await supabase
        .from("incidents")
        .select("id")
        .limit(1)

      if (testIncidents && testIncidents.length > 0) {
        const { error: updateError } = await supabase
          .from("incidents")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", testIncidents[0].id)

        if (!updateError) {
          checks.rls_policies = true
        } else {
          issues.push("RLS policy prevents incident updates: " + updateError.message)
          suggestions.push("Check that RLS policies allow officers/leaders/admins to update incidents")
        }
      }
    } catch (error) {
      issues.push("RLS policy check failed: " + (error as Error).message)
    }

    const allChecksPass = Object.values(checks).every(check => check === true)

    return NextResponse.json({
      success: allChecksPass,
      message: allChecksPass ? "Database schema is up to date" : "Database schema needs updates",
      checks,
      issues,
      suggestions,
      nextSteps: allChecksPass ? [
        "Your database is ready for incident status management"
      ] : [
        "Run the SQL script: /scripts/008_update_incidents_schema.sql",
        "Or visit /api/migrate-incidents for step-by-step instructions",
        "Restart your application after running the migration"
      ]
    })
    
  } catch (error) {
    console.error("Schema check error:", error)
    return NextResponse.json({ 
      error: "Schema check failed", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
