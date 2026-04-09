/*
  # Telegram Bot Support Companion Database Schema

  ## Overview
  Complete schema for a Telegram-based recovery support bot with AI integration.
  Stores user profiles, conversations, messages, events, and crisis flags.

  ## Tables

  ### telegram_users
  Main user profile table for bot interactions
  - Stores Telegram user identification and profile data
  - Tracks onboarding status and sobriety journey
  - Records check-in preferences and risk assessment

  ### telegram_conversations
  Per-user conversation sessions with context
  - Maintains conversation history and context window
  - Stores conversation summaries for AI context injection
  - Tracks conversation state and timestamps

  ### telegram_messages
  Individual message logs for audit and learning
  - Records all user messages and bot responses
  - Stores message metadata and AI confidence scores
  - Enables conversation replay and debugging

  ### bot_events
  Event logging for user interactions and system events
  - Tracks user actions (start, onboarding, messages, etc.)
  - Records crisis detections and escalations
  - Enables admin monitoring and analytics

  ### crisis_flags
  Crisis detection and escalation tracking
  - Flags users in crisis with severity levels
  - Tracks escalation history and responses
  - Enables priority support routing

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Admins have full read access via app_metadata role
  - Service role enables bot backend write access

  ## Important Notes
  1. telegram_user_id is the unique identifier for each user
  2. Sobriety dates are stored as ISO 8601 timestamps
  3. Risk levels: 'low', 'medium', 'high', 'critical'
  4. Event types: user_started_bot, onboarding_completed, user_message_received, etc.
*/

-- Create telegram_users table
CREATE TABLE IF NOT EXISTS telegram_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint UNIQUE NOT NULL,
  telegram_chat_id bigint UNIQUE NOT NULL,
  telegram_username text,
  first_name text,
  onboarding_completed boolean DEFAULT false,
  sobriety_start_date timestamptz,
  preferred_checkin_morning text DEFAULT '08:00',
  preferred_checkin_evening text DEFAULT '20:00',
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  last_interaction_at timestamptz,
  conversation_summary text,
  emotional_state text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create telegram_conversations table
CREATE TABLE IF NOT EXISTS telegram_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  context_window text,
  conversation_state jsonb DEFAULT '{}',
  message_count integer DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create telegram_messages table
CREATE TABLE IF NOT EXISTS telegram_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES telegram_conversations(id) ON DELETE SET NULL,
  message_type text NOT NULL CHECK (message_type IN ('user', 'bot', 'system')),
  content text NOT NULL,
  telegram_message_id bigint,
  ai_confidence numeric(3,2),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create bot_events table
CREATE TABLE IF NOT EXISTS bot_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (
    event_type IN (
      'user_started_bot',
      'onboarding_completed',
      'user_message_received',
      'ai_response_sent',
      'crisis_keyword_detected',
      'checkin_sent',
      'checkin_answered',
      'conversation_reset',
      'milestone_reached'
    )
  ),
  event_data jsonb DEFAULT '{}',
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at timestamptz DEFAULT now()
);

-- Create crisis_flags table
CREATE TABLE IF NOT EXISTS crisis_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  trigger_keywords text[] DEFAULT '{}',
  trigger_message_id uuid REFERENCES telegram_messages(id) ON DELETE SET NULL,
  response_sent boolean DEFAULT false,
  admin_acknowledged boolean DEFAULT false,
  admin_notes text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bot_settings table for admin configuration
CREATE TABLE IF NOT EXISTS bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_users
CREATE POLICY "Users can view own profile"
  ON telegram_users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = telegram_user_id::text);

CREATE POLICY "Admins can view all users"
  ON telegram_users FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Service role can manage users"
  ON telegram_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for telegram_conversations
CREATE POLICY "Users can view own conversations"
  ON telegram_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM telegram_users
      WHERE telegram_users.id = telegram_conversations.user_id
      AND auth.uid()::text = telegram_users.telegram_user_id::text
    )
  );

CREATE POLICY "Admins can view all conversations"
  ON telegram_conversations FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Service role can manage conversations"
  ON telegram_conversations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for telegram_messages
CREATE POLICY "Users can view own messages"
  ON telegram_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM telegram_users
      WHERE telegram_users.id = telegram_messages.user_id
      AND auth.uid()::text = telegram_users.telegram_user_id::text
    )
  );

CREATE POLICY "Admins can view all messages"
  ON telegram_messages FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Service role can manage messages"
  ON telegram_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for bot_events
CREATE POLICY "Users can view own events"
  ON bot_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM telegram_users
      WHERE telegram_users.id = bot_events.user_id
      AND auth.uid()::text = telegram_users.telegram_user_id::text
    )
  );

CREATE POLICY "Admins can view all events"
  ON bot_events FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Service role can manage events"
  ON bot_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for crisis_flags
CREATE POLICY "Admins can view crisis flags"
  ON crisis_flags FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Service role can manage crisis flags"
  ON crisis_flags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for bot_settings
CREATE POLICY "Admins can manage settings"
  ON bot_settings FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Service role can manage settings"
  ON bot_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_telegram_users_telegram_user_id ON telegram_users(telegram_user_id);
CREATE INDEX idx_telegram_users_telegram_chat_id ON telegram_users(telegram_chat_id);
CREATE INDEX idx_telegram_conversations_user_id ON telegram_conversations(user_id);
CREATE INDEX idx_telegram_messages_user_id ON telegram_messages(user_id);
CREATE INDEX idx_telegram_messages_conversation_id ON telegram_messages(conversation_id);
CREATE INDEX idx_bot_events_user_id ON bot_events(user_id);
CREATE INDEX idx_bot_events_created_at ON bot_events(created_at DESC);
CREATE INDEX idx_crisis_flags_user_id ON crisis_flags(user_id);
CREATE INDEX idx_crisis_flags_resolved ON crisis_flags(resolved);

-- Insert default bot settings
INSERT INTO bot_settings (setting_key, setting_value) VALUES
  ('crisis_keywords', '["tentación", "ansiedad", "caí", "recaída", "quiero tomar", "no puedo más", "fiestas", "cumpleaños", "reunión", "quiero beber", "quiero chupar", "me quiero empedar", "ayudame", "necesito ayuda", "no me siento bien", "socorro", "🆘"]'),
  ('crisis_hotline_mx', '{"name": "Centro de Apoyo", "number": "+52-55-5250-8427", "url": "https://www.gob.mx/inm/articulos/linea-de-ayuda-nacional-de-alcoholicos-anonimos"}'),
  ('milestone_days', '[1, 7, 14, 30, 60, 100, 180, 365]'),
  ('sensitive_dates', '{"new_year": true, "holidays": true, "weekends": true}')
ON CONFLICT (setting_key) DO NOTHING;
