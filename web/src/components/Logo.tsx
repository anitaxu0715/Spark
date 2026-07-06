import Link from "next/link";

export function Logo() {
  return (
    <Link
      className="group inline-flex items-center gap-2 text-xl font-bold tracking-tight text-indigo-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral-300"
      href="/"
      aria-label="Spark home"
    >
      <span
        className="relative grid size-9 place-items-center rounded-xl bg-coral-500 text-white shadow-sm transition-transform group-hover:-rotate-3"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="size-5 fill-current">
          <path d="M12 2.5c.45 4.82 2.68 7.05 7.5 7.5-4.82.45-7.05 2.68-7.5 7.5-.45-4.82-2.68-7.05-7.5-7.5 4.82-.45 7.05-2.68 7.5-7.5Z" />
          <path d="M19 15.5c.18 1.91 1.09 2.82 3 3-1.91.18-2.82 1.09-3 3-.18-1.91-1.09-2.82-3-3 1.91-.18 2.82-1.09 3-3Z" />
        </svg>
      </span>
      Spark
    </Link>
  );
}
