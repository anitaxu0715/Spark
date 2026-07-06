"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "@/actions/auth";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { FormField } from "@/components/ui/FormField";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormField id="reset-email" label="Account email" error={state.fieldErrors?.email?.[0]}>
        <input aria-invalid={Boolean(state.fieldErrors?.email)} autoComplete="email" className="field" id="reset-email" name="email" type="email" required />
      </FormField>
      {state.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      {state.success && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">{state.success}</p>}
      <AuthSubmitButton pendingLabel="Requesting reset…">Send reset instructions</AuthSubmitButton>
    </form>
  );
}
