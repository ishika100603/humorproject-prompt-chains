import Link from "next/link";
import { fmtDate, requireAdmin, type Chain } from "@/lib/admin";
import { NewChainForm } from "../_ui/forms";

export const metadata = { title: "Prompt chains" };

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
        <p className="mt-1 text-sm text-ink/60">
          A chain is a series of AI steps. Step 1 looks at a photo, and each next step works on what the previous one wrote. The last step writes the captions.
        </p>
        {deleted && <p className="mt-2 text-sm text-navy">Chain deleted.</p>}
        {c.error && <p className="mt-2 text-sm text-brick">{c.error.message}</p>}
      </div>

      <NewChainForm />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((ch) => {
          const steps = count(s.data as { chain_id: number }[], ch.id);
          const runs = count(r.data as { chain_id: number }[], ch.id);
          const captions = count(cap.data as { chain_id: number }[], ch.id);
          return (
            <Link key={ch.id} href={`/chains/${ch.id}`} className="card block p-4 hover:border-navy">
              <p className="font-medium">{ch.name}</p>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm text-ink/60">{ch.description || "No description"}</p>
              <p className="mt-3 text-xs text-ink/50">
                {steps} step{steps === 1 ? "" : "s"} · {runs} run{runs === 1 ? "" : "s"} · {captions} caption{captions === 1 ? "" : "s"} in the app · made {fmtDate(ch.created_at)}
              </p>
            </Link>
          );
        })}
        {!chains.length && <p className="text-sm text-ink/50">No chains yet. Create the first one above.</p>}
      </div>
    </div>
  );
}
