"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/chain-actions";

const Trash = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
  </svg>
);

// A trash icon that asks before deleting
export default function DeleteButton({
  label,
  question,
  action,
  fields,
}: {
  label: string;
  question: string;
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  fields: Record<string, string | number>;
}) {
  const [sure, setSure] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  if (!sure)
    return (
      <button
        type="button"
        onClick={() => setSure(true)}
        aria-label={label}
        title={label}
        className="rounded border border-ink/20 p-1 text-ink/60 hover:border-brick hover:text-brick"
      >
        <Trash />
      </button>
    );
  return (
    <form action={formAction} className="flex items-center gap-2 rounded-md border border-brick/40 bg-panel px-2 py-1 text-xs">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <span className="text-ink/70">{question}</span>
      <button disabled={pending} className="font-medium text-brick underline">
        {pending ? "Deleting…" : "Delete"}
      </button>
      <button type="button" onClick={() => setSure(false)} className="underline">
        Keep
      </button>
      {state && !state.ok && <span className="text-brick">{state.message}</span>}
    </form>
  );
}
