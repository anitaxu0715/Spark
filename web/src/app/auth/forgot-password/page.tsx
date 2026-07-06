import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="We will send reset instructions if the address belongs to an account."
      footer={<Link className="font-bold text-indigo-800" href="/auth/sign-in">Return to sign in</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
