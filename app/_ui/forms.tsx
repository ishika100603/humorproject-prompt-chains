"use client";

import { useActionState, useEffect, useRef } from "react";
import { createChain, deleteChain, updateChainField, type ActionState } from "@/lib/chain-actions";
import InlineEdit from "./inline-edit";
import DeleteButton from "./delete-button";

export function NewChainForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createChain, null);
  return (
    <form action={action} className="card grid gap-3 p-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
      <label className="grid gap-1 text-xs text-ink/60">
        Title
        <input name="name" required maxLength={80} placeholder="e.g. Describe, then joke" className="field" />
      </label>
      <label className="grid gap-1 text-xs text-ink/60">
        Description (optional)
        <input name="description" maxLength={300} placeholder="e.g. Describe, find the angle, write captions" className="field" />
      </label>
      <button disabled={pending} className="btn h-9">
        {pending ? "Creating…" : "Create chain"}
      </button>
      {state && !state.ok && <p className="text-xs text-brick md:col-span-3">{state.message}</p>}
    </form>
  );
}

export function ChainHeader({ id, name, description }: { id: number; name: string; description: string | null }) {
  return (
    <div className="card flex flex-wrap items-start justify-between gap-4 p-5">
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="text-[11px] uppercase tracking-wide text-ink/50">Prompt chain</p>
        <InlineEdit value={name} label="title" textClassName="text-2xl font-medium" boxClassName="text-lg" onSave={(v) => updateChainField(id, "name", v)} />
        <InlineEdit
          value={description ?? ""}
          label="description"
          placeholder="Add a description"
          textClassName="text-sm text-ink/60"
          onSave={(v) => updateChainField(id, "description", v)}
        />
      </div>
      <DeleteButton label="Delete chain" question="Delete this chain and its steps?" action={deleteChain} fields={{ id }} />
    </div>
  );
}

export function useResetOnOk(state: ActionState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return ref;
}
