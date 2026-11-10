"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createStep, deleteStep, moveStep, updateStep, type ActionState } from "@/lib/chain-actions";
import type { Model, Step } from "@/lib/admin";
import { useResetOnOk } from "./forms";
import InfoTip from "./info-tip";

// What each step reads and writes, shown behind the "i"
const roleOf = (order: number, total: number) =>
  [
    order === 1 ? "Reads the photo." : `Reads what step ${order - 1} wrote.`,
    order === total ? "Each line it writes becomes a caption." : `Its answer goes to step ${order + 1}.`,
  ].join(" ");

function ModelSelect({ models, value }: { models: Model[]; value?: string | null }) {
  return (
    <label className="grid gap-1 text-xs text-ink/60">
      Model
      <select name="model_key" defaultValue={value ?? ""} className="field">
        <option value="">Default (first working model)</option>
        {models.map((m) => (
          <option key={m.model_key} value={m.model_key}>
            {m.name} · {m.model_key}
          </option>
        ))}
      </select>
    </label>
  );
}

function StepCard({ step, total, models, moved, onMoved }: { step: Step; total: number; models: Model[]; moved: boolean; onMoved: (id: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [sure, setSure] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(updateStep, null);
  const [del, delAction, deleting] = useActionState<ActionState, FormData>(deleteStep, null);
  const [moving, startMove] = useTransition();
  const [moveErr, setMoveErr] = useState("");
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);
  // Bring a step that just moved into view so the change is easy to follow
  useEffect(() => {
    if (moved) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [moved, step.step_order]);

  const move = (to: number) =>
    startMove(async () => {
      const res = await moveStep(step.chain_id, step.id, to);
      if (res?.ok) {
        setMoveErr("");
        onMoved(step.id);
      } else setMoveErr(res?.message ?? "Couldn't move it.");
    });

  const modelName = models.find((m) => m.model_key === step.model_key)?.name ?? step.model_key;

  return (
    <li ref={ref} className={`card p-4 transition-opacity ${moving ? "opacity-50" : ""} ${moved ? "step-moved" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="step-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-face">{step.step_order}</span>
          <span className="truncate font-medium">{step.title}</span>
          <InfoTip text={roleOf(step.step_order, total)} />
          {modelName && <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] text-ink/70">{modelName}</span>}
          {moved && <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] text-face">Moved to {step.step_order}</span>}
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap text-xs">
          <button
            aria-label={`Move step ${step.step_order} up`}
            title="Move up"
            disabled={step.step_order === 1 || moving}
            onClick={() => move(step.step_order - 1)}
            className="rounded border border-ink/20 px-2 py-1 hover:bg-panel disabled:opacity-30"
          >
            ↑
          </button>
          <button
            aria-label={`Move step ${step.step_order} down`}
            title="Move down"
            disabled={step.step_order === total || moving}
            onClick={() => move(step.step_order + 1)}
            className="rounded border border-ink/20 px-2 py-1 hover:bg-panel disabled:opacity-30"
          >
            ↓
          </button>
          <select
            aria-label={`Move step ${step.step_order} to position`}
            title="Move to position"
            value={step.step_order}
            disabled={moving}
            onChange={(e) => move(Number(e.target.value))}
            className="field ml-1 w-auto py-1 text-xs"
          >
            {Array.from({ length: total }, (_, i) => (
              <option key={i} value={i + 1}>
                Step {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {editing ? (
        <form action={action} className="mt-3 grid gap-2">
          <input type="hidden" name="id" value={step.id} />
          <input type="hidden" name="chain_id" value={step.chain_id} />
          <label className="grid gap-1 text-xs text-ink/60">
            Title
            <input name="title" defaultValue={step.title} required maxLength={80} className="field" />
          </label>
          <label className="grid gap-1 text-xs text-ink/60">
            Prompt
            <textarea name="prompt_text" defaultValue={step.prompt_text} required rows={6} className="field font-mono text-xs leading-relaxed" autoFocus />
          </label>
          <ModelSelect models={models} value={step.model_key} />
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
      ) : (
        <>
          <p className="mt-3 whitespace-pre-line rounded-md border border-ink/10 bg-panel p-3 font-mono text-xs leading-relaxed">{step.prompt_text}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <button onClick={() => setEditing(true)} className="text-navy underline">
              Edit
            </button>
            {sure ? (
              <form action={delAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={step.id} />
                <input type="hidden" name="chain_id" value={step.chain_id} />
                <button disabled={deleting} className="text-brick underline">
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button type="button" onClick={() => setSure(false)} className="underline">
                  Keep
                </button>
              </form>
            ) : (
              <button onClick={() => setSure(true)} className="text-ink/50 underline hover:text-brick">
                Delete
              </button>
            )}
            {moveErr && <span className="text-brick">{moveErr}</span>}
            {del && !del.ok && <span className="text-brick">{del.message}</span>}
          </div>
        </>
      )}
    </li>
  );
}

function AddStep({ chainId, next, models }: { chainId: number; next: number; models: Model[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createStep, null);
  const ref = useResetOnOk(state);
  return (
    <form ref={ref} action={action} className="card grid gap-2 border-dashed p-4">
      <p className="text-sm font-medium">Add step {next}</p>
      <input type="hidden" name="chain_id" value={chainId} />
      <label className="grid gap-1 text-xs text-ink/60">
        Title
        <input name="title" required maxLength={80} placeholder={next === 1 ? "e.g. Describe the photo" : "e.g. Find the funny angle"} className="field" />
      </label>
      <label className="grid gap-1 text-xs text-ink/60">
        Prompt
        <textarea
          name="prompt_text"
          required
          rows={4}
          placeholder={next === 1 ? "e.g. Describe what's happening in the photo in 2 sentences." : "e.g. Using that, find the most relatable angle for a Columbia student."}
          className="field font-mono text-xs leading-relaxed"
        />
      </label>
      <ModelSelect models={models} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn">
          {pending ? "Adding…" : "Add step"}
        </button>
        {state && <p className={`text-xs ${state.ok ? "text-navy" : "text-brick"}`}>{state.message}</p>}
      </div>
    </form>
  );
}

export default function StepsEditor({ chainId, steps, models }: { chainId: number; steps: Step[]; models: Model[] }) {
  const [movedId, setMovedId] = useState<number | null>(null);
  useEffect(() => {
    if (movedId === null) return;
    const t = setTimeout(() => setMovedId(null), 1800);
    return () => clearTimeout(t);
  }, [movedId]);
  return (
    <div className="grid gap-3">
      <ol className="grid gap-3">
        {steps.map((s) => (
          <StepCard key={s.id} step={s} total={steps.length} models={models} moved={movedId === s.id} onMoved={setMovedId} />
        ))}
      </ol>
      {!steps.length && <p className="text-sm text-ink/50">No steps yet.</p>}
      <AddStep chainId={chainId} next={steps.length + 1} models={models} />
    </div>
  );
}
