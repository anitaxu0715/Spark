"use client";

import { useActionState } from "react";
import { requestAccountDeletionAction } from "@/actions/settings";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export function DeleteAccountForm() {
  const [state, action] = useActionState(requestAccountDeletionAction, {});
  return (
    <form action={action} className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
      <h2 className="text-xl font-bold text-red-950">Schedule account deletion</h2>
      <p className="mt-2 text-sm leading-6 text-red-900">Your profile is hidden immediately. You can cancel for seven days; after that, personal account data is permanently removed while anonymized safety records may remain.</p>
      <label className="mt-5 block text-sm font-semibold text-red-950">Current password
        <input autoComplete="current-password" className="mt-2 min-h-11 w-full rounded-xl border border-red-200 bg-white px-3" name="password" required type="password" />
      </label>
      <label className="mt-4 block text-sm font-semibold text-red-950">Type DELETE to confirm
        <input autoComplete="off" className="mt-2 min-h-11 w-full rounded-xl border border-red-200 bg-white px-3" name="confirmation" required />
      </label>
      {state.error && <p className="mt-4 text-sm font-semibold text-red-800" role="alert">{state.error}</p>}
      {state.fieldErrors && <p className="mt-4 text-sm font-semibold text-red-800" role="alert">{Object.values(state.fieldErrors).flat().filter(Boolean)[0]}</p>}
      <div className="mt-5"><AuthSubmitButton pendingLabel="Scheduling deletion...">Schedule deletion</AuthSubmitButton></div>
    </form>
  );
}
