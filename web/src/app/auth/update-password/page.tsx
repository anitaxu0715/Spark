import { AuthShell } from "@/components/auth/AuthShell";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Use a strong password that you do not reuse for another account."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
