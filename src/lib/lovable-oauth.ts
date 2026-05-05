import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/safe-client";

const lovableAuth = createLovableAuth();

type OAuthResult =
  | { redirected: true; error?: undefined }
  | { redirected?: false; error?: Error | unknown; tokens?: Session };

export async function signInWithManagedGoogle() {
  const result = (await lovableAuth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
    extraParams: { prompt: "select_account" },
  })) as OAuthResult;

  if (result.redirected || result.error) return result;

  if (result.tokens) {
    const { error } = await supabase.auth.setSession(result.tokens);
    if (error) return { error };
  }

  return result;
}