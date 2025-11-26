import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { status, notes } = await request.json()
    
    // Check if user is authenticated
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

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check permissions - only officers, leaders, and admins can update incident status
    if (!['officer', 'leader', 'admin'].includes(profile.role)) {
      return NextResponse.json({ 
        error: "Permission denied", 
        message: "Only officers, leaders, and admins can update incident status" 
      }, { status: 403 })
    }

    // Validate status
    const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed', 'dispatched', 'false_alarm']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status", 
        validStatuses 
      }, { status: 400 })
    }

    // Get current incident
    const { data: currentIncident, error: fetchError } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Fetch incident error:", fetchError)
      return NextResponse.json({ 
        error: "Failed to fetch incident", 
        details: fetchError.message,
        suggestion: "Check if the incident exists and RLS policies allow access"
      }, { status: 500 })
    }

    if (!currentIncident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Set timestamps based on status
    if (status === 'dispatched' && !currentIncident.responded_at) {
      updateData.responded_at = new Date().toISOString()
    }
    
    if (status === 'resolved' && !currentIncident.resolved_at) {
      updateData.resolved_at = new Date().toISOString()
      
      // Calculate response time if we have responded_at
      if (currentIncident.responded_at) {
        const respondedAt = new Date(currentIncident.responded_at)
        const resolvedAt = new Date(updateData.resolved_at)
        updateData.response_time_minutes = Math.round((resolvedAt.getTime() - respondedAt.getTime()) / (1000 * 60))
      }
    }

    // Update the incident
    const { data: updatedIncident, error: updateError } = await supabase
      .from("incidents")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Update incident error:", updateError)
      
      // Provide specific error messages based on the error
      if (updateError.code === '23514') {
        return NextResponse.json({ 
          error: "Database schema not updated", 
          message: "The incidents table doesn't support the new status values. Please run the schema migration.",
          details: updateError.message,
          suggestion: "Run the SQL script at /scripts/008_update_incidents_schema.sql"
        }, { status: 500 })
      }
      
      if (updateError.code === '42703') {
        return NextResponse.json({ 
          error: "Missing database columns", 
          message: "The incidents table is missing required columns. Please run the schema migration.",
          details: updateError.message,
          suggestion: "Run the SQL script at /scripts/008_update_incidents_schema.sql"
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: "Failed to update incident status", 
        details: updateError.message,
        code: updateError.code,
        suggestion: "Check RLS policies and database schema"
      }, { status: 500 })
    }

    // Log the status change
    try {
      await supabase
        .from("incident_logs")
        .insert({
          incident_id: params.id,
          user_id: user.id,
          action: status === 'dismissed' ? 'dismissed' : 
                  status === 'dispatched' ? 'dispatched' : 
                  status === 'resolved' ? 'resolved' : 
                  status === 'false_alarm' ? 'false_alarm' : 'updated',
          details: notes || `Status changed to ${status}`,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn("Failed to log incident status change:", logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Incident status updated to ${status}`,
      incident: updatedIncident,
      updatedBy: {
        id: user.id,
        email: user.email,
        role: profile.role
      }
    })
    
  } catch (error) {
    console.error("Incident status update error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
