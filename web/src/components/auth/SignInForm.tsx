"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/actions/auth";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { FormField } from "@/components/ui/FormField";

export function SignInForm({ next, externalError, externalMessage }: { next?: string; externalError?: string; externalMessage?: string }) {
  const [state, action] = useActionState(signInAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <input name="next" type="hidden" value={next ?? "/discover"} />
      <FormField id="signin-email" label="Email" error={state.fieldErrors?.email?.[0]}>
        <input autoComplete="email" className="field" id="signin-email" name="email" type="email" aria-invalid={Boolean(state.fieldErrors?.email)} required />
      </FormField>
      <FormField id="signin-password" label="Password" error={state.fieldErrors?.password?.[0]}>
        <input autoComplete="current-password" className="field" id="signin-password" name="password" type="password" aria-invalid={Boolean(state.fieldErrors?.password)} required />
      </FormField>
      <div className="text-right">
        <Link className="text-sm font-semibold text-indigo-800 hover:text-coral-600" href="/auth/forgot-password">Forgot password?</Link>
      </div>
      {(state.error || externalError) && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{state.error ?? externalError}</p>}
      {externalMessage && <p className="rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-800" role="status">{externalMessage}</p>}
      <AuthSubmitButton pendingLabel="Signing in…">Sign in</AuthSubmitButton>
    </form>
  );
}
