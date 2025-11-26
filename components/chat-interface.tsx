"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { chatSession } from "@/lib/chat-session"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChatMessage } from "@/lib/types/database"
import { Bot, Send, User, Loader2, Shield } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatInterfaceProps {
  userId: string
  initialMessages: ChatMessage[]
}

export function ChatInterface({ userId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Initialize chat session on component mount
  useEffect(() => {
    const newSessionId = chatSession.startNewSession()
    setSessionId(newSessionId)
    
    // Clean up old messages if needed
    chatSession.archiveOldMessages(userId)
    
    // Cleanup function for when component unmounts or user logs out
    return () => {
      console.log('🔄 Chat interface unmounting, preserving session')
    }
  }, [userId])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      console.log('💬 Sending message:', userMessage)
      
      // Save user message
      const { data: savedUserMessage, error: userError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          role: "user",
          content: userMessage,
        })
        .select()
        .single()

      if (userError) {
        console.error('❌ Error saving user message:', userError)
        throw userError
      }

      console.log('✅ User message saved')
      setMessages((prev) => [...prev, savedUserMessage])

      // Get AI response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to get AI response")

      const { message: aiMessage } = await response.json()

      // Save AI message
      const { data: savedAiMessage, error: aiError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          role: "assistant",
          content: aiMessage,
        })
        .select()
        .single()

      if (aiError) throw aiError

      setMessages((prev) => [...prev, savedAiMessage])
    } catch (error) {
      console.error("[v0] Chat error:", error)
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        user_id: userId,
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        incident_id: null,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    "What should I do if I witness a theft?",
    "How can I stay safe while walking at night?",
    "What information should I include when reporting an incident?",
    "How do I recognize suspicious activity?",
  ]

  return (
    <div className="mx-auto flex h-[calc(100vh-73px)] max-w-5xl flex-col p-6">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Safety Assistant</CardTitle>
              <CardDescription>Get instant safety guidance and support</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([])
                chatSession.startNewSession()
                console.log('🆕 Chat cleared and new session started')
              }}
            >
              Clear Chat
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">Welcome to Safety Assistant</h3>
              <p className="mb-6 text-muted-foreground">
                I'm here to help you with safety guidance, incident reporting tips, and emergency support.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto whitespace-normal p-3 text-left text-sm bg-transparent"
                    onClick={() => setInput(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p className="mt-2 text-xs opacity-70">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask me anything about safety..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="resize-none"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="h-auto">
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </Card>
    </div>
  )
}
