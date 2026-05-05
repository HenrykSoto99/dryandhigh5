import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/safe-client";

export async function ensureMemberProfile(user: User) {
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Compa";

  const avatarUrl = user.user_metadata?.avatar_url || null;

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError && readError.code !== "PGRST116") {
    return { error: readError };
  }

  if (existing) return { error: null };

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    display_name: displayName,
    avatar_url: avatarUrl,
  });

  return { error };
}