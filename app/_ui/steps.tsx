"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createStep, deleteStep, moveStep, updateStepField, type ActionState } from "@/lib/chain-actions";
import type { Model, Step } from "@/lib/admin";
import { useResetOnOk } from "./forms";
import InfoTip from "./info-tip";
import InlineEdit from "./inline-edit";
import DeleteButton from "./delete-button";

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

function StepModel({ step, models }: { step: Step; models: Model[] }) {
  const [saving, startSave] = useTransition();
  const [err, setErr] = useState("");
  return (
    <span className="flex items-center gap-1">
      <select
        aria-label={`Model for step ${step.step_order}`}
        title="Model for this step"
        value={step.model_key ?? ""}
        disabled={saving}
        onChange={(e) =>
          startSave(async () => {
            const res = await updateStepField(step.chain_id, step.id, "model_key", e.target.value);
            setErr(res?.ok ? "" : res?.message ?? "Couldn't save.");
          })
        }
        className="field w-36 py-1 text-xs"
      >
        <option value="">Default model</option>
        {models.map((m) => (
          <option key={m.model_key} value={m.model_key}>
            {m.name}
          </option>
        ))}
      </select>
      {err && <span className="text-brick">{err}</span>}
    </span>
  );
}

function StepCard({ step, total, models, moved, onMoved }: { step: Step; total: number; models: Model[]; moved: boolean; onMoved: (id: number) => void }) {
  const [moving, startMove] = useTransition();
  const [moveErr, setMoveErr] = useState("");
  const ref = useRef<HTMLLIElement>(null);
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

  return (
    <li ref={ref} className={`card p-4 transition-opacity ${moving ? "opacity-50" : ""} ${moved ? "step-moved" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="step-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-face">{step.step_order}</span>
          <InlineEdit
            value={step.title}
            label="step title"
            textClassName="font-medium"
            onSave={(v) => updateStepField(step.chain_id, step.id, "title", v)}
          />
          <InfoTip text={roleOf(step.step_order, total)} />
          {moved && <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] text-face">Moved to {step.step_order}</span>}
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap text-xs">
          <StepModel step={step} models={models} />
          <button
            aria-label={`Move step ${step.step_order} up`}
            title="Move up"
            disabled={step.step_order === 1 || moving}
            onClick={() => move(step.step_order - 1)}
            className="ml-1 rounded border border-ink/20 px-2 py-1 hover:bg-panel disabled:opacity-30"
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
            className="field w-[5.5rem] py-1 text-xs"
          >
            {Array.from({ length: total }, (_, i) => (
              <option key={i} value={i + 1}>
                Step {i + 1}
              </option>
            ))}
          </select>
          <span className="ml-1">
            <DeleteButton label={`Delete step ${step.step_order}`} question="Delete this step?" action={deleteStep} fields={{ id: step.id, chain_id: step.chain_id }} />
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-ink/10 bg-panel p-3">
        <InlineEdit
          value={step.prompt_text}
          label="prompt"
          multiline
          textClassName="whitespace-pre-line font-mono text-xs leading-relaxed"
          boxClassName="font-mono text-xs leading-relaxed"
          onSave={(v) => updateStepField(step.chain_id, step.id, "prompt_text", v)}
        />
      </div>
      {moveErr && <p className="mt-2 text-xs text-brick">{moveErr}</p>}
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
