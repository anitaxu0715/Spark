import Link from "next/link";
import { signOutAction } from "@/actions/auth";
import { Logo } from "@/components/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { getViewer } from "@/lib/auth/viewer";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const memberNavigation = [
  { href: "/discover", label: "Discover" },
  { href: "/requests", label: "Requests" },
  { href: "/profile", label: "My profile" },
];

export async function Header() {
  const viewer = await getViewer();
  const signedIn = Boolean(viewer.user);
  let unread = 0;
  if (viewer.user && viewer.membership) {
    const supabase = await createServerSupabaseClient();
    if (supabase) unread = await getUnreadNotificationCount(supabase, viewer.user.id);
  }

  const paused = Boolean(viewer.access?.restricted || viewer.access?.deletion_pending);
  const memberLinks = paused
    ? [
        { href: "/account-status", label: "Account status" },
        { href: "/settings/account", label: "Account" },
      ]
    : [
        ...memberNavigation,
        { href: "/notifications", label: unread ? `Notifications (${unread})` : "Notifications" },
        { href: "/settings/privacy", label: "Privacy" },
        { href: "/settings/notifications", label: "Preferences" },
        { href: "/settings/account", label: "Account" },
        ...(viewer.roles.some((role) => role === "moderator" || role === "platform_admin")
          ? [{ href: "/moderation", label: "Moderation" }]
          : []),
        ...(viewer.roles.some((role) => role === "institution_admin" || role === "platform_admin")
          ? [{ href: "/admin/institutions", label: "Institutions" }]
          : []),
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200/90 bg-cream-50/95 backdrop-blur">
      <div className="page-shell flex h-18 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
          {signedIn ? (
            <>
              {memberLinks.map((item) => (
                <Link className="relative rounded-full px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-white hover:text-indigo-950" href={item.href} key={item.href}>
                  {item.label === "Notifications" && unread > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-coral-500"><span className="sr-only">{unread} unread</span></span>}
                  {item.label}
                </Link>
              ))}
              <form action={signOutAction}><button className={buttonStyles("secondary", "ml-2")} type="submit">Sign out</button></form>
            </>
          ) : (
            <>
              <Link className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-white" href="/auth/sign-in">Sign in</Link>
              <Link className={buttonStyles("primary", "ml-2")} href="/auth/sign-up">Join Spark</Link>
            </>
          )}
        </nav>
        <details className="group relative xl:hidden">
          <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-indigo-200 bg-white text-indigo-950 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open navigation</span>
            <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
          </summary>
          <nav className="absolute right-0 top-14 w-72 rounded-3xl border border-cream-200 bg-white p-3 shadow-xl" aria-label="Mobile navigation">
            {(signedIn ? memberLinks : [{ href: "/auth/sign-in", label: "Sign in" }]).map((item) => (
              <Link className="block rounded-2xl px-4 py-3 font-semibold text-indigo-950 hover:bg-cream-100" href={item.href} key={item.href}>{item.label}</Link>
            ))}
            {signedIn ? (
              <form action={signOutAction}><button className={buttonStyles("secondary", "mt-2 w-full")} type="submit">Sign out</button></form>
            ) : <Link className={buttonStyles("primary", "mt-2 w-full")} href="/auth/sign-up">Join Spark</Link>}
          </nav>
        </details>
      </div>
    </header>
  );
}
