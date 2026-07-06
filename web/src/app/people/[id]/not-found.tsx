import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

export default function ProfileNotFound() {
  return (
    <div className="page-shell grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral-100 text-2xl text-coral-800" aria-hidden="true">✦</span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-indigo-950">This profile is not available</h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-ink-500">The link may be outdated, or this person may have paused their profile.</p>
        <Link className={buttonStyles("primary", "mt-7")} href="/discover">Discover other people</Link>
      </div>
    </div>
  );
}
