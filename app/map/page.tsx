import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { IncidentMap } from "@/components/incident-map"

export default async function MapPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all incidents for the map
  const { data: incidents } = await supabase.from("incidents").select("*").order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1">
        <IncidentMap incidents={incidents || []} />
      </main>
    </div>
  )
}
