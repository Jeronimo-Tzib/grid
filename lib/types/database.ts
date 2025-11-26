export type UserRole = "member" | "leader" | "officer" | "admin"

export type IncidentCategory = "theft" | "vandalism" | "assault" | "suspicious_activity" | "traffic" | "noise" | "other"

export type IncidentStatus = "pending" | "reviewing" | "resolved" | "dismissed" | "dispatched" | "false_alarm"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  resident_id: string | null
  created_at: string
  updated_at: string
}

export interface Resident {
  id: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Incident {
  id: string
  user_id: string | null
  title: string
  description: string
  category: IncidentCategory
  severity: number
  risk_score: number | null
  latitude: number
  longitude: number
  address: string | null
  is_anonymous: boolean
  status: IncidentStatus
  media_urls: string[] | null
  created_at: string
  updated_at: string
  responded_at: string | null
  resolved_at: string | null
  response_time_minutes: number | null
}

export interface Alert {
  id: string
  incident_id: string | null
  title: string
  message: string
  severity: number
  is_active: boolean
  created_at: string
  expires_at: string | null
}

export interface ChatMessage {
  id: string
  user_id: string
  role: "user" | "assistant" | "system"
  content: string
  incident_id: string | null
  created_at: string
}

export interface IncidentInsight {
  id: string
  date: string
  category: IncidentCategory
  incident_count: number
  avg_severity: number | null
  avg_risk_score: number | null
  high_risk_count: number
  created_at: string
}
