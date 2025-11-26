// Custom Google AI implementation using direct API calls
// This will work until @ai-sdk/google is properly installed

const GOOGLE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'AIzaSyBOWJ83UBKCBJ5S9kPiGVrsCjUfWuuCvS0'

export async function generateWithGoogleAI(prompt: string, config: any = {}) {
  const {
    maxTokens = 500,
    temperature = 0.7,
    topP = 0.9
  } = config

  try {
    console.log('🤖 Calling Google AI API (Gemini 2.5 Flash)...')
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature,
          topP,
          maxOutputTokens: maxTokens,
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google AI API Error:', response.status, errorText)
      
      // Handle quota exceeded errors specifically
      if (response.status === 429) {
        console.warn('⚠️ API quota exceeded. Consider upgrading your Google AI plan.')
        throw new Error('AI service temporarily unavailable due to quota limits. Please try again later.')
      }
      
      throw new Error(`Google AI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Google AI API response received')
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text
      console.log('📝 AI Response length:', responseText.length, 'characters')
      return responseText
    }
    
    console.error('❌ No valid response from Google AI:', data)
    throw new Error('No response from Google AI')
  } catch (error) {
    console.error('Google AI API error:', error)
    throw error
  }
}
