import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { IncidentReportForm } from "@/components/incident-report-form"

export default async function ReportPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1 bg-muted/30 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Report an Incident</h1>
            <p className="text-muted-foreground">Help keep our community safe by reporting incidents</p>
          </div>
          <IncidentReportForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
