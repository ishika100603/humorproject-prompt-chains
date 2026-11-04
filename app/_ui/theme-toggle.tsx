"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const OPTIONS: [Theme, string, string][] = [
  ["light", "Light", "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"],
  ["dark", "Dark", "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"],
  ["system", "System", "M3 5h18v11H3zM8 20h8M12 16v4"],
];

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    let saved: Theme = "system";
    try {
      saved = (localStorage.getItem("theme") as Theme) || "system";
    } catch {}
    setTheme(saved);
  }, []);

  // In system mode, follow the OS when it switches
  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => apply("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [theme]);

  const pick = (t: Theme) => {
    setTheme(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
  };

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-full border border-ink/20 p-0.5">
      {OPTIONS.map(([value, label, d]) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          title={label}
          onClick={() => pick(value)}
          className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs ${theme === value ? "bg-ink text-face" : "text-ink/70 hover:text-ink"}`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={d} />
          </svg>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
