import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import ThemeToggle from "../_ui/theme-toggle";

export default async function NotAllowed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main className="relative flex h-[100dvh] items-center justify-center px-6">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="card w-full max-w-sm px-8 py-10 text-center">
        <h1 className="text-xl font-medium">Superadmins only</h1>
        <p className="mt-3 text-sm text-ink/70">
          {user?.email ?? "This account"} doesn&apos;t have admin access. Ask an existing admin to turn on{" "}
          <code className="rounded bg-panel px-1">is_superadmin</code> for you.
        </p>
        <form action={signOut} className="mt-6">
          <button className="rounded-full border border-ink px-5 py-2 text-sm hover:bg-panel">Sign in with another account</button>
        </form>
      </div>
    </main>
  );
}
