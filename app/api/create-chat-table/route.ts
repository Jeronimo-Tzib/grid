import { NextResponse } from "next/server"

export async function GET() {
  const migrationSQL = `
-- Create chat_messages table for AI chat functionality

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  incident_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE SET NULL
);

-- Enable RLS on chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
-- Users can only view their own chat messages
CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own chat messages
CREATE POLICY "Users can create their own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own chat messages (for editing)
CREATE POLICY "Users can update their own chat messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own chat messages
CREATE POLICY "Users can delete their own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_incident_id ON public.chat_messages(incident_id);
`

  return NextResponse.json({
    error: "Missing chat_messages table",
    message: "The chat_messages table needs to be created in your database",
    solution: {
      instructions: [
        "1. Go to your Supabase Dashboard",
        "2. Navigate to SQL Editor",
        "3. Run the SQL migration below",
        "4. This will create the chat_messages table with proper RLS policies"
      ],
      sql: migrationSQL.split('\n').filter(line => line.trim() !== ''),
      tableSchema: {
        name: "chat_messages",
        columns: [
          "id (uuid, primary key)",
          "user_id (uuid, foreign key to auth.users)",
          "role (text, 'user'|'assistant'|'system')",
          "content (text, message content)",
          "incident_id (uuid, optional link to incidents)",
          "created_at (timestamp with time zone)"
        ],
        policies: [
          "Users can only access their own chat messages",
          "Full CRUD permissions for message owners"
        ]
      }
    }
  })
}
