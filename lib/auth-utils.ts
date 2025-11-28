import { createClient } from "@/lib/supabase/client"
import { chatSession } from "@/lib/chat-session"

export async function handleLogout() {
  try {
    const supabase = createClient()
    
    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      try {
        // Delete all chat messages for the current user
        const { error: deleteError } = await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', user.id)
        
        if (deleteError) {
          console.error('Error deleting chat messages:', deleteError)
          // Continue with logout even if message deletion fails
        } else {
          console.log('✅ Deleted chat messages for user:', user.id)
        }
      } catch (deleteError) {
        console.error('Exception while deleting chat messages:', deleteError)
      }
    }
    
    // Clear chat session
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
