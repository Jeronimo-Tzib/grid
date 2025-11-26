import { NextResponse } from "next/server"
import { generateWithGoogleAI } from "@/lib/google-ai"

export async function GET() {
  try {
    console.log('🧪 Testing Google AI API (Gemini 2.5 Flash)...')
    
    const testPrompt = "Hello! Please respond with a simple greeting to test the Gemini 2.5 Flash API connection."
    
    const response = await generateWithGoogleAI(testPrompt, {
      maxTokens: 100,
      temperature: 0.5
    })
    
    return NextResponse.json({
      success: true,
      message: "Gemini 2.5 Flash is working!",
      model: "gemini-2.5-flash",
      testPrompt,
      aiResponse: response,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Google AI test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      suggestion: "Check if the API key is valid and the endpoint URL is correct",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Set in environment" : "Using fallback key",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
