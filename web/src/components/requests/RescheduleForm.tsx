"use client";

import { useActionState } from "react";
import { proposeRescheduleAction } from "@/actions/rescheduling";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export function RescheduleForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(proposeRescheduleAction, {});
  return (
    <form action={action} className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
      <input name="requestId" type="hidden" value={requestId} />
      <h3 className="font-bold text-indigo-950">Propose a new schedule</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-indigo-950">New date and time
          <input className="mt-2 min-h-11 w-full rounded-xl border border-indigo-200 bg-white px-3" name="preferredAt" required type="datetime-local" />
        </label>
        <label className="text-sm font-semibold text-indigo-950">Meeting format
          <select className="mt-2 min-h-11 w-full rounded-xl border border-indigo-200 bg-white px-3" name="format">
            <option value="online">Online</option>
            <option value="in-person">In person</option>
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-indigo-950">Note (optional)
        <textarea className="mt-2 min-h-24 w-full rounded-xl border border-indigo-200 bg-white p-3" maxLength={500} name="note" />
      </label>
      {state.error && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{state.error}</p>}
      {state.fieldErrors && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{Object.values(state.fieldErrors).flat().filter(Boolean)[0]}</p>}
      {state.success && <p className="mt-3 text-sm font-semibold text-emerald-800" role="status">{state.success}</p>}
      <div className="mt-4"><AuthSubmitButton pendingLabel="Sending proposal...">Send proposal</AuthSubmitButton></div>
    </form>
  );
}
