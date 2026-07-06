import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { buttonStyles } from "@/components/ui/Button";
import { getViewer } from "@/lib/auth/viewer";

export default async function VerifyEmailPage() {
  const viewer = await getViewer();
  if (viewer.membership) redirect(viewer.profile?.onboarding_completed ? "/discover" : "/onboarding");

  return (
    <AuthShell
      eyebrow="One more step"
      title="Confirm your academic email"
      description="Open the confirmation link we sent you. Your verified university membership is created from that trusted confirmation."
    >
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral-100 text-2xl text-coral-800" aria-hidden="true">✉</span>
        <p className="mt-5 text-sm leading-6 text-ink-500">In local development, confirmation messages appear in Mailpit at <strong>http://127.0.0.1:54324</strong>.</p>
        <Link className={buttonStyles("secondary", "mt-6")} href="/auth/sign-in">Return to sign in</Link>
      </div>
    </AuthShell>
  );
}
