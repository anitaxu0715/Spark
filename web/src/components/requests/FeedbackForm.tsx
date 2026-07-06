"use client";

import { useActionState } from "react";
import { submitFeedbackAction } from "@/actions/requests";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { FormField } from "@/components/ui/FormField";

export function FeedbackForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(submitFeedbackAction, {});
  if (state.success) return <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">{state.success}</p>;

  return (
    <form action={action} className="space-y-4 rounded-2xl bg-indigo-50 p-5" noValidate>
      <input name="requestId" type="hidden" value={requestId} />
      <p className="font-bold text-indigo-950">Private session feedback</p>
      <p className="text-xs leading-5 text-ink-500">Your answers help improve Spark. They are never shown as a public rating.</p>
      {([
        ["helpful", "The session was helpful"],
        ["comfortableAndRespected", "I felt comfortable and respected"],
        ["learnTogetherAgain", "I would learn together again"],
      ] as const).map(([name, label]) => {
        const error = state.fieldErrors?.[name]?.[0];
        return (
        <fieldset aria-describedby={error ? `${name}-error` : undefined} key={name}>
          <legend className="text-sm font-semibold text-indigo-950">{label}</legend>
          <div className="mt-2 flex gap-5">
            <label className="flex items-center gap-2 text-sm"><input name={name} required type="radio" value="yes" /> Yes</label>
            <label className="flex items-center gap-2 text-sm"><input name={name} required type="radio" value="no" /> No</label>
          </div>
          {error && <p className="mt-2 text-sm font-medium text-red-700" id={`${name}-error`} role="alert">{error}</p>}
        </fieldset>
        );
      })}
      <FormField id={`feedback-note-${requestId}`} label="Private note (optional)">
        <textarea className="field min-h-20 resize-y" id={`feedback-note-${requestId}`} maxLength={1000} name="privateNote" />
      </FormField>
      {state.error && <p className="text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      <AuthSubmitButton pendingLabel="Saving feedback…">Submit private feedback</AuthSubmitButton>
    </form>
  );
}
