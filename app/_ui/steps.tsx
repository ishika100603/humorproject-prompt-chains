"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { createStep, deleteStep, moveStep, updateStep, type ActionState } from "@/lib/chain-actions";
import type { Step } from "@/lib/admin";
import { useResetOnOk } from "./forms";

function StepCard({ step, total }: { step: Step; total: number }) {
  const [editing, setEditing] = useState(false);
  const [sure, setSure] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(updateStep, null);
  const [del, delAction, deleting] = useActionState<ActionState, FormData>(deleteStep, null);
  const [moving, startMove] = useTransition();
  const [moveMsg, setMoveMsg] = useState<ActionState>(null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  const move = (to: number) =>
    startMove(async () => {
      setMoveMsg(await moveStep(step.chain_id, step.id, to));
    });

  return (
    <li className={`card p-4 ${moving ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-face">{step.step_order}</span>
          <span className="font-medium">{step.title}</span>
          <span className="text-xs text-ink/50">
            {step.step_order === 1 ? "gets the photo" : `gets step ${step.step_order - 1}'s output`}
            {step.step_order === total ? " · writes the captions" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            aria-label={`Move step ${step.step_order} up`}
            disabled={step.step_order === 1 || moving}
            onClick={() => move(step.step_order - 1)}
            className="rounded border border-ink/20 px-2 py-1 hover:bg-panel disabled:opacity-30"
          >
            ↑
          </button>
          <button
            aria-label={`Move step ${step.step_order} down`}
            disabled={step.step_order === total || moving}
            onClick={() => move(step.step_order + 1)}
            className="rounded border border-ink/20 px-2 py-1 hover:bg-panel disabled:opacity-30"
          >
            ↓
          </button>
          <label className="ml-1 flex items-center gap-1 text-ink/60">
            Move to
            <select
              aria-label={`Move step ${step.step_order} to position`}
              value={step.step_order}
              disabled={moving}
              onChange={(e) => move(Number(e.target.value))}
              className="field w-auto py-1"
            >
              {Array.from({ length: total }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {editing ? (
        <form action={action} className="mt-3 grid gap-2">
          <input type="hidden" name="id" value={step.id} />
          <input type="hidden" name="chain_id" value={step.chain_id} />
          <input name="title" defaultValue={step.title} required maxLength={80} className="field" />
          <textarea name="prompt_text" defaultValue={step.prompt_text} required rows={6} className="field font-mono text-xs leading-relaxed" autoFocus />
          <div className="flex items-center gap-3">
            <button disabled={pending} className="btn">
              {pending ? "Saving…" : "Save step"}
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
            {state?.ok && <span className="text-navy">{state.message}</span>}
            {moveMsg && <span className={moveMsg.ok ? "text-navy" : "text-brick"}>{moveMsg.message}</span>}
            {del && !del.ok && <span className="text-brick">{del.message}</span>}
          </div>
        </>
      )}
    </li>
  );
}

function AddStep({ chainId, next }: { chainId: number; next: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createStep, null);
  const ref = useResetOnOk(state);
  const hint =
    next === 1
      ? "Look at the photo and describe what's happening in two sentences. Note anything odd or very Columbia."
      : "Using the description, find the most relatable or absurd angle for a Columbia student.";
  return (
    <form ref={ref} action={action} className="card grid gap-2 border-dashed p-4">
      <p className="text-sm font-medium">Add step {next}</p>
      <input type="hidden" name="chain_id" value={chainId} />
      <input name="title" required maxLength={80} placeholder={next === 1 ? "Describe the photo" : "Find the funny angle"} className="field" />
      <textarea name="prompt_text" required rows={4} placeholder={hint} className="field font-mono text-xs leading-relaxed" />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn">
          {pending ? "Adding…" : "Add step"}
        </button>
        {state && <p className={`text-xs ${state.ok ? "text-navy" : "text-brick"}`}>{state.message}</p>}
      </div>
    </form>
  );
}

export default function StepsEditor({ chainId, steps }: { chainId: number; steps: Step[] }) {
  return (
    <div className="grid gap-3">
      <ol className="grid gap-3">
        {steps.map((s) => (
          <StepCard key={s.id} step={s} total={steps.length} />
        ))}
      </ol>
      {!steps.length && <p className="text-sm text-ink/50">No steps yet. Add the first one: it gets the photo.</p>}
      <AddStep chainId={chainId} next={steps.length + 1} />
    </div>
  );
}
