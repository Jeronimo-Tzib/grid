# Fix: Missing chat_messages Table

## Error
```
{code: 'PGRST205', details: null, hint: null, message: "Could not find the table 'public.chat_messages' in the schema cache"}
```

## Solution

The `chat_messages` table needs to be created in your database. Run this SQL in your **Supabase Dashboard → SQL Editor**:

```sql
-- Create chat messages table for AI assistant
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat messages
CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## What This Creates

**Table: `chat_messages`**
- `id` - Unique identifier for each message
- `user_id` - Links to the user who sent the message  
- `role` - Either 'user', 'assistant', or 'system'
- `content` - The actual message text
- `incident_id` - Optional link to a specific incident
- `created_at` - Timestamp when message was created

**Security:**
- Users can only see their own chat messages
- Users can only create messages for themselves
- Proper foreign key constraints and cascading deletes

## After Running This SQL

✅ **Chat functionality will work** - `/chat` page will load properly  
✅ **AI assistant will respond** - Messages will be saved to database  
✅ **Chat history will persist** - Previous conversations will be remembered  

## Alternative: Use API Endpoint

You can also visit `/api/create-chat-table` to get the exact SQL needed.

## Files Fixed

- `scripts/005_create_chat_messages.sql` - Removed problematic RLS policy
- Added proper chat table schema with safe RLS policies

Run the SQL above and your chat functionality will be fully operational! 🚀
