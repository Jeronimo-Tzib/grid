// Google AI Configuration
// Note: Install @ai-sdk/google package first: npm install @ai-sdk/google

// For now, we'll use a direct approach with the Google AI API
export const GOOGLE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'AIzaSyBOWJ83UBKCBJ5S9kPiGVrsCjUfWuuCvS0'

// Google AI Model Configuration - Using Gemini 2.5 Flash (stable & high RPM)
export const aiModel = {
  provider: 'google',
  model: 'gemini-2.5-flash',
  apiKey: GOOGLE_AI_API_KEY,
  version: 'v1beta'
}

// AI Configuration - Optimized for Gemini 2.5 Flash
export const aiConfig = {
  maxTokens: 600, // Increased for better responses
  temperature: 0.7,
  topP: 0.9,
}

// Safety settings for community safety context - Enhanced for 2.5 Flash
export const safetyChatConfig = {
  maxTokens: 800, // More detailed safety responses
  temperature: 0.6, // Slightly more conservative for safety advice
  topP: 0.8,
}

// Analysis settings for incident risk assessment - Improved for 2.5 Flash
export const analysisConfig = {
  maxTokens: 300, // More detailed analysis
  temperature: 0.3, // More deterministic for analysis
  topP: 0.7,
}
