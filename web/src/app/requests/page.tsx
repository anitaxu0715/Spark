import { RequestsManager } from "@/components/requests/RequestsManager";
import { SetupState } from "@/components/SetupState";
import { requireVerifiedMember } from "@/lib/auth/viewer";
import { getLearningRequests } from "@/lib/data/requests";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const viewer = await requireVerifiedMember("/requests");
  if (!viewer.configured) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase || !viewer.user) return <SetupState />;
  const params = await searchParams;
  const requests = await getLearningRequests(supabase, viewer.user.id);
  return (
    <div className="page-shell py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow text-coral-600">Learning together</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-indigo-950 sm:text-5xl">Your requests</h1>
        <p className="mt-4 leading-7 text-ink-500">Status changes are shared across accounts and protected by participant-only database rules.</p>
      </div>
      <RequestsManager initialView={params.view === "sent" ? "sent" : "incoming"} requests={requests} />
    </div>
  );
}
