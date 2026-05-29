import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/safe-client";

export function useTelegramUsers() {
  return useQuery({
    queryKey: ["telegram_users"],
    queryFn: async () => {
      const [tu, pr] = await Promise.all([
        supabase.from("telegram_users").select("*").order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("user_id, display_name, name, avatar_url, sobriety_start_date, telegram_chat_id, is_active, cancelled_at, updated_at"),
      ]);
      if (tu.error) throw tu.error;
      if (pr.error) throw pr.error;
      const profilesByChat = new Map<string, any>();
      (pr.data ?? []).forEach((p: any) => {
        if (p.telegram_chat_id != null) profilesByChat.set(String(p.telegram_chat_id), p);
      });
      // Merge profile-edited fields (name + sobriety) into the telegram user record
      // so changes in the user's profile are reflected in the admin dashboard.
      return (tu.data ?? []).map((u: any) => {
        const p = profilesByChat.get(String(u.telegram_chat_id));
        if (!p) return u;
        return {
          ...u,
          first_name: p.name || p.display_name || u.first_name,
          sobriety_start_date: p.sobriety_start_date ?? u.sobriety_start_date,
          avatar_url: p.avatar_url ?? null,
          profile_is_active: p.is_active,
          profile_cancelled_at: p.cancelled_at,
        };
      });
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

export function useSecurityAlerts(onlyUnresolved = false) {
  return useQuery({
    queryKey: ["security_alerts", onlyUnresolved],
    queryFn: async () => {
      let q = supabase
        .from("security_alerts" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (onlyUnresolved) q = (q as any).eq("resolved", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) || [];
    },
    refetchInterval: 15_000,
  });
}
