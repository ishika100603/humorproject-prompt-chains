import Link from "next/link";
import type { Model, Step } from "@/lib/admin";
import { ChainHeader } from "@/app/_ui/forms";
import StepsEditor from "@/app/_ui/steps";
import RunPanel from "@/app/_ui/run-panel";
import Tabs from "@/app/_ui/tabs";
import { loadChain } from "./load";

export default async function ChainPage({ params }: PageProps<"/chains/[id]">) {
  const { id } = await params;
  const { supabase, chain, runs } = await loadChain(id);
  const [s, i, m] = await Promise.all([
    supabase.from("prompt_chain_steps").select("id, chain_id, step_order, title, prompt_text, model_key").eq("chain_id", chain.id).order("step_order"),
    supabase.from("images").select("id, url, description").order("created_at", { ascending: false }).limit(40),
    supabase.from("llm_models").select("model_key, name").eq("is_active", true).order("priority"),
  ]);
  const steps = (s.data ?? []) as Step[];

  return (
    <div className="grid gap-5">
      <Link href="/" className="text-sm underline">
        ← All chains
      </Link>
      <ChainHeader id={chain.id} name={chain.name} description={chain.description} />
      <Tabs id={chain.id} active="steps" runs={runs} />
      {s.error && <p className="text-sm text-brick">{s.error.message}</p>}
      <div className="grid gap-5 lg:grid-cols-[3fr_2fr] lg:items-start">
        <StepsEditor chainId={chain.id} steps={steps} models={(m.data ?? []) as Model[]} />
        <div className="lg:sticky lg:top-20">
          <RunPanel chainId={chain.id} stepCount={steps.length} images={(i.data ?? []) as { id: number; url: string; description: string | null }[]} />
        </div>
      </div>
    </div>
  );
}
