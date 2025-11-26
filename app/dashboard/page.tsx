import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { RecentIncidents } from "@/components/recent-incidents"
import { ActiveAlerts } from "@/components/active-alerts"
import { ResponseTimeChart } from "@/components/response-time-chart"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1 bg-[#fcfaff] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1e1e1e]">Dashboard</h1>
              <p className="text-[#1e1e1e]/70">Welcome back, {profile?.full_name || user.email}</p>
            </div>
            <Button asChild size="lg" className="bg-[#ea5c2a] hover:bg-[#ea5c2a]/90">
              <Link href="/report">
                <Plus className="mr-2 h-5 w-5" />
                Report Incident
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentIncidents userRole={profile?.role || "member"} />
            </div>
            <div className="space-y-6">
              <ActiveAlerts />
              <ResponseTimeChart userRole={profile?.role || "member"} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
