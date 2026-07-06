"use client";

import { useActionState } from "react";
import { updatePrivacyAction } from "@/actions/profile";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export function PrivacyForm({
  discoverable,
  showLocation,
}: {
  discoverable: boolean;
  showLocation: boolean;
}) {
  const [state, action] = useActionState(updatePrivacyAction, {});

  return (
    <form action={action} className="mt-9 rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-8">
      <div className="space-y-5">
        <label className="flex items-start gap-4">
          <input className="mt-1 size-5 accent-coral-500" defaultChecked={discoverable} name="discoverable" type="checkbox" />
          <span><strong className="block text-indigo-950">Appear in discovery</strong><span className="mt-1 block text-sm leading-6 text-ink-500">When off, only you and existing request participants can retain relevant history.</span></span>
        </label>
        <label className="flex items-start gap-4">
          <input className="mt-1 size-5 accent-coral-500" defaultChecked={showLocation} name="showLocation" type="checkbox" />
          <span><strong className="block text-indigo-950">Show general location</strong><span className="mt-1 block text-sm leading-6 text-ink-500">Your city-level location is stored separately and withheld when this is off.</span></span>
        </label>
      </div>
      {state.error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      {state.success && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">{state.success}</p>}
      <div className="mt-6">
        <AuthSubmitButton pendingLabel="Saving privacy settings…">Save privacy settings</AuthSubmitButton>
      </div>
    </form>
  );
}
