# AI Configuration Setup Guide

## Add Google AI API Key to Environment

Add this to your `.env.local` file:

```bash
# Google AI API Key
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyBOWJ83UBKCBJ5S9kPiGVrsCjUfWuuCvS0

# Existing Supabase keys (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## What This Enables

✅ **AI Chat Assistant** - Powered by Google Gemini  
✅ **Incident Risk Analysis** - Automatic risk scoring  
✅ **Safety Recommendations** - AI-generated safety tips  

## Files Updated

- `/app/api/chat/route.ts` - Chat endpoint using Google AI
- `/app/api/analyze-incident/route.ts` - Incident analysis endpoint
- `/lib/ai-config.ts` - AI configuration helper

The API key provided will be used for all AI features in your community safety application.
