"use client";

import { useActionState } from "react";
import { addModerationNoteAction, applyRestrictionAction, updateModerationCaseAction } from "@/actions/moderation";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

function Result({ state }: { state: { error?: string; success?: string; fieldErrors?: Record<string, string[] | undefined> } }) {
  const fieldError = state.fieldErrors ? Object.values(state.fieldErrors).flat().filter(Boolean)[0] : null;
  return <>
    {(state.error || fieldError) && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{state.error ?? fieldError}</p>}
    {state.success && <p className="mt-3 text-sm font-semibold text-emerald-800" role="status">{state.success}</p>}
  </>;
}

export function CaseControls({
  caseId,
  subjectId,
  status,
  priority,
  restricted,
}: {
  caseId: string;
  subjectId: string | null;
  status: "submitted" | "reviewing" | "resolved" | "dismissed" | "escalated";
  priority: "standard" | "elevated" | "urgent";
  restricted: boolean;
}) {
  const [caseState, caseAction] = useActionState(updateModerationCaseAction, {});
  const [noteState, noteAction] = useActionState(addModerationNoteAction, {});
  const [restrictionState, restrictionAction] = useActionState(applyRestrictionAction, {});
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={caseAction} className="rounded-2xl border border-cream-200 bg-white p-5">
        <input name="caseId" type="hidden" value={caseId} />
        <h2 className="text-xl font-bold text-indigo-950">Case state</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Status
            <select className="mt-2 min-h-11 w-full rounded-xl border border-indigo-200 px-3" defaultValue={status} name="status">
              {["submitted", "reviewing", "resolved", "dismissed", "escalated"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Priority
            <select className="mt-2 min-h-11 w-full rounded-xl border border-indigo-200 px-3" defaultValue={priority} name="priority">
              {["standard", "elevated", "urgent"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm font-semibold">Internal transition reason
          <textarea className="mt-2 min-h-24 w-full rounded-xl border border-indigo-200 p-3" maxLength={1000} name="reason" />
        </label>
        <Result state={caseState} />
        <div className="mt-4"><AuthSubmitButton pendingLabel="Updating case...">Update case</AuthSubmitButton></div>
      </form>

      <form action={noteAction} className="rounded-2xl border border-cream-200 bg-white p-5">
        <input name="caseId" type="hidden" value={caseId} />
        <h2 className="text-xl font-bold text-indigo-950">Internal note</h2>
        <textarea className="mt-4 min-h-32 w-full rounded-xl border border-indigo-200 p-3" maxLength={2000} minLength={3} name="body" required />
        <Result state={noteState} />
        <div className="mt-4"><AuthSubmitButton pendingLabel="Adding note...">Add note</AuthSubmitButton></div>
      </form>

      {subjectId && !restricted && (
        <form action={restrictionAction} className="rounded-2xl border border-red-200 bg-red-50 p-5 lg:col-span-2">
          <input name="caseId" type="hidden" value={caseId} />
          <input name="userId" type="hidden" value={subjectId} />
          <h2 className="text-xl font-bold text-red-950">Restrict community access</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-red-950">Restriction
              <select className="mt-2 min-h-11 w-full rounded-xl border border-red-200 bg-white px-3" name="type">
                <option value="temporary_suspension">Temporary suspension</option>
                <option value="indefinite_suspension">Indefinite suspension</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-red-950">Expiration for temporary restriction
              <input className="mt-2 min-h-11 w-full rounded-xl border border-red-200 bg-white px-3" name="expiresAt" type="datetime-local" />
            </label>
          </div>
          <label className="mt-4 block text-sm font-semibold text-red-950">Internal reason
            <textarea className="mt-2 min-h-24 w-full rounded-xl border border-red-200 bg-white p-3" maxLength={1000} minLength={10} name="reason" required />
          </label>
          <Result state={restrictionState} />
          <div className="mt-4"><AuthSubmitButton pendingLabel="Applying restriction...">Apply restriction</AuthSubmitButton></div>
        </form>
      )}
    </div>
  );
}
