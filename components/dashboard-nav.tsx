"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Shield, LogOut, UserIcon, BarChart3, Map, MessageSquare, Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { handleLogout } from "@/lib/auth-utils"
import type { Profile } from "@/lib/types/database"
import type { User } from "@supabase/supabase-js"

interface DashboardNavProps {
  user: User
  profile: Profile | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await handleLogout()
  }

  const isLeaderOrOfficer = profile?.role === "leader" || profile?.role === "officer" || profile?.role === "admin"

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold">
            <img src="/grid-logo-white.png" alt="GRID" className="h-8 w-8" />
            <span className="text-[#1e1e1e]">GRID</span>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Button asChild variant="ghost">
              <Link href="/dashboard">
                <UserIcon className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/map">
                <Map className="mr-2 h-4 w-4" />
                Map
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/alerts">
                <Bell className="mr-2 h-4 w-4" />
                Alerts
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </Link>
            </Button>
            {isLeaderOrOfficer && (
              <Button asChild variant="ghost">
                <Link href="/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}
