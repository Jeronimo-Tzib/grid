import { createClient } from "@/lib/supabase/client"

export class ChatSessionManager {
  private static instance: ChatSessionManager
  private currentSessionId: string | null = null

  static getInstance(): ChatSessionManager {
    if (!ChatSessionManager.instance) {
      ChatSessionManager.instance = new ChatSessionManager()
    }
    return ChatSessionManager.instance
  }

  // Generate a new session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Start a new chat session
  startNewSession(): string {
    this.currentSessionId = this.generateSessionId()
    console.log('🆕 Started new chat session:', this.currentSessionId)
    return this.currentSessionId
  }

  // Get current session ID
  getCurrentSessionId(): string {
    if (!this.currentSessionId) {
      this.currentSessionId = this.generateSessionId()
    }
    return this.currentSessionId
  }

  // Clear current session (on logout)
  clearSession(): void {
    console.log('🔄 Clearing chat session:', this.currentSessionId)
    this.currentSessionId = null
  }

  // Archive old messages when starting new session
  async archiveOldMessages(userId: string): Promise<void> {
    try {
      const supabase = createClient()
      
      // Mark old messages as archived (you could add an archived column)
      // For now, we'll just clear them from the UI by starting fresh
      console.log('📁 Archiving old messages for user:', userId)
      
      // Optional: Delete very old messages (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', thirtyDaysAgo.toISOString())
      
      if (error) {
        console.warn('⚠️ Could not clean old messages:', error)
      } else {
        console.log('🧹 Cleaned up old messages')
      }
    } catch (error) {
      console.warn('⚠️ Error archiving messages:', error)
    }
  }

  // Get session info
  getSessionInfo(): { sessionId: string | null, isActive: boolean } {
    return {
      sessionId: this.currentSessionId,
      isActive: this.currentSessionId !== null
    }
  }
}

// Export singleton instance
export const chatSession = ChatSessionManager.getInstance()
