import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect("/auth/login")
  }

  // Try to get profile with detailed error handling
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Enhanced debugging
  console.log("=== ANALYTICS PAGE DEBUG ===")
  console.log("User ID:", user.id)
  console.log("User Email:", user.email)
  console.log("Profile data:", JSON.stringify(profile, null, 2))
  console.log("Profile error:", profileError)
  console.log("Profile found:", !!profile)
  console.log("Profile role:", profile?.role)
  console.log("Role type:", typeof profile?.role)
  console.log("Allowed roles:", ["leader", "officer", "admin"])
  console.log("Role includes check:", profile?.role ? ["leader", "officer", "admin"].includes(profile.role) : false)

  // Also try to get all profiles to see what exists
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from("profiles")
    .select("id, email, role")
    .limit(10)
  
  console.log("All profiles sample:", JSON.stringify(allProfiles, null, 2))
  console.log("All profiles error:", allProfilesError)
  console.log("===========================")

  // Check if profile exists
  if (!profile) {
    console.error("❌ No profile found for user:", user.id)
    console.error("Profile lookup error:", profileError)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border bg-white p-8 shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Profile Not Found</h2>
          <p className="text-gray-700 mb-4">No profile exists for your user ID: {user.id}</p>
          <p className="text-sm text-gray-500">Check your database or contact support.</p>
        </div>
      </div>
    )
  }

  // Check if user has access to analytics
  const normalizedRole = profile?.role?.toString().toLowerCase().trim()
  const allowedRoles = ["leader", "officer", "admin"]
  const hasAccess = normalizedRole && allowedRoles.includes(normalizedRole)
  
  // Enhanced debugging
  console.log("=== ROLE CHECK DEBUG ===")
  console.log("Original role:", profile?.role)
  console.log("Normalized role:", normalizedRole)
  console.log("Role type:", typeof profile?.role)
  console.log("Allowed roles:", allowedRoles)
  console.log("Has access:", hasAccess)
  console.log("=======================")
  
  if (!hasAccess) {
    console.log("❌ Access denied. User role:", profile?.role)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border bg-white p-8 shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">Your role <strong>"{profile?.role}"</strong> does not have access to analytics.</p>
          <p className="text-sm text-gray-500 mb-4">Required roles: leader, officer, or admin</p>
          <div className="bg-gray-100 p-3 rounded text-xs">
            <p className="font-semibold mb-1">Debug Info:</p>
            <p>User ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Raw role: {JSON.stringify(profile?.role)}</p>
            <p>Normalized: {normalizedRole}</p>
          </div>
          <a href="/dashboard" className="text-blue-600 hover: underline">← Back to Dashboard</a>
        </div>
      </div>
    )
  }

  console.log("✅ Access granted!")

  // Fetch analytics data
  const { data: incidents } = await supabase.from("incidents").select("*").order("created_at", { ascending: false })

  const { data: insights } = await supabase
    .from("incident_insights")
    .select("*")
    .order("date", { ascending: false })
    .limit(30)

  const { data: alerts } = await supabase.from("alerts").select("*").eq("is_active", true)

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1 bg-muted/30 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive insights and trends for community safety</p>
            {/* Debug info - remove after fixing */}
            <div className="mt-4 rounded bg-green-50 border border-green-200 p-3 text-sm">
              <p className="font-semibold text-green-800">✅ Access Granted</p>
              <p className="text-green-700">Role: <strong>{profile?.role}</strong> (normalized: {normalizedRole}) | User: {user.email}</p>
            </div>
          </div>
          <AnalyticsDashboard incidents={incidents || []} insights={insights || []} alerts={alerts || []} />
        </div>
      </main>
    </div>
  )
}