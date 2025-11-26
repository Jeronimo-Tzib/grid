import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { AlertsManager } from "@/components/alerts-manager"

export default async function AlertsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all alerts
  const { data: alerts } = await supabase
    .from("alerts")
    .select("*, incidents(*)")
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1 bg-muted/30 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Safety Alerts</h1>
            <p className="text-muted-foreground">Stay informed about high-priority incidents in your community</p>
          </div>
          <AlertsManager alerts={alerts || []} userRole={profile?.role || "member"} />
        </div>
      </main>
    </div>
  )
}
