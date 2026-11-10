"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createChain, deleteChain, updateChain, type ActionState } from "@/lib/chain-actions";

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
  const [editing, setEditing] = useState(false);
  const [sure, setSure] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(updateChain, null);
  const [del, delAction, deleting] = useActionState<ActionState, FormData>(deleteChain, null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (editing)
    return (
      <form action={action} className="card grid gap-2 p-5">
        <input type="hidden" name="id" value={id} />
        <label className="grid gap-1 text-xs text-ink/60">
          Title
          <input name="name" defaultValue={name} required maxLength={80} className="field text-lg" autoFocus />
        </label>
        <label className="grid gap-1 text-xs text-ink/60">
          Description
          <input name="description" defaultValue={description ?? ""} maxLength={300} placeholder="What it does" className="field" />
        </label>
        <div className="flex items-center gap-3">
          <button disabled={pending} className="btn">
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-sm underline">
            Cancel
          </button>
          {state && !state.ok && <p className="text-xs text-brick">{state.message}</p>}
        </div>
      </form>
    );

  return (
    <div className="card flex flex-wrap items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-ink/50">Prompt chain</p>
        <h1 className="mt-0.5 text-2xl font-medium">{name}</h1>
        {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
        {state?.ok && <p className="mt-1 text-xs text-navy">{state.message}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setEditing(true)} className="rounded-md border border-ink/25 px-3 py-1.5 hover:bg-panel">
          Change title
        </button>
        {sure ? (
          <form action={delAction} className="flex items-center gap-2 rounded-md border border-brick/40 px-3 py-1.5">
            <input type="hidden" name="id" value={id} />
            <span className="text-xs text-ink/60">Delete it and its steps?</span>
            <button disabled={deleting} className="text-brick underline">
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={() => setSure(false)} className="underline">
              Keep
            </button>
          </form>
        ) : (
          <button onClick={() => setSure(true)} className="rounded-md border border-ink/25 px-3 py-1.5 text-ink/70 hover:border-brick hover:text-brick">
            Delete chain
          </button>
        )}
        {del && !del.ok && <p className="text-xs text-brick">{del.message}</p>}
      </div>
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
