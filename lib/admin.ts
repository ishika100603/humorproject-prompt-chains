import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

// Second line of defense after proxy.ts (RLS is the third): every page and
// server action checks the signed-in user is a superadmin.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_superadmin");
  if (isAdmin !== true) redirect("/not-allowed");
  return { supabase, user };
}

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export type Chain = { id: number; name: string; description: string | null; created_at: string };
export type Step = { id: number; chain_id: number; step_order: number; title: string; prompt_text: string; model_key: string | null };
export type Model = { model_key: string; name: string };
