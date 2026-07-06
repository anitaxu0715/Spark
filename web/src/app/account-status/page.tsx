import { cancelAccountDeletionAction } from "@/actions/settings";
import { Button } from "@/components/ui/Button";
import { requireVerifiedMember } from "@/lib/auth/viewer";

export default async function AccountStatusPage() {
  const viewer = await requireVerifiedMember("/account-status");
  const restriction = viewer.access?.restriction;
  const deletion = viewer.access?.deletion;
  return (
    <main className="page-shell py-16">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-cream-200 bg-white p-7 shadow-card sm:p-10">
        <p className="eyebrow text-coral-600">Account status</p>
        <h1 className="mt-4 text-4xl font-bold text-indigo-950">Your community access is paused</h1>
        {restriction && (
          <section className="mt-7 rounded-2xl bg-amber-50 p-5">
            <h2 className="font-bold text-amber-950">Account restriction</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              {restriction.type === "temporary_suspension" && restriction.expires_at
                ? `Access resumes after ${new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(new Date(restriction.expires_at))}.`
                : "This restriction has no automatic end date."}
              {" "}Contact the Spark support team if you believe this is an error.
            </p>
          </section>
        )}
        {deletion && (
          <section className="mt-7 rounded-2xl bg-indigo-50 p-5">
            <h2 className="font-bold text-indigo-950">Deletion scheduled</h2>
            <p className="mt-2 text-sm leading-6 text-indigo-800">Your account is scheduled for deletion after {new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(new Date(deletion.purge_after))}.</p>
            <form action={cancelAccountDeletionAction} className="mt-4"><Button type="submit">Cancel deletion</Button></form>
          </section>
        )}
      </div>
    </main>
  );
}
