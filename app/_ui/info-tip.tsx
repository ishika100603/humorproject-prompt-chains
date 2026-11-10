"use client";

// A small "i" that explains something on hover, focus or tap
export default function InfoTip({ text, label = "What this means" }: { text: string; label?: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-ink/30 font-serif text-[11px] italic text-ink/70 hover:border-ink hover:text-ink"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-40 mt-1.5 hidden w-60 -translate-x-1/2 rounded-md border border-ink/15 bg-panel px-3 py-2 text-xs leading-snug text-ink shadow-lg group-focus-within:block group-hover:block"
      >
        {text}
      </span>
    </span>
  );
}
