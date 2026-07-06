"use client";

import { useActionState, useState } from "react";
import { createLearningRequestAction } from "@/actions/requests";
import { SafetyNotice } from "@/components/SafetyNotice";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { FormField } from "@/components/ui/FormField";
import type { Profile, Skill } from "@/types";

export function RequestForm({ profile, offeredSkills }: { profile: Profile; offeredSkills: Skill[] }) {
  const [state, action] = useActionState(createLearningRequestAction, {});
  const [format, setFormat] = useState<"online" | "in-person">(
    profile.format === "in-person" ? "in-person" : "online",
  );
  if (state.success) {
    return (
      <div className="py-8 text-center" role="status">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-100 text-2xl text-emerald-800" aria-hidden="true">✓</span>
        <h3 className="mt-5 text-xl font-bold text-indigo-950">Request sent</h3>
        <p className="mt-2 text-sm text-ink-500">{state.success}</p>
        <a className="mt-5 inline-flex font-bold text-coral-600 hover:text-coral-800" href="/requests?view=sent">View sent requests →</a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input name="recipientId" type="hidden" value={profile.id} />
      <FormField id="request-skill" label="What would you like to learn?" error={state.fieldErrors?.requestedSkillId?.[0]}>
        <select className="field" id="request-skill" name="requestedSkillId" required>
          {profile.teachSkillOptions.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
        </select>
      </FormField>
      <FormField id="request-message" label={`Message for ${profile.name.split(" ")[0]}`} error={state.fieldErrors?.message?.[0]}>
        <textarea className="field min-h-28 resize-y" id="request-message" maxLength={1000} name="message" placeholder="Introduce yourself and share what you hope to learn." required />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="request-time" label="Preferred date and time" error={state.fieldErrors?.preferredAt?.[0]}>
          <input className="field" id="request-time" name="preferredAt" type="datetime-local" required />
        </FormField>
        <FormField id="request-format" label="Session format">
          <select className="field" id="request-format" name="format" onChange={(event) => setFormat(event.target.value as "online" | "in-person")} value={format}>
            {profile.format !== "in-person" && <option value="online">Online</option>}
            {profile.format !== "online" && <option value="in-person">In person</option>}
          </select>
        </FormField>
      </div>
      <FormField id="offered-skill" label="A skill you could share (optional)">
        <select className="field" id="offered-skill" name="offeredSkillId">
          <option value="">No skill selected</option>
          {offeredSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
        </select>
      </FormField>
      {format === "in-person" && <SafetyNotice compact />}
      {state.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      <AuthSubmitButton pendingLabel="Sending request…">Send learning request</AuthSubmitButton>
    </form>
  );
}
