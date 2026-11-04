import { notFound } from "next/navigation";
import { requireAdmin, type Chain } from "@/lib/admin";

export async function loadChain(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase.from("prompt_chains").select("id, name, description, created_at").eq("id", id).maybeSingle();
  if (!data) notFound();
  const { count } = await supabase.from("caption_requests").select("id", { count: "exact", head: true }).eq("chain_id", id);
  return { supabase, user, chain: data as Chain, runs: count ?? 0 };
}
