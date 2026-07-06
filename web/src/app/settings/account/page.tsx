import Link from "next/link";
import { DeleteAccountForm } from "@/components/settings/DeleteAccountForm";
import { buttonStyles } from "@/components/ui/Button";
import { requireVerifiedMember } from "@/lib/auth/viewer";

export default async function AccountSettingsPage() {
  const viewer = await requireVerifiedMember("/settings/account");
  return (
    <main className="page-shell py-12 sm:py-16">
      <p className="eyebrow text-coral-600">Settings</p>
      <h1 className="mt-4 text-4xl font-bold text-indigo-950 sm:text-5xl">Your account</h1>
      <section className="mt-9 max-w-2xl rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-2xl font-bold text-indigo-950">Export your data</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">Download a JSON copy of your profile, requests, saved profiles, notifications, blocks, reports, feedback, preferences, and account history.</p>
        <Link className={buttonStyles("secondary", "mt-5")} href="/settings/account/export">Download JSON export</Link>
        {!viewer.access?.deletion_pending && <DeleteAccountForm />}
      </section>
    </main>
  );
}
