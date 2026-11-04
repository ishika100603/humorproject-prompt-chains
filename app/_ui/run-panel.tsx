"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CAPTION_APP_URL } from "@/lib/supabase/config";

type Img = { id: number; url: string; description: string | null };
type Output = { step_order: number; title: string; model: string; ms: number; output: string };

export default function RunPanel({ chainId, stepCount, images }: { chainId: number; stepCount: number; images: Img[] }) {
  const router = useRouter();
  const [list, setList] = useState(images);
  const [picked, setPicked] = useState<string | null>(images[0]?.url ?? null);
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ outputs: Output[]; captions: string[]; published: number; wanted?: boolean; publishError?: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const runningStep = current + 1;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("That isn't an image.");
    if (file.size > 5 * 1024 * 1024) return setError("Photo is over 5 MB.");
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return setError("Sign in again.");
    }
    const path = `${user.id}/chain-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const up = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type });
    if (up.error) {
      setUploading(false);
      return setError(`Upload failed: ${up.error.message}`);
    }
    const url = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
    const { data } = await supabase.from("images").insert({ url, storage_path: path, uploaded_by: user.id, description: "Uploaded in the prompt chain tool" }).select("id").single();
    setList([{ id: data?.id ?? Date.now(), url, description: null }, ...list]);
    setPicked(url);
    setUploading(false);
  };

  // One request per step: each step gets the full time limit, and its output shows right away
  const run = async () => {
    if (!picked) return setError("Pick a photo first.");
    setBusy(true);
    setError("");
    const outputs: Output[] = [];
    setResult({ outputs, captions: [], published: 0 });
    try {
      const {
        data: { session },
      } = await createClient().auth.getSession();
      if (!session) throw new Error("Your session expired. Sign in again.");
      let requestId: number | null = null;
      let previous = "";
      for (let i = 0; i < stepCount; i++) {
        setCurrent(i);
        const res: Response = await fetch(`${CAPTION_APP_URL}/api/chain-run`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ chain_id: chainId, image_url: picked, publish, step_index: i, previous, request_id: requestId }),
        });
        const json: { error?: string; request_id?: number; outputs?: Output[]; captions?: string[]; published?: number; publish_requested?: boolean; publish_error?: string | null } = await res.json().catch(() => ({ error: `The caption app answered ${res.status}.` }));
        requestId = json.request_id ?? requestId;
        if (json.outputs?.length) {
          outputs.push(...json.outputs);
          previous = json.outputs[json.outputs.length - 1].output;
        }
        setResult({ outputs: [...outputs], captions: json.captions ?? [], published: json.published ?? 0, wanted: json.publish_requested, publishError: json.publish_error });
        if (!res.ok) throw new Error(json.error || "The run failed.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The run failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card grid gap-4 p-4">
      <div>
        <h2 className="font-medium">Generate captions with this chain</h2>
        <p className="text-xs text-ink/60">Pick a photo and run every step in order. Each step&apos;s output is shown, and saved under Generated media.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-ink/40 bg-panel text-xs text-ink/60 hover:border-ink"
        >
          {uploading ? "Uploading…" : "+ Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        {list.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setPicked(img.url)}
            aria-pressed={picked === img.url}
            title={img.description ?? ""}
            className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 ${picked === img.url ? "border-navy" : "border-transparent opacity-80 hover:opacity-100"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.description ?? "Photo"} className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={run} disabled={busy || !stepCount || !picked} className="btn">
          {busy ? `Running step ${runningStep} of ${stepCount}…` : `Run ${stepCount} step${stepCount === 1 ? "" : "s"}`}
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="h-4 w-4 accent-[var(--navy)]" />
          Also post the captions to the public app
        </label>
        {!stepCount && <span className="text-xs text-ink/50">Add a step first.</span>}
      </div>
      {error && <p className="text-sm text-brick">{error}</p>}

      {result && (
        <div className="grid gap-3">
          <ol className="grid gap-2">
            {result.outputs.map((o) => (
              <li key={o.step_order} className="rounded-md border border-ink/10 bg-panel p-3">
                <p className="text-xs text-ink/50">
                  Step {o.step_order} · {o.title} · {o.model} · {(o.ms / 1000).toFixed(1)}s
                </p>
                <p className="mt-1 whitespace-pre-line text-sm">{o.output}</p>
              </li>
            ))}
            {busy && (
              <li className="animate-pulse rounded-md border border-dashed border-ink/20 p-3 text-xs text-ink/50">
                Step {runningStep} is running…
              </li>
            )}
          </ol>
          {result.captions.length > 0 && (
            <div className="rounded-md border border-navy/40 p-3">
              <p className="text-xs text-ink/60">
                {result.captions.length} caption{result.captions.length === 1 ? "" : "s"}
                {result.published
                  ? ` · posted ${result.published} to the public app`
                  : result.wanted
                    ? " · couldn't post to the public app"
                    : " · saved here only (tick the box to post them)"}
              </p>
              {result.publishError && <p className="mt-1 text-xs text-brick">Why: {result.publishError}</p>}
              <ul className="mt-1 grid gap-1">
                {result.captions.map((c, i) => (
                  <li key={i} className="text-sm">
                    “{c}”
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
