"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Incident, IncidentInsight, Alert } from "@/lib/types/database"
import { ResponseTimeChart } from "./response-time-chart"
import { TrendingUp, TrendingDown, AlertTriangle, Shield, MapPin, Activity } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useMemo } from "react"

interface AnalyticsDashboardProps {
  incidents: Incident[]
  insights: IncidentInsight[]
  alerts: Alert[]
}

export function AnalyticsDashboard({ incidents, insights, alerts }: AnalyticsDashboardProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recentIncidents = incidents.filter((i) => new Date(i.created_at) >= last30Days)
    const weekIncidents = incidents.filter((i) => new Date(i.created_at) >= last7Days)

    const highRiskCount = recentIncidents.filter((i) => i.risk_score && i.risk_score > 0.7).length
    const avgSeverity = recentIncidents.reduce((sum, i) => sum + i.severity, 0) / (recentIncidents.length || 1)

    // Calculate trend (compare last 7 days to previous 7 days)
    const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const prevWeekIncidents = incidents.filter(
      (i) => new Date(i.created_at) >= prev7Days && new Date(i.created_at) < last7Days,
    )
    const trend = weekIncidents.length - prevWeekIncidents.length

    return {
      total: recentIncidents.length,
      weekTotal: weekIncidents.length,
      highRisk: highRiskCount,
      avgSeverity: avgSeverity.toFixed(1),
      activeAlerts: alerts.length,
      trend,
    }
  }, [incidents, alerts])

  // Category distribution
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {}
    incidents.forEach((incident) => {
      categories[incident.category] = (categories[incident.category] || 0) + 1
    })
    return Object.entries(categories).map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }))
  }, [incidents])

  // Severity distribution
  const severityData = useMemo(() => {
    const severities: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    incidents.forEach((incident) => {
      severities[incident.severity] = (severities[incident.severity] || 0) + 1
    })
    return Object.entries(severities).map(([severity, count]) => ({
      severity: `Level ${severity}`,
      count,
    }))
  }, [incidents])

  // Time series data (last 30 days)
  const timeSeriesData = useMemo(() => {
    const days: Record<string, number> = {}
    const now = new Date()

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split("T")[0]
      days[dateStr] = 0
    }

    // Count incidents per day
    incidents.forEach((incident) => {
      const dateStr = incident.created_at.split("T")[0]
      if (days[dateStr] !== undefined) {
        days[dateStr]++
      }
    })

    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      incidents: count,
    }))
  }, [incidents])

  // Top risk areas
  const riskAreas = useMemo(() => {
    const areas: Record<string, { count: number; avgRisk: number; totalRisk: number }> = {}

    incidents.forEach((incident) => {
      if (!areas[incident.category]) {
        areas[incident.category] = { count: 0, avgRisk: 0, totalRisk: 0 }
      }
      areas[incident.category].count++
      areas[incident.category].totalRisk += incident.risk_score || 0
    })

    return Object.entries(areas)
      .map(([category, data]) => ({
        category: category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        count: data.count,
        avgRisk: ((data.totalRisk / data.count) * 100).toFixed(0),
      }))
      .sort((a, b) => Number.parseFloat(b.avgRisk) - Number.parseFloat(a.avgRisk))
      .slice(0, 5)
  }, [incidents])

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1"]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents (30d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="flex items-center text-xs text-muted-foreground">
              {stats.trend > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500">+{stats.trend}</span>
                </>
              ) : stats.trend < 0 ? (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">{stats.trend}</span>
                </>
              ) : (
                <span>No change</span>
              )}{" "}
              from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground">Risk score &gt; 70%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Severity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSeverity}</div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incident Trends</CardTitle>
            <CardDescription>Daily incident reports over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Incidents by category type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => {
                    const percent = entry.percent ?? 0
                    return `${entry.name} ${(percent * 100).toFixed(0)}%`
                  }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Incidents grouped by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Risk Categories</CardTitle>
            <CardDescription>Categories with highest average risk scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskAreas.map((area, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{area.category}</span>
                      <span className="text-sm text-muted-foreground">{area.count} incidents</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
                        style={{ width: `${area.avgRisk}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {area.avgRisk}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ResponseTimeChart showDetailed={true} userRole="admin" />
        
        {/* Recent High-Risk Incidents */}
        <Card>
        <CardHeader>
          <CardTitle>Recent High-Risk Incidents</CardTitle>
          <CardDescription>Incidents requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incidents
              .filter((i) => i.risk_score && i.risk_score > 0.7)
              .slice(0, 5)
              .map((incident) => (
                <div key={incident.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-semibold">{incident.title}</h4>
                      <Badge variant="destructive">High Risk</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{incident.description}</p>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>Category: {incident.category.replace(/_/g, " ")}</span>
                      <span>Severity: {incident.severity}/5</span>
                      <span>Risk: {((incident.risk_score || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            {incidents.filter((i) => i.risk_score && i.risk_score > 0.7).length === 0 && (
              <p className="text-center text-muted-foreground">No high-risk incidents at this time</p>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}