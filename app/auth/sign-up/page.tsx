"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getActiveResidents } from "@/lib/utils/residents"
import type { Resident } from "@/lib/types/database"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [residentId, setResidentId] = useState("")
  const [residents, setResidents] = useState<Resident[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchResidents = async () => {
      console.log("📋 SignUp: Fetching residents...")
      const activeResidents = await getActiveResidents()
      console.log("📋 SignUp: Residents received:", activeResidents)
      setResidents(activeResidents)
    }
    fetchResidents()
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    if (!residentId) {
      setError("Please select your name from the resident list")
      setIsLoading(false)
      return
    }


    try {
      console.log("🚀 Starting sign-up process...")
      console.log("Email:", email)
      console.log("Full Name:", fullName)
      console.log("Password length:", password.length)
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing")
      console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing")
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: "member",
            resident_id: residentId,
          },
        },
      })
      
      console.log("Sign-up response:", { data, error })
      
      if (error) {
        console.error("❌ Sign-up error:", error)
        throw error
      }
      
      if (data?.user && !data.user.email_confirmed_at) {
        console.log("✅ User created, email confirmation required")
        setError("Please check your email and click the confirmation link to complete your registration.")
        return
      }
      
      console.log("✅ Sign-up successful, redirecting...")
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      console.error("❌ Sign-up failed:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred during sign-up"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fcfaff] p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-3">
            <img src="/final logo black version.png" alt="GRID" className="h-50 w-35" />
            
          </div>
          <p className="mt-2 text-[#1e1e1e]/90"><b>Join us in making our community safer</b></p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Sign up to start reporting and tracking incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="residentId">Select Your Name</Label>
                  <Select value={residentId} onValueChange={setResidentId} required>
                    <SelectTrigger>
                      <SelectValue placeholder={residents.length === 0 ? "Loading residents..." : "Choose your name from the list"} />
                    </SelectTrigger>
                    <SelectContent>
                      {residents.length === 0 ? (
                        <SelectItem value="no-residents" disabled>
                          No residents available. Please run the database migration first.
                        </SelectItem>
                      ) : (
                        residents.map((resident) => (
                          <SelectItem key={resident.id} value={resident.id}>
                            {resident.full_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}