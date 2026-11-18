import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasPublicSupabaseConfig } from "@/lib/supabase/config";

export type AdminSession = { user: User };

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!hasPublicSupabaseConfig()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  if (data.user.app_metadata?.role !== "admin") return null;

  return { user: data.user };
}
