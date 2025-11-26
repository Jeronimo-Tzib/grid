import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateWithGoogleAI } from "@/lib/google-ai"
import { safetyChatConfig } from "@/lib/ai-config"

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json()

    const supabase = await createClient()

    // Get recent chat history for context
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    // Build conversation context
    const conversationHistory =
      recentMessages
        ?.reverse()
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n") || ""

    const systemPrompt = `You are a helpful and empathetic Community Safety Assistant. Your role is to:

1. Provide safety guidance and tips for various situations
2. Help users understand how to report incidents effectively
3. Offer emotional support and reassurance
4. Suggest appropriate actions based on the severity of situations
5. Educate about crime prevention and personal safety

Guidelines:
- Be empathetic and supportive
- Provide clear, actionable advice
- Encourage reporting serious incidents to authorities
- Never minimize safety concerns
- Offer practical tips for staying safe
- If someone is in immediate danger, advise them to call emergency services (911)

Previous conversation:
${conversationHistory}

User's current message: ${message}

Respond in a helpful, supportive manner with practical safety advice.`

    const text = await generateWithGoogleAI(systemPrompt, safetyChatConfig)

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json(
      {
        message:
          "I apologize, but I'm having trouble responding right now. If you're in immediate danger, please call 911. Otherwise, please try again in a moment.",
      },
      { status: 200 },
    )
  }
}
