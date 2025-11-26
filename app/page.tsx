import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, MapPin, MessageSquare, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-1 items-center justify-center bg-[#1e1e1e] px-6 py-20 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-3">
            <img src="/grid-logo-white.png" alt="GRID" className="h-50 w-35" />
            
          </div>
          <h1 className="mb-6 text-balance text-5xl font-bold leading-tight md:text-6xl text-[#fcfaff]">
            Keeping Our Community Safe Together
          </h1>
          <p className="mb-8 text-pretty text-xl text-[#fcfaff]/80 md:text-2xl">
            Report incidents, get AI-powered safety insights, and stay informed with real-time alerts
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-[#ea5c2a] text-[#fcfaff] hover:bg-[#ea5c2a]/90">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[#ea5c2a] text-[#fcfaff] hover:bg-[#ea5c2a]/10 bg-transparent"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">Powerful Features for Community Safety</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ea5c2a]/10">
                <MapPin className="h-8 w-8 text-[#ea5c2a]" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Incident Reporting</h3>
              <p className="text-muted-foreground">Report incidents with location, photos, and detailed descriptions</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ea5c2a]/10">
                <MessageSquare className="h-8 w-8 text-[#ea5c2a]" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Assistant</h3>
              <p className="text-muted-foreground">Get instant safety guidance and risk assessments powered by AI</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ea5c2a]/10">
                <BarChart3 className="h-8 w-8 text-[#ea5c2a]" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Analytics Dashboard</h3>
              <p className="text-muted-foreground">View trends, heatmaps, and insights for informed decision-making</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ea5c2a]/10">
                <Shield className="h-8 w-8 text-[#ea5c2a]" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Real-Time Alerts</h3>
              <p className="text-muted-foreground">Receive instant notifications about high-priority incidents</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-[#1e1e1e] px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-[#fcfaff]/70">
          <p>&copy; 2025 GRID. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
