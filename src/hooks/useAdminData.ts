import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTelegramUsers() {
  return useQuery({
    queryKey: ["telegram_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telegram_users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useCrisisFlags(onlyUnresolved = false) {
  return useQuery({
    queryKey: ["crisis_flags", onlyUnresolved],
    queryFn: async () => {
      let q = supabase.from("crisis_flags").select("*").order("created_at", { ascending: false });
      if (onlyUnresolved) q = q.eq("resolved", false);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useBotEvents(limit = 50) {
  return useQuery({
    queryKey: ["bot_events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useEmotionalLogs(telegramUserId?: string) {
  return useQuery({
    queryKey: ["emotional_logs", telegramUserId],
    queryFn: async () => {
      if (!telegramUserId) return [];
      const { data, error } = await supabase
        .from("emotional_logs")
        .select("*")
        .eq("telegram_user_id", telegramUserId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!telegramUserId,
  });
}

export function useUserMessages(userId?: string) {
  return useQuery({
    queryKey: ["telegram_messages", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("telegram_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useUserCrisis(userId?: string) {
  return useQuery({
    queryKey: ["user_crisis", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("crisis_flags")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useHolidays() {
  return useQuery({
    queryKey: ["mexican_holidays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mexican_holidays")
        .select("*")
        .order("holiday_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useBroadcasts() {
  return useQuery({
    queryKey: ["broadcast_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcast_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useBotSettings(key: string) {
  return useQuery({
    queryKey: ["bot_settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_settings")
        .select("*")
        .eq("setting_key", key)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
