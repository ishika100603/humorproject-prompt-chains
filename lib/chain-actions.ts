"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export type ActionState = { ok: boolean; message: string } | null;

const clean = (s: FormDataEntryValue | null) => String(s ?? "").replace(/\s*[—–]\s*/g, ", ").trim();
const friendly = (msg: string) => (msg.includes("duplicate key") ? "A chain with that name already exists." : msg);

// ---------- Prompt chains ----------

export async function createChain(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const name = clean(form.get("name"));
  const description = clean(form.get("description")) || null;
  if (!name) return { ok: false, message: "Give the chain a name." };
  const { data, error } = await supabase.from("prompt_chains").insert({ name, description }).select("id").single();
  if (error) return { ok: false, message: friendly(error.message) };
  // Weight 0: a new chain doesn't change the live app's caption mix until an admin sets it
  await supabase.from("prompt_chain_mix").upsert({ chain_id: data.id, weight: 0 }, { onConflict: "chain_id" });
  revalidatePath("/");
  redirect(`/chains/${data.id}`);
}

export async function updateChain(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = Number(form.get("id"));
  const name = clean(form.get("name"));
  if (!name) return { ok: false, message: "The name can't be empty." };
  const { data, error } = await supabase
    .from("prompt_chains")
    .update({ name, description: clean(form.get("description")) || null })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: friendly(error.message) };
  if (!data?.length) return { ok: false, message: "Nothing was saved." };
  revalidatePath(`/chains/${id}`);
  revalidatePath("/");
  return { ok: true, message: "Title changed." };
}

export async function deleteChain(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = Number(form.get("id"));
  // Steps and its mix weight go with it (ON DELETE CASCADE); captions it made stay, unlinked
  const { data, error } = await supabase.from("prompt_chains").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Nothing was deleted." };
  revalidatePath("/");
  redirect("/?deleted=1");
}

// ---------- Steps ----------

async function stepsOf(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], chainId: number) {
  const { data } = await supabase.from("prompt_chain_steps").select("id, step_order").eq("chain_id", chainId).order("step_order");
  return (data ?? []) as { id: number; step_order: number }[];
}

export async function createStep(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const chainId = Number(form.get("chain_id"));
  const title = clean(form.get("title"));
  const prompt_text = String(form.get("prompt_text") ?? "").trim();
  if (!title || !prompt_text) return { ok: false, message: "A step needs a title and a prompt." };
  const steps = await stepsOf(supabase, chainId);
  const step_order = (steps.at(-1)?.step_order ?? 0) + 1;
  const model_key = String(form.get("model_key") ?? "").trim() || null;
  const { error } = await supabase.from("prompt_chain_steps").insert({ chain_id: chainId, step_order, title, prompt_text, model_key });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/chains/${chainId}`);
  return { ok: true, message: `Added as step ${step_order}.` };
}

export async function updateStep(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = Number(form.get("id"));
  const chainId = Number(form.get("chain_id"));
  const title = clean(form.get("title"));
  const prompt_text = String(form.get("prompt_text") ?? "").trim();
  if (!title || !prompt_text) return { ok: false, message: "A step needs a title and a prompt." };
  const model_key = String(form.get("model_key") ?? "").trim() || null;
  const { data, error } = await supabase.from("prompt_chain_steps").update({ title, prompt_text, model_key }).eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Nothing was saved." };
  revalidatePath(`/chains/${chainId}`);
  return { ok: true, message: "Saved." };
}

export async function deleteStep(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = Number(form.get("id"));
  const chainId = Number(form.get("chain_id"));
  const { error } = await supabase.from("prompt_chain_steps").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  // Close the gap so steps stay numbered 1, 2, 3...
  const steps = await stepsOf(supabase, chainId);
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].step_order !== i + 1) await supabase.from("prompt_chain_steps").update({ step_order: i + 1 }).eq("id", steps[i].id);
  }
  revalidatePath(`/chains/${chainId}`);
  return { ok: true, message: "Deleted." };
}

// Move a step to a new position (1-based); the others shift to make room
export async function moveStep(chainId: number, stepId: number, to: number): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const steps = await stepsOf(supabase, chainId);
  const from = steps.findIndex((s) => s.id === stepId);
  if (from < 0) return { ok: false, message: "Step not found." };
  const target = Math.max(0, Math.min(steps.length - 1, to - 1));
  if (target === from) return { ok: true, message: "" };
  const order = [...steps];
  const [moved] = order.splice(from, 1);
  order.splice(target, 0, moved);
  // step_order is unique per chain, so park every step on a negative number first
  for (const s of steps) {
    const { error } = await supabase.from("prompt_chain_steps").update({ step_order: -s.step_order - 1000 }).eq("id", s.id);
    if (error) return { ok: false, message: error.message };
  }
  for (let i = 0; i < order.length; i++) {
    const { error } = await supabase.from("prompt_chain_steps").update({ step_order: i + 1 }).eq("id", order[i].id);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath(`/chains/${chainId}`);
  return { ok: true, message: `Moved to step ${target + 1}.` };
}

// ---------- Inline edits (one field at a time) ----------

const STEP_FIELDS = ["title", "prompt_text", "model_key"] as const;
const CHAIN_FIELDS = ["name", "description"] as const;

export async function updateStepField(
  chainId: number,
  stepId: number,
  field: (typeof STEP_FIELDS)[number],
  raw: string
): Promise<ActionState> {
  if (!STEP_FIELDS.includes(field)) return { ok: false, message: "Unknown field." };
  const { supabase } = await requireAdmin();
  const value = field === "prompt_text" ? raw.trim() : clean(raw);
  if (field !== "model_key" && !value) return { ok: false, message: field === "title" ? "The title can't be empty." : "The prompt can't be empty." };
  const { data, error } = await supabase
    .from("prompt_chain_steps")
    .update({ [field]: value || null })
    .eq("id", stepId)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Nothing was saved." };
  revalidatePath(`/chains/${chainId}`);
  return { ok: true, message: "Saved." };
}

export async function updateChainField(chainId: number, field: (typeof CHAIN_FIELDS)[number], raw: string): Promise<ActionState> {
  if (!CHAIN_FIELDS.includes(field)) return { ok: false, message: "Unknown field." };
  const { supabase } = await requireAdmin();
  const value = clean(raw);
  if (field === "name" && !value) return { ok: false, message: "The title can't be empty." };
  const { data, error } = await supabase
    .from("prompt_chains")
    .update({ [field]: value || null })
    .eq("id", chainId)
    .select("id");
  if (error) return { ok: false, message: friendly(error.message) };
  if (!data?.length) return { ok: false, message: "Nothing was saved." };
  revalidatePath(`/chains/${chainId}`);
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}
