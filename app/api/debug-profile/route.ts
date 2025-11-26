import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    console.log("=== PROFILE DEBUG API ===")
    console.log("User ID:", user.id)
    console.log("User Email:", user.email)
    
    // Try to get the specific user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    
    console.log("Profile data:", JSON.stringify(profile, null, 2))
    console.log("Profile error:", profileError)
    
    // Get all profiles to see what exists
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .limit(20)
    
    console.log("All profiles:", JSON.stringify(allProfiles, null, 2))
    console.log("All profiles error:", allProfilesError)
    
    // Try to create profile if it doesn't exist
    if (!profile && !profileError?.message?.includes("Multiple")) {
      console.log("Attempting to create missing profile...")
      
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          role: "leader" // Set as leader since mentioned they have leader privileges
        })
        .select()
        .single()
      
      console.log("Profile creation result:", { newProfile, createError })
      
      return NextResponse.json({
        message: "Debug complete - attempted to create profile",
        user: { id: user.id, email: user.email },
        originalProfile: profile,
        profileError,
        allProfiles,
        allProfilesError,
        newProfile,
        createError
      })
    }
    
    return NextResponse.json({
      message: "Debug complete",
      user: { id: user.id, email: user.email },
      profile,
      profileError,
      allProfiles,
      allProfilesError
    })
    
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
