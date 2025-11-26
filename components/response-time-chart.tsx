"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, TrendingDown } from "lucide-react"
import type { Incident } from "@/lib/types/database"

interface ResponseTimeStats {
  averageResponseTime: number
  totalResponses: number
  fastestResponse: number
  slowestResponse: number
  trend: "up" | "down" | "stable"
  recentIncidents: Array<{
    id: string
    title: string
    responseTime: number
    status: string
    created_at: string
  }>
}

interface ResponseTimeChartProps {
  showDetailed?: boolean
  userRole?: string
}

export function ResponseTimeChart({ showDetailed = false, userRole = "member" }: ResponseTimeChartProps) {
  const [stats, setStats] = useState<ResponseTimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchResponseTimeData() {
      try {
        // Get incidents with response times from the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: incidents, error } = await supabase
          .from("incidents")
          .select("*")
          .not("response_time_minutes", "is", null)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching response time data:", error)
          return
        }

        if (!incidents || incidents.length === 0) {
          setStats({
            averageResponseTime: 0,
            totalResponses: 0,
            fastestResponse: 0,
            slowestResponse: 0,
            trend: "stable",
            recentIncidents: []
          })
          return
        }

        const responseTimes = incidents
          .filter(i => i.response_time_minutes !== null)
          .map(i => i.response_time_minutes as number)

        const averageResponseTime = Math.round(
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        )

        const fastestResponse = Math.min(...responseTimes)
        const slowestResponse = Math.max(...responseTimes)

        // Calculate trend (compare last 15 days vs previous 15 days)
        const fifteenDaysAgo = new Date()
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

        const recentIncidents = incidents.filter(i => 
          new Date(i.created_at) >= fifteenDaysAgo && i.response_time_minutes !== null
        )
        const olderIncidents = incidents.filter(i => 
          new Date(i.created_at) < fifteenDaysAgo && i.response_time_minutes !== null
        )

        let trend: "up" | "down" | "stable" = "stable"
        if (recentIncidents.length > 0 && olderIncidents.length > 0) {
          const recentAvg = recentIncidents.reduce((sum, i) => sum + (i.response_time_minutes || 0), 0) / recentIncidents.length
          const olderAvg = olderIncidents.reduce((sum, i) => sum + (i.response_time_minutes || 0), 0) / olderIncidents.length
          
          if (recentAvg > olderAvg * 1.1) trend = "up"
          else if (recentAvg < olderAvg * 0.9) trend = "down"
        }

        setStats({
          averageResponseTime,
          totalResponses: responseTimes.length,
          fastestResponse,
          slowestResponse,
          trend,
          recentIncidents: incidents.slice(0, 5).map(i => ({
            id: i.id,
            title: i.title,
            responseTime: i.response_time_minutes || 0,
            status: i.status,
            created_at: i.created_at
          }))
        })
      } catch (error) {
        console.error("Error calculating response time stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResponseTimeData()
  }, [supabase])

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getTrendText = (trend: string) => {
    switch (trend) {
      case "up":
        return "Response times increasing"
      case "down":
        return "Response times improving"
      default:
        return "Response times stable"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Times</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.totalResponses === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Times</CardTitle>
          <CardDescription>Average officer response times</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No response data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Response Times
        </CardTitle>
        <CardDescription>
          {showDetailed ? "Detailed response time analytics" : "Average officer response times"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatTime(stats.averageResponseTime)}
              </div>
              <p className="text-sm text-muted-foreground">Average Response</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.totalResponses}
              </div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
            </div>
          </div>

          {/* Trend */}
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-muted/50">
            {getTrendIcon(stats.trend)}
            <span className="text-sm">{getTrendText(stats.trend)}</span>
          </div>

          {/* Detailed Stats for Admins */}
          {showDetailed && (userRole === "admin" || userRole === "leader") && (
            <div className="space-y-3 border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fastest:</span>
                  <span className="ml-2 font-medium">{formatTime(stats.fastestResponse)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Slowest:</span>
                  <span className="ml-2 font-medium">{formatTime(stats.slowestResponse)}</span>
                </div>
              </div>

              {/* Recent Incidents */}
              <div>
                <h4 className="font-medium mb-2">Recent Responses</h4>
                <div className="space-y-2">
                  {stats.recentIncidents.map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{incident.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {formatTime(incident.responseTime)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
