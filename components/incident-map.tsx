"use client"

import { useState, useMemo, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Incident, IncidentCategory } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Layers, Filter, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom marker icons based on severity
const createCustomIcon = (severity: number) => {
  const color = severity >= 4 ? "#ef4444" : severity >= 3 ? "#f97316" : "#3b82f6"
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

interface HeatmapLayerProps {
  incidents: Incident[]
  showHeatmap: boolean
}

function HeatmapLayer({ incidents, showHeatmap }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    if (!showHeatmap || incidents.length === 0) return

    // Dynamically import leaflet.heat
    import("leaflet.heat").then((module) => {
      const L = module.default

      const heatData = incidents.map((incident) => [
        incident.latitude,
        incident.longitude,
        incident.severity / 5, // Normalize severity to 0-1
      ])

      const heatLayer = (L as any)
        .heatLayer(heatData, {
          radius: 25,
          blur: 35,
          maxZoom: 17,
          max: 1.0,
          gradient: {
            0.0: "blue",
            0.5: "yellow",
            0.7: "orange",
            1.0: "red",
          },
        })
        .addTo(map)

      return () => {
        map.removeLayer(heatLayer)
      }
    })
  }, [map, incidents, showHeatmap])

  return null
}

interface IncidentMapProps {
  incidents: Incident[]
}

export function IncidentMap({ incidents: initialIncidents }: IncidentMapProps) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "all">("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  const supabase = createClient()

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel("map-incidents-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "incidents" }, (payload) => {
        setIncidents((prev) => [payload.new as Incident, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Category filter
      if (categoryFilter !== "all" && incident.category !== categoryFilter) {
        return false
      }

      // Severity filter
      if (severityFilter !== "all") {
        const minSeverity = Number.parseInt(severityFilter)
        if (incident.severity < minSeverity) {
          return false
        }
      }

      // Date filter
      if (dateFilter !== "all") {
        const incidentDate = new Date(incident.created_at)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24))

        if (dateFilter === "today" && daysDiff > 0) return false
        if (dateFilter === "week" && daysDiff > 7) return false
        if (dateFilter === "month" && daysDiff > 30) return false
      }

      return true
    })
  }, [incidents, categoryFilter, severityFilter, dateFilter])

  const center: [number, number] = useMemo(() => {
    if (filteredIncidents.length === 0) return [40.7128, -74.006] // Default to NYC
    const avgLat = filteredIncidents.reduce((sum, inc) => sum + inc.latitude, 0) / filteredIncidents.length
    const avgLng = filteredIncidents.reduce((sum, inc) => sum + inc.longitude, 0) / filteredIncidents.length
    return [avgLat, avgLng]
  }, [filteredIncidents])

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return "destructive"
    if (severity >= 3) return "default"
    return "secondary"
  }

  const clearFilters = () => {
    setCategoryFilter("all")
    setSeverityFilter("all")
    setDateFilter("all")
  }

  const hasActiveFilters = categoryFilter !== "all" || severityFilter !== "all" || dateFilter !== "all"

  return (
    <div className="relative h-[calc(100vh-73px)]">
      {/* Map Controls */}
      <div className="absolute left-4 top-4 z-[1000] flex flex-col gap-2">
        <Card className="w-64">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Map Controls</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap" className="text-sm">
                Show Heatmap
              </Label>
              <Button
                id="heatmap"
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <Layers className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 space-y-3 border-t pt-3">
                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="vandalism">Vandalism</SelectItem>
                      <SelectItem value="assault">Assault</SelectItem>
                      <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                      <SelectItem value="traffic">Traffic</SelectItem>
                      <SelectItem value="noise">Noise</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Min Severity</Label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="1">1+ (Minor)</SelectItem>
                      <SelectItem value="2">2+ (Low)</SelectItem>
                      <SelectItem value="3">3+ (Moderate)</SelectItem>
                      <SelectItem value="4">4+ (High)</SelectItem>
                      <SelectItem value="5">5 (Critical)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Time Period</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={clearFilters}>
                    <X className="mr-2 h-3 w-3" />
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-64">
          <CardContent className="p-4">
            <div className="text-sm">
              <div className="mb-2 font-semibold">Incidents</div>
              <div className="text-2xl font-bold">{filteredIncidents.length}</div>
              <div className="text-xs text-muted-foreground">
                {hasActiveFilters ? "Filtered results" : "Total incidents"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <HeatmapLayer incidents={filteredIncidents} showHeatmap={showHeatmap} />

        {!showHeatmap &&
          filteredIncidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={createCustomIcon(incident.severity)}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{incident.title}</h3>
                    <Badge variant={getSeverityColor(incident.severity)} className="text-xs">
                      {incident.severity}
                    </Badge>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground line-clamp-3">{incident.description}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>
                      <strong>Category:</strong> {getCategoryLabel(incident.category)}
                    </div>
                    <div>
                      <strong>Status:</strong> {incident.status}
                    </div>
                    {incident.risk_score && (
                      <div>
                        <strong>Risk:</strong> {(incident.risk_score * 100).toFixed(0)}%
                      </div>
                    )}
                    <div>
                      <strong>Reported:</strong>{" "}
                      {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}
