import { createClient } from "@/lib/supabase/server";

/**
 * Server-side admin gate (defense in depth — RLS enforces this again at the
 * database). Returns the Supabase client and user when the caller is an
 * admin, null otherwise.
 */
export async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "admin") return null;
  return { supabase, user };
}
