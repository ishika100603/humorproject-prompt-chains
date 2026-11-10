import Link from "next/link";
import { fmtDate } from "@/lib/admin";
import Tabs from "@/app/_ui/tabs";
import { loadChain } from "../load";

type Run = { id: number; image_url: string | null; status: string; error: string | null; model_used: string | null; created_at: string; finished_at: string | null; hint: string | null };
type Resp = { request_id: number; http_status: number | null; response_text: string | null };

// The last successful AI reply of a run holds its captions, one per line
const captionsFrom = (text: string | null) =>
  (text ?? "")
    .split("\n")
    .slice(1)
    .map((l) => l.trim().replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, ""))
    .filter((l) => l.length > 1)
    .slice(0, 10);

export default async function MediaPage({ params }: PageProps<"/chains/[id]/media">) {
  const { id } = await params;
  const { supabase, chain, runs: runCount } = await loadChain(id);
  const [r, c] = await Promise.all([
    supabase.from("caption_requests").select("id, image_url, status, error, model_used, created_at, finished_at, hint").eq("chain_id", chain.id).order("created_at", { ascending: false }).limit(60),
    supabase.from("captions").select("id, image_url, caption, created_at").eq("chain_id", chain.id).order("created_at", { ascending: false }).limit(200),
  ]);
  const runs = (r.data ?? []) as Run[];
  const ids = runs.map((x) => x.id);
  const resp = ids.length
    ? (((await supabase.from("llm_responses").select("request_id, http_status, response_text").in("request_id", ids).order("id")).data ?? []) as Resp[])
    : [];
  const captions = (c.data ?? []) as { id: number; image_url: string; caption: string; created_at: string }[];

  return (
    <div className="grid gap-5">
      <Link href="/" className="text-sm underline">
        ← All chains
      </Link>
      <div className="card p-5">
        <p className="text-[11px] uppercase tracking-wide text-ink/50">Prompt chain</p>
        <h1 className="mt-0.5 text-2xl font-medium">{chain.name}</h1>
      </div>
      <Tabs id={chain.id} active="media" runs={runCount} />

      <section className="grid gap-3">
        <h2 className="font-medium">Runs</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {runs.map((run) => {
            const ok = resp.filter((x) => x.request_id === run.id && x.http_status === 200);
            const fromTool = run.hint === "Prompt chain tool run";
            const lines = fromTool ? captionsFrom(ok.at(-1)?.response_text ?? null) : [];
            const appCaptions = captions.filter((x) => x.image_url === run.image_url).slice(0, 5);
            const shown = lines.length ? lines : appCaptions.map((x) => x.caption);
            return (
              <article key={run.id} className="card overflow-hidden">
                {run.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={run.image_url} alt="" className="aspect-[4/3] w-full bg-panel object-cover" loading="lazy" />
                )}
                <div className="grid gap-2 p-3">
                  <p className="text-xs text-ink/50">
                    {fmtDate(run.created_at)} · {fromTool ? "tool" : "public app"} ·{" "}
                    <span className={run.status === "done" ? "text-navy" : run.status === "failed" ? "text-brick" : ""}>{run.status}</span>
                    {run.model_used ? ` · ${run.model_used}` : ""}
                  </p>
                  {shown.length ? (
                    <ul className="grid gap-1">
                      {shown.map((line, n) => (
                        <li key={n} className="text-sm leading-snug">
                          “{line}”
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink/50">{run.error ?? "No captions."}</p>
                  )}
                  {fromTool && ok.length > 1 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-navy">See every step&apos;s output</summary>
                      <ol className="mt-2 grid gap-2">
                        {ok.map((x, n) => (
                          <li key={n} className="whitespace-pre-line rounded border border-ink/10 bg-panel p-2">
                            {x.response_text}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
              </article>
            );
          })}
          {!runs.length && <p className="text-sm text-ink/50">Nothing yet. Run the chain from the Steps tab.</p>}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-medium">Captions in the public app</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {captions.map((cap) => (
            <div key={cap.id} className="card flex gap-3 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cap.image_url} alt="" className="h-14 w-14 shrink-0 rounded object-cover" loading="lazy" />
              <div>
                <p className="text-sm leading-snug">{cap.caption}</p>
                <p className="mt-0.5 text-xs text-ink/50">{fmtDate(cap.created_at)}</p>
              </div>
            </div>
          ))}
          {!captions.length && <p className="text-sm text-ink/50">None yet.</p>}
        </div>
      </section>
    </div>
  );
}
