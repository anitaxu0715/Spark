"use client";

import { useActionState } from "react";
import { addInstitutionDomainAction } from "@/actions/institutions";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export function DomainForm({ universityId, canAddDevelopment }: { universityId: string; canAddDevelopment: boolean }) {
  const [state, action] = useActionState(addInstitutionDomainAction, {});
  return (
    <form action={action} className="mt-6 rounded-2xl border border-cream-200 bg-white p-5">
      <input name="universityId" type="hidden" value={universityId} />
      <h2 className="text-xl font-bold text-indigo-950">Add academic email domain</h2>
      <label className="mt-4 block text-sm font-semibold">Domain
        <input autoCapitalize="none" className="mt-2 min-h-11 w-full rounded-xl border border-indigo-200 px-3" name="domain" placeholder="university.edu" required />
      </label>
      {canAddDevelopment && <label className="mt-4 flex items-center gap-3 text-sm font-semibold"><input className="size-5 accent-coral-500" name="development" type="checkbox" />Development-only domain</label>}
      {state.error && <p className="mt-4 text-sm font-semibold text-red-700" role="alert">{state.error}</p>}
      {state.fieldErrors && <p className="mt-4 text-sm font-semibold text-red-700" role="alert">{Object.values(state.fieldErrors).flat().filter(Boolean)[0]}</p>}
      {state.success && <p className="mt-4 text-sm font-semibold text-emerald-800" role="status">{state.success}</p>}
      <div className="mt-4"><AuthSubmitButton pendingLabel="Adding domain...">Add domain</AuthSubmitButton></div>
    </form>
  );
}
