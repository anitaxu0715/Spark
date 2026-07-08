import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SetupState } from "@/components/SetupState";
import { getViewer } from "@/lib/auth/viewer";

export default async function SignUpPage() {
  const viewer = await getViewer();
  if (!viewer.configured) return <SetupState />;
  if (viewer.user) {
    if (!viewer.membership) redirect("/verify-email");
    redirect(viewer.profile?.onboarding_completed ? "/discover" : "/onboarding");
  }
  return (
    <AuthShell
      eyebrow="Join the community"
      title="Create your Spark account"
      description="Academic email confirmation keeps Spark trusted. Invited beta testers can also join with a personal email and invite code."
      footer={<>Already have an account? <Link className="font-bold text-indigo-800" href="/auth/sign-in">Sign in</Link></>}
    >
      <SignUpForm />
    </AuthShell>
  );
}
