import Link from "next/link";

export default function Tabs({ id, active, runs }: { id: number; active: "steps" | "media"; runs: number }) {
  const cls = (on: boolean) => `rounded-md px-3 py-1.5 text-sm ${on ? "bg-ink text-face" : "hover:bg-panel"}`;
  return (
    <nav className="flex gap-1">
      <Link href={`/chains/${id}`} className={cls(active === "steps")}>
        Steps
      </Link>
      <Link href={`/chains/${id}/media`} className={cls(active === "media")}>
        Generated media{runs ? ` (${runs})` : ""}
      </Link>
    </nav>
  );
}
