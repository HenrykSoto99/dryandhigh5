import { supabase } from '@/integrations/supabase/client';

export interface TelegramUser {
  id: string;
  telegram_user_id: number;
  telegram_chat_id: number;
  telegram_username?: string;
  first_name?: string;
  onboarding_completed: boolean;
  sobriety_start_date?: string;
  preferred_checkin_morning: string;
  preferred_checkin_evening: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  last_interaction_at?: string;
  conversation_summary?: string;
  emotional_state?: string;
  created_at: string;
  updated_at: string;
}

export interface TelegramMessage {
  id: string;
  user_id: string;
  conversation_id?: string;
  message_type: 'user' | 'bot' | 'system';
  content: string;
  telegram_message_id?: number;
  ai_confidence?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BotEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

export interface CrisisFlag {
  id: string;
  user_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger_keywords: string[];
  response_sent: boolean;
  admin_acknowledged: boolean;
  admin_notes?: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export class TelegramClient {
  static async getUserById(telegramUserId: number): Promise<TelegramUser | null> {
    const { data, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  static async getUserByChatId(chatId: number): Promise<TelegramUser | null> {
    const { data, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user by chat ID:', error);
      return null;
    }

    return data;
  }

  static async updateUser(userId: string, updates: Partial<TelegramUser>) {
    const { data, error } = await supabase
      .from('telegram_users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data;
  }

  static async completeOnboarding(
    userId: string,
    data: {
      sobriety_start_date: string;
      preferred_checkin_morning?: string;
      preferred_checkin_evening?: string;
    }
  ) {
    return this.updateUser(userId, {
      onboarding_completed: true,
      ...data,
    });
  }

  static async getUserMessages(userId: string, limit: number = 20): Promise<TelegramMessage[]> {
    const { data, error } = await supabase
      .from('telegram_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data.reverse();
  }

  static async saveMessage(
    userId: string,
    type: 'user' | 'bot' | 'system',
    content: string,
    conversationId?: string,
    metadata?: Record<string, unknown>
  ): Promise<TelegramMessage> {
    const { data, error } = await supabase
      .from('telegram_messages')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        message_type: type,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      throw error;
    }

    return data;
  }

  static async logEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, unknown> = {},
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): Promise<BotEvent> {
    const { data, error } = await supabase
      .from('bot_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        severity,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging event:', error);
      throw error;
    }

    return data;
  }

  static async getCrisisFlags(userId?: string, onlyUnresolved = true): Promise<CrisisFlag[]> {
    let query = supabase
      .from('crisis_flags')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (onlyUnresolved) {
      query = query.eq('resolved', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching crisis flags:', error);
      return [];
    }

    return data;
  }

  static async createCrisisFlag(
    userId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    triggerKeywords: string[]
  ): Promise<CrisisFlag> {
    const { data, error } = await supabase
      .from('crisis_flags')
      .insert({
        user_id: userId,
        severity,
        trigger_keywords: triggerKeywords,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating crisis flag:', error);
      throw error;
    }

    return data;
  }

  static async updateCrisisFlag(flagId: string, updates: Partial<CrisisFlag>) {
    const { data, error } = await supabase
      .from('crisis_flags')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flagId)
      .select()
      .single();

    if (error) {
      console.error('Error updating crisis flag:', error);
      throw error;
    }

    return data;
  }

  static async getConversationHistory(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('telegram_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return data;
  }

  static async getBotSettings(key: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from('bot_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .maybeSingle();

    if (error) {
      console.error('Error fetching bot settings:', error);
      return null;
    }

    return data?.setting_value || null;
  }

  static async getAllUsers(
    filters?: {
      onboarding_completed?: boolean;
      risk_level?: string;
    }
  ): Promise<TelegramUser[]> {
    let query = supabase.from('telegram_users').select('*');

    if (filters?.onboarding_completed !== undefined) {
      query = query.eq('onboarding_completed', filters.onboarding_completed);
    }

    if (filters?.risk_level) {
      query = query.eq('risk_level', filters.risk_level);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data;
  }

  static calculateSobrietyDays(startDate: string): number {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  }

  static isMilestoneDay(days: number): boolean {
    const milestones = [1, 7, 14, 30, 60, 100, 180, 365];
    return milestones.includes(days);
  }
}
