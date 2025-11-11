/*
  # Create chat conversations table

  1. New Tables
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `user_id` (text, identifier for session/user)
      - `title` (text, auto-generated from first message)
      - `context_data` (jsonb, stores current view context)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to chat_conversations)
      - `role` (text, 'user' or 'assistant')
      - `content` (text, message content)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (sessions are ephemeral)
*/

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'anonymous',
  title text,
  context_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Public access policies (for anonymous sessions)
CREATE POLICY "Allow public read access to conversations"
  ON chat_conversations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to conversations"
  ON chat_conversations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to conversations"
  ON chat_conversations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to conversations"
  ON chat_conversations
  FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to messages"
  ON chat_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to messages"
  ON chat_messages
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to messages"
  ON chat_messages
  FOR DELETE
  USING (true);