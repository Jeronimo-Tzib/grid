"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Incident, IncidentStatus } from "@/lib/types/database"
import { ChevronDown, Clock, CheckCircle, X, AlertTriangle, Send, Shield } from "lucide-react"

interface IncidentStatusManagerProps {
  incident: Incident
  userRole: string
  onStatusUpdate?: (incidentId: string, newStatus: IncidentStatus) => void
}

export function IncidentStatusManager({ incident, userRole, onStatusUpdate }: IncidentStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const canManageStatus = userRole === "officer" || userRole === "leader" || userRole === "admin"

  const statusOptions: { value: IncidentStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "pending", label: "Pending", icon: <Clock className="h-4 w-4" />, color: "secondary" },
    { value: "reviewing", label: "Under Review", icon: <AlertTriangle className="h-4 w-4" />, color: "default" },
    { value: "dispatched", label: "Dispatched", icon: <Send className="h-4 w-4" />, color: "default" },
    { value: "resolved", label: "Resolved", icon: <CheckCircle className="h-4 w-4" />, color: "default" },
    { value: "dismissed", label: "Dismissed", icon: <X className="h-4 w-4" />, color: "secondary" },
    { value: "false_alarm", label: "False Alarm", icon: <Shield className="h-4 w-4" />, color: "destructive" },
  ]

  const currentStatus = statusOptions.find(s => s.value === incident.status)

  const handleStatusUpdate = async (newStatus: IncidentStatus) => {
    if (!canManageStatus) {
      toast({
        title: "Permission Denied",
        description: "Only officers, leaders, and admins can update incident status",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      // Use the new API endpoint for status updates
      const response = await fetch(`/api/incidents/${incident.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: `Status changed to ${statusOptions.find(s => s.value === newStatus)?.label}`
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (result.error === "Database schema not updated") {
          toast({
            title: "Database Update Required",
            description: "The database schema needs to be updated. Please contact an administrator.",
            variant: "destructive",
          })
          console.error("Schema migration needed:", result.suggestion)
          return
        }
        
        if (result.error === "Missing database columns") {
          toast({
            title: "Database Migration Required",
            description: "Missing database columns. Please run the schema migration.",
            variant: "destructive",
          })
          console.error("Missing columns:", result.suggestion)
          return
        }
        
        throw new Error(result.message || result.error || 'Failed to update status')
      }

      toast({
        title: "Status Updated",
        description: `Incident status changed to ${statusOptions.find(s => s.value === newStatus)?.label}`,
      })

      onStatusUpdate?.(incident.id, newStatus)
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update incident status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!canManageStatus) {
    return (
      <Badge variant={currentStatus?.color as any}>
        {currentStatus?.icon}
        <span className="ml-1">{currentStatus?.label}</span>
      </Badge>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isUpdating}>
          {currentStatus?.icon}
          <span className="ml-1">{currentStatus?.label}</span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => handleStatusUpdate(status.value)}
            disabled={status.value === incident.status}
            className="flex items-center gap-2"
          >
            {status.icon}
            {status.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
