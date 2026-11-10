"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/chain-actions";

const Pencil = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

// Text with a pencil next to it; clicking turns the same text into an editable box.
// Enter saves a single line (Ctrl+Enter for a multi-line box); Esc cancels.
export default function InlineEdit({
  value,
  label,
  onSave,
  multiline = false,
  placeholder,
  textClassName = "",
  boxClassName = "",
}: {
  value: string;
  label: string;
  onSave: (next: string) => Promise<ActionState>;
  multiline?: boolean;
  placeholder?: string;
  textClassName?: string;
  boxClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const [saving, startSave] = useTransition();
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  const save = () =>
    startSave(async () => {
      if (draft.trim() === value.trim()) return setEditing(false);
      const res = await onSave(draft);
      if (res?.ok) {
        setError("");
        setEditing(false);
      } else setError(res?.message ?? "Couldn't save.");
    });

  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDraft(value);
      setError("");
      setEditing(false);
    }
    if (e.key === "Enter" && (!multiline || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    }
  };

  if (!editing)
    return (
      <span className="group/edit inline-flex min-w-0 items-start gap-1.5">
        <span className={`min-w-0 ${textClassName} ${value ? "" : "text-ink/40"}`}>{value || placeholder}</span>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          aria-label={`Edit ${label}`}
          title={`Edit ${label}`}
          className="mt-0.5 shrink-0 rounded p-1 text-ink/50 hover:bg-panel hover:text-navy"
        >
          <Pencil />
        </button>
      </span>
    );

  return (
    <span className="grid w-full gap-1.5">
      {multiline ? (
        <textarea ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keys} rows={5} aria-label={label} className={`field ${boxClassName}`} />
      ) : (
        <input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keys} aria-label={label} placeholder={placeholder} className={`field ${boxClassName}`} />
      )}
      <span className="flex items-center gap-3 text-xs">
        <button type="button" onClick={save} disabled={saving} className="rounded-md bg-ink px-3 py-1 text-face disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setError("");
            setEditing(false);
          }}
          className="underline"
        >
          Cancel
        </button>
        <span className="text-ink/50">{multiline ? "Ctrl+Enter to save" : "Enter to save"} · Esc to cancel</span>
        {error && <span className="text-brick">{error}</span>}
      </span>
    </span>
  );
}
