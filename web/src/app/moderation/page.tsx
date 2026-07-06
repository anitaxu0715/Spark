import Link from "next/link";
import { SetupState } from "@/components/SetupState";
import { requireOperationalRole } from "@/lib/auth/viewer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ModerationQueuePage() {
  const viewer = await requireOperationalRole(["moderator", "platform_admin"], "/moderation");
  if (!viewer.configured) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <SetupState />;
  const { data: cases } = await supabase.from("moderation_cases")
    .select("id, status, priority, report_snapshot, subject_snapshot, created_at")
    .order("created_at", { ascending: false });
  return (
    <main className="page-shell py-12 sm:py-16">
      <p className="eyebrow text-coral-600">Operations</p>
      <h1 className="mt-4 text-4xl font-bold text-indigo-950 sm:text-5xl">Moderation queue</h1>
      <p className="mt-4 max-w-2xl leading-7 text-ink-500">Reports are shown from durable snapshots. Internal case data is available only to authorized moderators.</p>
      <div className="mt-9 space-y-4">
        {cases?.length ? cases.map((item) => {
          const subject = item.subject_snapshot as { display_name?: string };
          const report = item.report_snapshot as { reason?: string };
          return (
            <Link className="block rounded-2xl border border-cream-200 bg-white p-5 shadow-card hover:border-coral-300" href={`/moderation/cases/${item.id}`} key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold text-indigo-950">{subject.display_name ?? "Unknown member"}</h2>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase text-indigo-800">{item.priority} · {item.status}</span>
              </div>
              <p className="mt-2 text-sm capitalize text-ink-500">{report.reason ?? "Report"} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.created_at))}</p>
            </Link>
          );
        }) : <p className="rounded-2xl bg-cream-100 p-6 text-ink-500">No moderation cases are waiting.</p>}
      </div>
    </main>
  );
}
