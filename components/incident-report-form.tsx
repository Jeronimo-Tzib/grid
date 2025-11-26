"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPinIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { LocationPicker } from "@/components/location-picker"
import type { IncidentCategory } from "@/lib/types/database"

interface IncidentReportFormProps {
  userId: string
}

export function IncidentReportForm({ userId }: IncidentReportFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<IncidentCategory>("other")
  const [severity, setSeverity] = useState("2")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{ riskScore: number; recommendation: string } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
  }

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
        },
        (error) => {
          setError("Unable to get your location. Please select on the map.")
        },
      )
    } else {
      setError("Geolocation is not supported by your browser.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!latitude || !longitude) {
      setError("Please select a location on the map or use your current location.")
      setIsSubmitting(false)
      return
    }

    try {
      // First, analyze with AI
      const aiResponse = await fetch("/api/analyze-incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          severity: Number.parseInt(severity),
        }),
      })

      let riskScore = 0.5
      let recommendation = "Stay alert and follow safety protocols."

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        riskScore = aiData.riskScore
        recommendation = aiData.recommendation
        setAiAnalysis({ riskScore, recommendation })
      }

      // Insert incident
      const { error: insertError } = await supabase.from("incidents").insert({
        user_id: isAnonymous ? null : userId,
        title,
        description,
        category,
        severity: Number.parseInt(severity),
        risk_score: riskScore,
        latitude,
        longitude,
        location: `POINT(${longitude} ${latitude})`,
        is_anonymous: isAnonymous,
        status: "pending",
      })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit incident")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-600" />
          <h2 className="mb-2 text-2xl font-bold">Incident Reported Successfully</h2>
          <p className="mb-4 text-center text-muted-foreground">
            Thank you for helping keep our community safe. Redirecting to dashboard...
          </p>
          {aiAnalysis && (
            <Alert className="mt-4 max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>AI Analysis:</strong> Risk Score: {(aiAnalysis.riskScore * 100).toFixed(0)}%
                <br />
                {aiAnalysis.recommendation}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
              <CardDescription>Provide information about the incident</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the incident"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about what happened..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as IncidentCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="vandalism">Vandalism</SelectItem>
                      <SelectItem value="assault">Assault</SelectItem>
                      <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                      <SelectItem value="traffic">Traffic Incident</SelectItem>
                      <SelectItem value="noise">Noise Complaint</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Minor</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Moderate</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(!!checked)}
                />
                <Label htmlFor="anonymous" className="cursor-pointer text-sm font-normal">
                  Report anonymously
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Select the incident location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleGetCurrentLocation}
              >
                <MapPinIcon className="mr-2 h-4 w-4" />
                Use My Current Location
              </Button>

              <LocationPicker onLocationSelect={handleLocationSelect} selectedLat={latitude} selectedLng={longitude} />

              {latitude && longitude && (
                <p className="text-sm text-muted-foreground">
                  Selected: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
