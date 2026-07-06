import { notFound } from "next/navigation";
import { revokeRestrictionAction } from "@/actions/moderation";
import { CaseControls } from "@/components/moderation/CaseControls";
import { SetupState } from "@/components/SetupState";
import { Button } from "@/components/ui/Button";
import { requireOperationalRole } from "@/lib/auth/viewer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ModerationCasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireOperationalRole(["moderator", "platform_admin"], "/moderation");
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <SetupState />;
  const { data: item } = await supabase.from("moderation_cases").select("*").eq("id", id).maybeSingle();
  if (!item) notFound();
  const [{ data: notes }, { data: restrictions }] = await Promise.all([
    supabase.from("moderation_case_notes").select("id, body, created_at, author_id").eq("case_id", id).order("created_at"),
    supabase.from("member_restrictions").select("id, restriction_type, starts_at, expires_at, revoked_at, internal_reason").eq("case_id", id).order("created_at", { ascending: false }),
  ]);
  const report = item.report_snapshot as { reason?: string; details?: string };
  const subject = item.subject_snapshot as { display_name?: string; email_domain?: string };
  const activeRestriction = restrictions?.find((restriction) => !restriction.revoked_at);
  return (
    <main className="page-shell py-12 sm:py-16">
      <p className="eyebrow text-coral-600">Moderation case</p>
      <h1 className="mt-4 text-4xl font-bold text-indigo-950">{subject.display_name ?? "Unknown member"}</h1>
      <div className="mt-7 rounded-2xl border border-cream-200 bg-cream-100 p-5">
        <p className="font-bold capitalize text-indigo-950">{report.reason ?? "Report"}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-600">{report.details || "No additional details were submitted."}</p>
      </div>
      <div className="mt-7"><CaseControls caseId={item.id} priority={item.priority} restricted={Boolean(activeRestriction)} status={item.status} subjectId={item.subject_id} /></div>
      {activeRestriction && (
        <section className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-bold text-red-950">Active {activeRestriction.restriction_type.replaceAll("_", " ")}</h2>
          <p className="mt-2 text-sm text-red-900">{activeRestriction.internal_reason}</p>
          <form action={revokeRestrictionAction.bind(null, activeRestriction.id)} className="mt-4"><Button type="submit" variant="danger">Revoke restriction</Button></form>
        </section>
      )}
      <section className="mt-7 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="text-xl font-bold text-indigo-950">Internal notes</h2>
        <ul className="mt-4 space-y-3">
          {notes?.map((note) => <li className="rounded-xl bg-cream-100 p-4 text-sm text-ink-600" key={note.id}>{note.body}</li>)}
        </ul>
      </section>
    </main>
  );
}
