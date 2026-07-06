export function SafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`rounded-2xl border border-amber-200 bg-amber-50 ${compact ? "p-3" : "p-5"}`} aria-label="Safety reminder">
      <div className="flex gap-3">
        <svg className="mt-0.5 size-5 shrink-0 fill-none stroke-amber-800 stroke-2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 4.5 6v5.4c0 4.5 3 7.9 7.5 9.6 4.5-1.7 7.5-5.1 7.5-9.6V6L12 3Z" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          {!compact && <p className="font-semibold text-amber-950">A quick safety note</p>}
          <p className={`${compact ? "text-xs" : "mt-1 text-sm"} leading-5 text-amber-900`}>
            Meet in a public place and tell someone you trust.
          </p>
        </div>
      </div>
    </aside>
  );
}
