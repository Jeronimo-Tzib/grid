"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getActiveResidents } from "@/lib/utils/residents"
import type { Resident } from "@/lib/types/database"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [residentId, setResidentId] = useState("")
  const [residents, setResidents] = useState<Resident[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchResidents = async () => {
      console.log("🔑 Login: Fetching residents...")
      const activeResidents = await getActiveResidents()
      console.log("🔑 Login: Residents received:", activeResidents)
      setResidents(activeResidents)
    }
    fetchResidents()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!residentId) {
      setError("Please select your name from the resident list")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Verify that the user's profile has the matching resident ID
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("resident_id")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          throw new Error("Failed to verify resident information")
        }

        if (profile.resident_id !== residentId) {
          await supabase.auth.signOut()
          throw new Error("The selected resident name does not match your account")
        }
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
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
          <p className="mt-2 text-[#1e1e1e]/90"><b>Keeping our community safe together</b></p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
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
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
