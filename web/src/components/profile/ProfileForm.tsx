"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfileAction } from "@/actions/profile";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { FormField } from "@/components/ui/FormField";
import type { Profile, Skill } from "@/types";

interface ProfileFormProps {
  profile: Profile;
  skills: Skill[];
  onboarding?: boolean;
}

export function ProfileForm({ profile, skills, onboarding = false }: ProfileFormProps) {
  const router = useRouter();
  const [state, action] = useActionState(saveProfileAction, {});
  const teachIds = new Set(profile.teachSkillOptions.map((skill) => skill.id));
  const learnIds = new Set(profile.learnSkillOptions.map((skill) => skill.id));

  useEffect(() => {
    if (state.success && onboarding) router.push("/profile");
  }, [onboarding, router, state.success]);

  return (
    <form action={action} className="space-y-8" noValidate>
      <fieldset>
        <legend className="text-xl font-bold text-indigo-950">About you</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <FormField id="display-name" label="Display name" error={state.fieldErrors?.displayName?.[0]}>
            <input className="field" defaultValue={profile.name} id="display-name" name="displayName" required />
          </FormField>
          <FormField id="major" label="Major or area of study (optional)" error={state.fieldErrors?.major?.[0]}>
            <input className="field" defaultValue={profile.major} id="major" name="major" />
          </FormField>
          <FormField id="general-location" label="General location (optional)" error={state.fieldErrors?.location?.[0]} hint="Share a broad area only if it helps people plan in-person sessions.">
            <input className="field" defaultValue={profile.location ?? ""} id="general-location" name="location" />
          </FormField>
          <FormField id="availability" label="Availability (optional)" error={state.fieldErrors?.availability?.[0]}>
            <input className="field" defaultValue={profile.availability.summary} id="availability" name="availability" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField id="biography" label="Biography (optional)" error={state.fieldErrors?.biography?.[0]} hint="A short intro can help, but you can leave this blank and come back later.">
              <textarea className="field min-h-28 resize-y" defaultValue={profile.bio} id="biography" maxLength={800} name="biography" />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField id="learning-style" label="Teaching and learning style (optional)" error={state.fieldErrors?.learningStyle?.[0]}>
              <input className="field" defaultValue={profile.style} id="learning-style" name="learningStyle" />
            </FormField>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xl font-bold text-indigo-950">Skills</legend>
        <p className="mt-2 text-sm text-ink-500">Choose from the curated catalog. You can be both a teacher and a learner.</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold text-indigo-950">Skills I can share</p>
            <div className="mt-3 grid gap-2">
              {skills.map((skill) => (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-cream-200 px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-coral-50" key={`teach-${skill.id}`}>
                  <input className="size-4 accent-coral-500" defaultChecked={teachIds.has(skill.id)} name="teachingSkillIds" type="checkbox" value={skill.id} />
                  {skill.name}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <FormField id="custom-teaching-skill" label="Add a skill I can share" error={state.fieldErrors?.customTeachingSkills?.[0]} hint="Optional. 2-80 characters; no URLs, emails, or markup.">
                <input className="field" id="custom-teaching-skill" name="customTeachingSkills" placeholder="e.g. Crochet basics" />
              </FormField>
            </div>
            {state.fieldErrors?.teachingSkillIds?.[0] && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{state.fieldErrors.teachingSkillIds[0]}</p>}
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-950">Skills I want to learn</p>
            <div className="mt-3 grid gap-2">
              {skills.map((skill) => (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-cream-200 px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-indigo-50" key={`learn-${skill.id}`}>
                  <input className="size-4 accent-indigo-800" defaultChecked={learnIds.has(skill.id)} name="learningSkillIds" type="checkbox" value={skill.id} />
                  {skill.name}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <FormField id="custom-learning-skill" label="Add a skill I want to learn" error={state.fieldErrors?.customLearningSkills?.[0]} hint="Optional. Use the same name to reuse an existing community skill.">
                <input className="field" id="custom-learning-skill" name="customLearningSkills" placeholder="e.g. Grant writing" />
              </FormField>
            </div>
            {state.fieldErrors?.learningSkillIds?.[0] && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{state.fieldErrors.learningSkillIds[0]}</p>}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xl font-bold text-indigo-950">Preferences and privacy</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <FormField id="meeting-preference" label="Meeting preference">
            <select className="field" defaultValue={profile.format} id="meeting-preference" name="meetingPreference">
              <option value="either">Online or in person</option>
              <option value="online">Online</option>
              <option value="in-person">In person</option>
            </select>
          </FormField>
          <div className="space-y-3 pt-1">
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-indigo-950">
              <input className="size-5 accent-coral-500" defaultChecked={profile.beginnerFriendly} name="beginnerFriendly" type="checkbox" />
              I welcome beginners
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-indigo-950">
              <input className="size-5 accent-coral-500" defaultChecked={profile.discoverable || onboarding} name="discoverable" type="checkbox" />
              Show my profile in discovery
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-indigo-950">
              <input className="size-5 accent-coral-500" defaultChecked={profile.showLocation} name="showLocation" type="checkbox" />
              Show my general location
            </label>
          </div>
        </div>
      </fieldset>

      {state.error && <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      {state.success && !onboarding && <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">{state.success}</p>}
      <AuthSubmitButton pendingLabel="Saving profile…">{onboarding ? "Complete profile" : "Save profile"}</AuthSubmitButton>
    </form>
  );
}
