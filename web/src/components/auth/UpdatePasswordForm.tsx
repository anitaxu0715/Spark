"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction } from "@/actions/auth";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { FormField } from "@/components/ui/FormField";

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormField id="new-password" label="New password" error={state.fieldErrors?.password?.[0]}>
        <input autoComplete="new-password" className="field" id="new-password" name="password" type="password" required />
      </FormField>
      <FormField id="confirm-new-password" label="Confirm new password" error={state.fieldErrors?.confirmPassword?.[0]}>
        <input autoComplete="new-password" className="field" id="confirm-new-password" name="confirmPassword" type="password" required />
      </FormField>
      {state.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      {state.success && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">
          {state.success} <Link className="underline" href="/discover">Continue to discovery</Link>
        </p>
      )}
      <AuthSubmitButton pendingLabel="Updating password…">Update password</AuthSubmitButton>
    </form>
  );
}
