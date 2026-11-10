"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "../actions";

// A person icon; the email and Sign out live in its menu
export default function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 hover:bg-panel"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-ink/15 bg-panel p-3 shadow-lg">
          <p className="truncate text-xs text-ink/60" title={email}>
            {email}
          </p>
          <form action={signOut} className="mt-2">
            <button className="w-full rounded-md border border-ink/20 px-3 py-1.5 text-left text-sm hover:bg-face">Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}
