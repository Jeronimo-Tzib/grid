import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and has permission
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !['officer', 'leader', 'admin'].includes(profile.role)) {
      return NextResponse.json({ 
        error: "Permission denied", 
        message: "Only officers, leaders, and admins can update incidents" 
      }, { status: 403 })
    }

    // Test: Try to get an incident and update it
    const { data: incidents, error: fetchError } = await supabase
      .from("incidents")
      .select("*")
      .limit(1)

    if (fetchError) {
      return NextResponse.json({
        error: "Failed to fetch incidents",
        details: fetchError,
        suggestion: "Check RLS policies on incidents table"
      }, { status: 500 })
    }

    if (!incidents || incidents.length === 0) {
      return NextResponse.json({
        message: "No incidents found to test with",
        userRole: profile.role,
        canProceed: false
      })
    }

    const testIncident = incidents[0]
    
    // Try to update the incident status
    const { data: updatedIncident, error: updateError } = await supabase
      .from("incidents")
      .update({ 
        status: 'reviewing',
        updated_at: new Date().toISOString()
      })
      .eq("id", testIncident.id)
      .select()

    if (updateError) {
      return NextResponse.json({
        error: "Failed to update incident",
        details: updateError,
        testIncident: {
          id: testIncident.id,
          currentStatus: testIncident.status,
          title: testIncident.title
        },
        userInfo: {
          id: user.id,
          email: user.email,
          role: profile.role
        },
        suggestions: [
          "The incidents table may not have proper RLS policies for updates",
          "The status constraint may not include the new status values",
          "The table may be missing the new columns (responded_at, resolved_at, response_time_minutes)"
        ]
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Incident update test successful",
      testResult: {
        incidentId: testIncident.id,
        originalStatus: testIncident.status,
        updatedIncident: updatedIncident?.[0],
        userRole: profile.role
      }
    })
    
  } catch (error) {
    console.error("Test update error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
