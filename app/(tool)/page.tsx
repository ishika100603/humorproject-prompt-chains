import Link from "next/link";
import { requireAdmin, type Chain } from "@/lib/admin";
import { NewChainForm } from "../_ui/forms";

export const metadata = { title: "Prompt chains" };

const ICONS = {
  steps: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  runs: "M6 4l14 8-14 8V4z",
  captions: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
};

function Stat({ icon, value, label }: { icon: keyof typeof ICONS; value: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-panel px-2.5 py-1 text-xs" title={`${value} ${label}`}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-navy" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={ICONS[icon]} />
      </svg>
      <span className="font-medium tabular-nums">{value}</span>
      <span className="text-ink/50">{label}</span>
    </span>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams;
  const { supabase } = await requireAdmin();
  const [c, s, r, cap] = await Promise.all([
    supabase.from("prompt_chains").select("id, name, description, created_at").order("created_at", { ascending: false }),
    supabase.from("prompt_chain_steps").select("chain_id"),
    supabase.from("caption_requests").select("chain_id").not("chain_id", "is", null).range(0, 9999),
    supabase.from("captions").select("chain_id").not("chain_id", "is", null).range(0, 9999),
  ]);
  const chains = (c.data ?? []) as Chain[];
  const count = (rows: { chain_id: number }[] | null, id: number) => (rows ?? []).filter((x) => x.chain_id === id).length;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-medium">Prompt chains</h1>
        <p className="mt-1 text-sm text-ink/60">Steps run in order. Step 1 sees the photo; the last step writes the captions.</p>
        {deleted && <p className="mt-2 text-sm text-navy">Chain deleted.</p>}
        {c.error && <p className="mt-2 text-sm text-brick">{c.error.message}</p>}
      </div>

      <NewChainForm />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((ch) => (
          <Link key={ch.id} href={`/chains/${ch.id}`} className="card flex flex-col gap-3 p-4 transition-colors hover:border-navy">
            <div>
              <p className="font-medium">{ch.name}</p>
              {ch.description && <p className="mt-1 line-clamp-2 text-sm text-ink/60">{ch.description}</p>}
            </div>
            <div className="mt-auto flex flex-wrap gap-1.5">
              <Stat icon="steps" value={count(s.data as { chain_id: number }[], ch.id)} label="steps" />
              <Stat icon="runs" value={count(r.data as { chain_id: number }[], ch.id)} label="runs" />
              <Stat icon="captions" value={count(cap.data as { chain_id: number }[], ch.id)} label="posted" />
            </div>
          </Link>
        ))}
        {!chains.length && <p className="text-sm text-ink/50">No chains yet.</p>}
      </div>
    </div>
  );
}
