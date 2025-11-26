"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Alert } from "@/lib/types/database"
import { AlertTriangle, CheckCircle, Clock, Bell, BellOff, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface AlertWithIncident extends Alert {
  incidents?: {
    title: string
    category: string
    latitude: number
    longitude: number
  } | null
}

interface AlertsManagerProps {
  alerts: AlertWithIncident[]
  userRole: string
}

export function AlertsManager({ alerts: initialAlerts, userRole }: AlertsManagerProps) {
  const [alerts, setAlerts] = useState<AlertWithIncident[]>(initialAlerts)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    // Check notification permission
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }

    // Subscribe to real-time alert updates
    const channel = supabase
      .channel("alerts-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, async (payload) => {
        const newAlert = payload.new as Alert

        // Fetch incident details if available
        if (newAlert.incident_id) {
          const { data: incident } = await supabase
            .from("incidents")
            .select("*")
            .eq("id", newAlert.incident_id)
            .single()

          const alertWithIncident: AlertWithIncident = {
            ...newAlert,
            incidents: incident
              ? {
                  title: incident.title,
                  category: incident.category,
                  latitude: incident.latitude,
                  longitude: incident.longitude,
                }
              : null,
          }

          setAlerts((prev) => [alertWithIncident, ...prev])

          // Show browser notification if enabled
          if (notificationsEnabled && newAlert.is_active) {
            new Notification("New Safety Alert", {
              body: newAlert.message,
              icon: "/favicon.ico",
            })
          }

          // Show toast notification
          toast({
            title: "New Safety Alert",
            description: newAlert.title,
            variant: newAlert.severity >= 4 ? "destructive" : "default",
          })
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "alerts" }, (payload) => {
        const updatedAlert = payload.new as Alert
        setAlerts((prev) => prev.map((alert) => (alert.id === updatedAlert.id ? { ...alert, ...updatedAlert } : alert)))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, notificationsEnabled, toast])

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === "granted")
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive browser notifications for new alerts",
        })
      }
    }
  }

  const handleDismissAlert = async (alertId: string) => {
    if (userRole !== "leader" && userRole !== "officer" && userRole !== "admin") {
      toast({
        title: "Permission Denied",
        description: "Only leaders and officers can dismiss alerts",
        variant: "destructive",
      })
      return
    }

    const { error } = await supabase.from("alerts").update({ is_active: false }).eq("id", alertId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Alert Dismissed",
        description: "The alert has been marked as inactive",
      })
    }
  }

  const handleMemberFeedback = (alertId: string) => {
    toast({
      title: "Feedback Noted",
      description: "Thank you for your feedback. Officers have been notified.",
    })
    // In a real implementation, this would log feedback to the database
  }

  const activeAlerts = alerts.filter((a) => a.is_active)
  const dismissedAlerts = alerts.filter((a) => !a.is_active)

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return "destructive"
    if (severity >= 3) return "default"
    return "secondary"
  }

  const getSeverityIcon = (severity: number) => {
    if (severity >= 4) return <AlertTriangle className="h-5 w-5" />
    return <Bell className="h-5 w-5" />
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive safety alerts</CardDescription>
            </div>
            <Button
              variant={notificationsEnabled ? "default" : "outline"}
              onClick={requestNotificationPermission}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enabled
                </>
              ) : (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Enable Notifications
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed ({dismissedAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-16 w-16 text-green-600" />
                <h3 className="mb-2 text-xl font-semibold">No Active Alerts</h3>
                <p className="text-center text-muted-foreground">
                  There are currently no active safety alerts in your area. Stay vigilant and report any incidents you
                  observe.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-destructive">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-destructive">{getSeverityIcon(alert.severity)}</div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant={getSeverityColor(alert.severity)}>Severity {alert.severity}</Badge>
                        </div>
                        <CardDescription className="text-base">{alert.message}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(userRole === "leader" || userRole === "officer" || userRole === "admin") && (
                        <Button variant="outline" size="sm" onClick={() => handleDismissAlert(alert.id)}>
                          Dismiss
                        </Button>
                      )}
                      {userRole === "member" && (
                        <Button variant="outline" size="sm" onClick={() => handleMemberFeedback(alert.id)}>
                          <MessageSquare className="mr-1 h-3 w-3" />
                          Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                    {alert.incidents && (
                      <>
                        <span>Category: {alert.incidents.category.replace(/_/g, " ")}</span>
                        <span>
                          Location: {alert.incidents.latitude.toFixed(4)}, {alert.incidents.longitude.toFixed(4)}
                        </span>
                      </>
                    )}
                    {alert.expires_at && (
                      <span>Expires: {formatDistanceToNow(new Date(alert.expires_at), { addSuffix: true })}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          {dismissedAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">No dismissed alerts</CardContent>
            </Card>
          ) : (
            dismissedAlerts.map((alert) => (
              <Card key={alert.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <Badge variant="outline">Dismissed</Badge>
                      </div>
                      <CardDescription>{alert.message}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
