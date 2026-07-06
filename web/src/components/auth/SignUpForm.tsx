"use client";

import { useActionState } from "react";
import { signUpAction } from "@/actions/auth";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { FormField } from "@/components/ui/FormField";

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormField id="signup-email" label="Academic email" error={state.fieldErrors?.email?.[0]} hint="Use your university-issued email address.">
        <input autoComplete="email" className="field" id="signup-email" name="email" type="email" aria-invalid={Boolean(state.fieldErrors?.email)} required />
      </FormField>
      <FormField id="signup-password" label="Password" error={state.fieldErrors?.password?.[0]} hint="At least 10 characters with uppercase, lowercase, number, and symbol.">
        <input autoComplete="new-password" className="field" id="signup-password" name="password" type="password" aria-invalid={Boolean(state.fieldErrors?.password)} required />
      </FormField>
      <FormField id="signup-confirm" label="Confirm password" error={state.fieldErrors?.confirmPassword?.[0]}>
        <input autoComplete="new-password" className="field" id="signup-confirm" name="confirmPassword" type="password" aria-invalid={Boolean(state.fieldErrors?.confirmPassword)} required />
      </FormField>
      {state.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      <AuthSubmitButton pendingLabel="Creating account…">Create account</AuthSubmitButton>
    </form>
  );
}
