import Link from "next/link";
import { fmtDate } from "@/lib/admin";
import Tabs from "@/app/_ui/tabs";
import { loadChain } from "../load";

type Run = { id: number; image_url: string | null; status: string; error: string | null; model_used: string | null; created_at: string; hint: string | null };
type Resp = { request_id: number; http_status: number | null; response_text: string | null };
type Cap = { id: number; caption: string; caption_request_id: number | null };

const FILTERS = { all: "All", posted: "Posted to the app", test: "Test runs", failed: "Failed" } as const;
type Filter = keyof typeof FILTERS;

// A finished tool run's captions are the lines of its last step's reply
const captionsFrom = (text: string | null) =>
  (text ?? "")
    .split("\n")
    .slice(1)
    .map((l) => l.trim().replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, ""))
    .filter((l) => l.length > 1)
    .slice(0, 10);

export default async function MediaPage({ params, searchParams }: PageProps<"/chains/[id]/media">) {
  const { id } = await params;
  const show = ((await searchParams).show as Filter) in FILTERS ? ((await searchParams).show as Filter) : "all";
  const { supabase, chain, runs: runCount } = await loadChain(id);
  const [r, c] = await Promise.all([
    supabase.from("caption_requests").select("id, image_url, status, error, model_used, created_at, hint").eq("chain_id", chain.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("captions").select("id, caption, caption_request_id").eq("chain_id", chain.id).range(0, 999),
  ]);
  const runs = (r.data ?? []) as Run[];
  const ids = runs.map((x) => x.id);
  const resp = ids.length
    ? (((await supabase.from("llm_responses").select("request_id, http_status, response_text").in("request_id", ids).order("id")).data ?? []) as Resp[])
    : [];
  const posted = (c.data ?? []) as Cap[];

  const cards = runs.map((run) => {
    const ok = resp.filter((x) => x.request_id === run.id && x.http_status === 200);
    const live = posted.filter((x) => x.caption_request_id === run.id);
    const fromTool = run.hint === "Prompt chain tool run";
    const captions = live.length ? live.map((x) => x.caption) : run.status === "done" && fromTool ? captionsFrom(ok.at(-1)?.response_text ?? null) : [];
    const kind: Filter = run.status === "failed" ? "failed" : live.length ? "posted" : "test";
    return { run, ok, captions, kind, fromTool };
  });
  const count = (f: Filter) => (f === "all" ? cards.length : cards.filter((x) => x.kind === f).length);
  const shown = show === "all" ? cards : cards.filter((x) => x.kind === show);
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm ${on ? "bg-ink text-face" : "border border-ink/20 hover:bg-panel"}`;

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

      <nav className="flex flex-wrap gap-2" aria-label="Filter runs">
        {(Object.keys(FILTERS) as Filter[]).map((f) => (
          <Link key={f} href={f === "all" ? `/chains/${chain.id}/media` : `/chains/${chain.id}/media?show=${f}`} className={chip(f === show)}>
            {FILTERS[f]} <span className="opacity-60">{count(f)}</span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(({ run, ok, captions, kind, fromTool }) => (
          <article key={run.id} className="card overflow-hidden">
            {run.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={run.image_url} alt="" className="aspect-[4/3] w-full bg-panel object-cover" loading="lazy" />
            )}
            <div className="grid gap-2 p-3">
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-ink/50">
                {fmtDate(run.created_at)}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    kind === "posted" ? "bg-navy text-face" : kind === "failed" ? "bg-brick/15 text-brick" : "border border-ink/20 text-ink/70"
                  }`}
                >
                  {kind === "posted" ? "Posted" : kind === "failed" ? "Failed" : "Test run"}
                </span>
                {!fromTool && <span className="text-ink/50">from the app</span>}
              </p>
              {captions.length ? (
                <ul className="grid gap-1">
                  {captions.map((line, n) => (
                    <li key={n} className="text-sm leading-snug">
                      “{line}”
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink/60">{run.error ?? "No captions."}</p>
              )}
              {fromTool && ok.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-navy">See every step</summary>
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
        ))}
        {!shown.length && <p className="text-sm text-ink/50">Nothing here.</p>}
      </div>
    </div>
  );
}
