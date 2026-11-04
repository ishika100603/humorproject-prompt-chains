import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "../actions";
import ThemeToggle from "../_ui/theme-toggle";

export default async function ToolLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-ink/15 bg-face/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="leading-tight">
            <span className="hand block text-sm">At 116 &amp; Broadway</span>
            <span className="text-xs text-ink/60">Prompt chain tool</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden max-w-48 truncate text-xs text-ink/60 md:inline" title={user.email ?? ""}>
              {user.email}
            </span>
            <form action={signOut}>
              <button className="text-xs underline">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
