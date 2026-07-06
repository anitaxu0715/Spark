"use client";

import { useActionState } from "react";
import { updateNotificationPreferencesAction } from "@/actions/settings";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export function NotificationPreferencesForm({
  requestActivity,
  rescheduleActivity,
  feedbackReminders,
}: {
  requestActivity: boolean;
  rescheduleActivity: boolean;
  feedbackReminders: boolean;
}) {
  const [state, action] = useActionState(updateNotificationPreferencesAction, {});
  const options = [
    { name: "requestActivity", checked: requestActivity, title: "Request activity", description: "New requests and request status changes." },
    { name: "rescheduleActivity", checked: rescheduleActivity, title: "Reschedule activity", description: "Proposals, responses, and withdrawals." },
    { name: "feedbackReminders", checked: feedbackReminders, title: "Feedback reminders", description: "Reminders after a learning session is completed." },
  ];
  return (
    <form action={action} className="mt-9 max-w-2xl rounded-[2rem] border border-cream-200 bg-white p-6 shadow-card sm:p-8">
      <div className="space-y-5">
        {options.map((option) => (
          <label className="flex items-start gap-4" key={option.name}>
            <input className="mt-1 size-5 accent-coral-500" defaultChecked={option.checked} name={option.name} type="checkbox" />
            <span><strong className="block text-indigo-950">{option.title}</strong><span className="mt-1 block text-sm text-ink-500">{option.description}</span></span>
          </label>
        ))}
      </div>
      {state.error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      {state.success && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">{state.success}</p>}
      <div className="mt-6"><AuthSubmitButton pendingLabel="Saving preferences...">Save preferences</AuthSubmitButton></div>
    </form>
  );
}
