import { createClient } from "@/lib/supabase/client"
import { chatSession } from "@/lib/chat-session"

export async function handleLogout() {
  try {
    const supabase = createClient()
    
    // Clear chat session before logout
    chatSession.clearSession()
    console.log('🔄 Chat session cleared on logout')
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Logout error:', error)
      throw error
    }
    
    console.log('✅ Successfully logged out')
    
    // Redirect to login page
    window.location.href = '/auth/login'
    
  } catch (error) {
    console.error('❌ Error during logout:', error)
    // Still redirect even if there's an error
    window.location.href = '/auth/login'
  }
}

export function clearChatOnLogin() {
  // Clear any existing chat session when user logs in
  chatSession.clearSession()
  console.log('🆕 Chat session cleared for fresh login')
}
