import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    return NextResponse.json({
      error: "RLS Policy Issue Detected",
      issue: "Infinite recursion in profiles table policies",
      solution: {
        problem: "The policy 'Leaders and officers can view all profiles' creates infinite recursion",
        sqlToRun: [
          "-- Connect to your Supabase database as superuser and run:",
          "DROP POLICY IF EXISTS \"Leaders and officers can view all profiles\" ON public.profiles;",
          "",
          "-- Create a simpler policy:",
          "CREATE POLICY \"Users can view all profiles\"",
          "  ON public.profiles FOR SELECT",
          "  USING (auth.uid() IS NOT NULL);",
          "",
          "-- Then create the missing profile:",
          "INSERT INTO public.profiles (id, email, role, created_at, updated_at)",
          "VALUES (",
          "  '3b4d3b68-5303-48b3-a4d4-962cfd99ce52',",
          "  '2023159736@ub.edu.bz',",
          "  'leader',",
          "  NOW(),",
          "  NOW()",
          ") ON CONFLICT (id) DO NOTHING;"
        ],
        instructions: [
          "1. Go to your Supabase dashboard",
          "2. Navigate to SQL Editor",
          "3. Run the SQL commands above",
          "4. The profile will be created and the recursion issue fixed"
        ]
      }
    })
    
  } catch (error) {
    console.error("Fix RLS error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
