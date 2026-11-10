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
      const el = ref.current;
      el?.focus();
      // Cursor at the end instead of highlighting everything
      if (el) el.setSelectionRange(el.value.length, el.value.length);
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

  const cancel = () => {
    setDraft(value);
    setError("");
    setEditing(false);
  };
  const box = `w-full rounded-md border border-navy/50 bg-face px-2 py-1 outline-none focus:border-navy focus:ring-2 focus:ring-navy/15 ${boxClassName}`;

  return (
    <span className="grid w-full min-w-0 flex-1 gap-1">
      <span className={`flex w-full gap-1.5 ${multiline ? "items-start" : "items-center"}`}>
        {multiline ? (
          <textarea ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keys} rows={5} aria-label={label} className={box} />
        ) : (
          <input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keys} aria-label={label} placeholder={placeholder} className={box} />
        )}
        <span className={`flex shrink-0 gap-1 ${multiline ? "flex-col" : ""}`}>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            aria-label="Save"
            title={multiline ? "Save (Ctrl+Enter)" : "Save (Enter)"}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-face hover:opacity-85 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel"
            title="Cancel (Esc)"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-ink/20 text-ink/60 hover:bg-panel hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      </span>
      {error && <span className="text-xs text-brick">{error}</span>}
    </span>
  );
}
