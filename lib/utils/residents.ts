import { createClient } from "@/lib/supabase/client"
import type { Resident } from "@/lib/types/database"

export async function getActiveResidents(): Promise<Resident[]> {
  const supabase = createClient()
  
  console.log("🔍 Fetching residents...")
  console.log("🔍 Supabase client created:", !!supabase)
  
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("is_active", true)
    .order("full_name")
  
  console.log("🔍 Raw response - data:", data, "error:", error)
  
  if (error) {
    console.error("❌ Error fetching residents:", error)
    console.error("❌ Error details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return []
  }
  
  console.log("✅ Residents fetched successfully:", data)
  console.log("✅ Number of residents:", data?.length || 0)
  return data || []
}
