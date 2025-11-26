import { NextResponse } from "next/server"

const GOOGLE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'AIzaSyBOWJ83UBKCBJ5S9kPiGVrsCjUfWuuCvS0'

export async function GET() {
  try {
    console.log('📋 Listing available Google AI models...')
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GOOGLE_AI_API_KEY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to list models:', response.status, errorText)
      return NextResponse.json({
        success: false,
        error: `Failed to list models: ${response.status} - ${errorText}`,
        timestamp: new Date().toISOString()
      }, { status: response.status })
    }
    
    const data = await response.json()
    console.log('✅ Models retrieved successfully')
    
    // Filter models that support generateContent
    const generateContentModels = data.models?.filter((model: any) => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || []
    
    return NextResponse.json({
      success: true,
      message: "Available Google AI models retrieved",
      totalModels: data.models?.length || 0,
      generateContentModels: generateContentModels.length,
      availableModels: generateContentModels.map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedMethods: model.supportedGenerationMethods
      })),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error listing models:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      suggestion: "Check if the API key is valid",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
