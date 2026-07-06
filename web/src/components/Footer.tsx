import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-cream-200 bg-white">
      <div className="page-shell grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-6 text-ink-500">
            A welcoming place to share practical skills, meet curious people, and learn together.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-indigo-900" aria-label="Footer navigation">
          <Link href="/discover">Discover</Link>
          <Link href="/requests">Requests</Link>
          <Link href="/profile">Profile</Link>
        </nav>
        <p className="text-xs text-ink-400 sm:col-span-2">© 2026 Spark. Built for thoughtful skill exchange.</p>
      </div>
    </footer>
  );
}
