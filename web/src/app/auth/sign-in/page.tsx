import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { SetupState } from "@/components/SetupState";
import { getViewer } from "@/lib/auth/viewer";
import { safeRedirectPath } from "@/lib/validation";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; message?: string }> }) {
  const viewer = await getViewer();
  if (!viewer.configured) return <SetupState />;
  if (viewer.user) {
    if (!viewer.membership) redirect("/verify-email");
    if (viewer.access?.restricted || viewer.access?.deletion_pending) redirect("/account-status");
    redirect(viewer.profile?.onboarding_completed ? "/discover" : "/onboarding");
  }
  const params = await searchParams;
  const externalError = params.error === "expired-link"
    ? "This sign-in or recovery link is invalid or expired. Request a new link and try again."
    : params.error === "configuration"
      ? "Spark is not connected to Supabase. Complete the local environment setup and try again."
      : undefined;
  const externalMessage = params.message === "deletion-requested"
    ? "Account deletion is scheduled. Sign in during the seven-day grace period if you want to cancel it."
    : undefined;
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Spark"
      description="Continue learning with your university community."
      footer={<>New to Spark? <Link className="font-bold text-indigo-800" href="/auth/sign-up">Create an account</Link></>}
    >
      <SignInForm externalError={externalError} externalMessage={externalMessage} next={safeRedirectPath(params.next)} />
    </AuthShell>
  );
}
