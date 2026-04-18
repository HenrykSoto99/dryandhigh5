export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bot_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          severity: Database["public"]["Enums"]["severity_enum"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          severity?: Database["public"]["Enums"]["severity_enum"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          severity?: Database["public"]["Enums"]["severity_enum"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      broadcast_campaigns: {
        Row: {
          content: string
          created_at: string
          id: string
          recipients_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_by: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      crisis_flags: {
        Row: {
          admin_acknowledged: boolean
          admin_notes: string | null
          created_at: string
          id: string
          resolved: boolean
          resolved_at: string | null
          response_sent: boolean
          severity: Database["public"]["Enums"]["risk_level_enum"]
          trigger_keywords: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_acknowledged?: boolean
          admin_notes?: string | null
          created_at?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          response_sent?: boolean
          severity: Database["public"]["Enums"]["risk_level_enum"]
          trigger_keywords?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_acknowledged?: boolean
          admin_notes?: string | null
          created_at?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          response_sent?: boolean
          severity?: Database["public"]["Enums"]["risk_level_enum"]
          trigger_keywords?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crisis_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      mexican_holidays: {
        Row: {
          alert_sent: boolean
          created_at: string
          description: string | null
          holiday_date: string
          id: string
          name: string
        }
        Insert: {
          alert_sent?: boolean
          created_at?: string
          description?: string | null
          holiday_date: string
          id?: string
          name: string
        }
        Update: {
          alert_sent?: boolean
          created_at?: string
          description?: string | null
          holiday_date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_conversations: {
        Row: {
          context: Json | null
          created_at: string
          current_step: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          current_step?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          current_step?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_messages: {
        Row: {
          ai_confidence: number | null
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          message_type: Database["public"]["Enums"]["message_type_enum"]
          metadata: Json | null
          telegram_message_id: number | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_type: Database["public"]["Enums"]["message_type_enum"]
          metadata?: Json | null
          telegram_message_id?: number | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type_enum"]
          metadata?: Json | null
          telegram_message_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          conversation_summary: string | null
          created_at: string
          emotional_state: string | null
          first_name: string | null
          id: string
          last_interaction_at: string | null
          onboarding_completed: boolean
          onboarding_step: string | null
          preferred_checkin_evening: string
          preferred_checkin_morning: string
          risk_level: Database["public"]["Enums"]["risk_level_enum"]
          sobriety_start_date: string | null
          telegram_chat_id: number
          telegram_user_id: number
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          conversation_summary?: string | null
          created_at?: string
          emotional_state?: string | null
          first_name?: string | null
          id?: string
          last_interaction_at?: string | null
          onboarding_completed?: boolean
          onboarding_step?: string | null
          preferred_checkin_evening?: string
          preferred_checkin_morning?: string
          risk_level?: Database["public"]["Enums"]["risk_level_enum"]
          sobriety_start_date?: string | null
          telegram_chat_id: number
          telegram_user_id: number
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          conversation_summary?: string | null
          created_at?: string
          emotional_state?: string | null
          first_name?: string | null
          id?: string
          last_interaction_at?: string | null
          onboarding_completed?: boolean
          onboarding_step?: string | null
          preferred_checkin_evening?: string
          preferred_checkin_morning?: string
          risk_level?: Database["public"]["Enums"]["risk_level_enum"]
          sobriety_start_date?: string | null
          telegram_chat_id?: number
          telegram_user_id?: number
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      message_type_enum: "user" | "bot" | "system"
      risk_level_enum: "low" | "medium" | "high" | "critical"
      severity_enum: "info" | "warning" | "critical"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      message_type_enum: ["user", "bot", "system"],
      risk_level_enum: ["low", "medium", "high", "critical"],
      severity_enum: ["info", "warning", "critical"],
    },
  },
} as const
