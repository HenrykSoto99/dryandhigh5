import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/safe-client";

const lovableAuth = createLovableAuth();

export async function signInWithManagedGoogle() {
  const result = (await lovableAuth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
    extraParams: { prompt: "select_account" },
  })) as { redirected?: boolean; error?: Error | unknown; tokens?: Session };

  if (result.redirected || result.error) return result;

  if (result.tokens) {
    const { error } = await supabase.auth.setSession(result.tokens);
    if (error) return { error };
  }

  return result;
}