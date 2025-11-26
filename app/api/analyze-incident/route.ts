import { NextResponse } from "next/server"
import { generateWithGoogleAI } from "@/lib/google-ai"
import { analysisConfig } from "@/lib/ai-config"

export async function POST(request: Request) {
  try {
    const { title, description, category, severity } = await request.json()

    const prompt = `Analyze this community safety incident and provide a risk assessment:

Title: ${title}
Description: ${description}
Category: ${category}
Reported Severity: ${severity}/5

Based on this information:
1. Provide a risk score between 0 and 1 (where 0 is no risk and 1 is extreme risk)
2. Provide a brief safety recommendation (1-2 sentences)

Respond in JSON format:
{
  "riskScore": <number between 0 and 1>,
  "recommendation": "<brief safety recommendation>"
}`

    const text = await generateWithGoogleAI(prompt, analysisConfig)

    // Parse the AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return NextResponse.json(analysis)
    }

    // Fallback if parsing fails
    return NextResponse.json({
      riskScore: severity / 5,
      recommendation: "Stay alert and follow standard safety protocols.",
    })
  } catch (error) {
    console.error("[v0] Error analyzing incident:", error)
    return NextResponse.json(
      {
        riskScore: 0.5,
        recommendation: "Unable to analyze. Please exercise caution.",
      },
      { status: 200 },
    )
  }
}
