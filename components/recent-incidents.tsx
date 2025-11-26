"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import type { Incident, IncidentStatus } from "@/lib/types/database"
import { MapPin, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { IncidentStatusManager } from "./incident-status-manager"

interface RecentIncidentsProps {
  userRole?: string
}

export function RecentIncidents({ userRole = "member" }: RecentIncidentsProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchIncidents() {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (!error && data) {
        setIncidents(data)
      }
      setLoading(false)
    }

    fetchIncidents()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("incidents-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "incidents" }, (payload) => {
        setIncidents((prev) => [payload.new as Incident, ...prev].slice(0, 10))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return "destructive"
    if (severity >= 3) return "default"
    return "secondary"
  }

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const handleStatusUpdate = (incidentId: string, newStatus: IncidentStatus) => {
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus }
          : incident
      )
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Incidents</CardTitle>
        <CardDescription>Latest reported incidents in your community</CardDescription>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <p className="text-muted-foreground">No incidents reported yet.</p>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="flex gap-4 rounded-lg border p-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{incident.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(incident.severity)}>Severity {incident.severity}</Badge>
                      <IncidentStatusManager 
                        incident={incident} 
                        userRole={userRole}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{incident.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {getCategoryLabel(incident.category)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                    </span>
                    {incident.risk_score && (
                      <Badge variant="outline" className="text-xs">
                        Risk: {(incident.risk_score * 100).toFixed(0)}%
                      </Badge>
                    )}
                    {incident.response_time_minutes && (
                      <Badge variant="outline" className="text-xs">
                        Response: {incident.response_time_minutes}m
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
