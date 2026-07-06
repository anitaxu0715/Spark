import { unblockProfileAction } from "@/actions/profile";
import { SetupState } from "@/components/SetupState";
import { PrivacyForm } from "@/components/settings/PrivacyForm";
import { Button } from "@/components/ui/Button";
import { requireVerifiedMember } from "@/lib/auth/viewer";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function PrivacySettingsPage() {
  const viewer = await requireVerifiedMember("/settings/privacy");
  if (!viewer.configured) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase || !viewer.user) return <SetupState />;
  const [profile, { data: blocks }] = await Promise.all([
    getCurrentProfile(supabase, viewer.user.id),
    supabase.from("blocks").select("blocked_id, created_at").eq("blocker_id", viewer.user.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="page-shell py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow text-coral-600">Settings</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-indigo-950 sm:text-5xl">Privacy and boundaries</h1>
        <p className="mt-4 leading-7 text-ink-500">Choose where your profile appears and review people you have blocked.</p>
      </div>
      <PrivacyForm discoverable={profile.discoverable} showLocation={profile.showLocation} />

      <section className="mt-8 rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-2xl font-bold text-indigo-950">Blocked members</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">Blocked members cannot find you, save your profile, or start new requests. Existing history remains available for continuity.</p>
        {blocks?.length ? (
          <ul className="mt-6 divide-y divide-cream-200">
            {blocks.map((block) => (
              <li className="flex items-center justify-between gap-4 py-4" key={block.blocked_id}>
                <div><p className="font-semibold text-indigo-950">Blocked member</p><p className="text-xs text-ink-400">Reference {block.blocked_id.slice(0, 8)}</p></div>
                <form action={unblockProfileAction.bind(null, block.blocked_id)}><Button type="submit" variant="secondary">Unblock</Button></form>
              </li>
            ))}
          </ul>
        ) : <p className="mt-6 rounded-2xl bg-cream-100 p-5 text-sm text-ink-500">You have not blocked anyone.</p>}
      </section>
    </div>
  );
}
