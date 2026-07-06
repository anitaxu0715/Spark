"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { blockProfileAction, reportProfileAction, toggleSavedProfileAction } from "@/actions/profile";
import { RequestForm } from "@/components/RequestForm";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import type { Profile, Skill } from "@/types";

export function ProfileActions({ profile, offeredSkills }: { profile: Profile; offeredSkills: Skill[] }) {
  const [saved, setSaved] = useState(Boolean(profile.saved));
  const [dialog, setDialog] = useState<"request" | "report" | "block" | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [reportState, reportAction] = useActionState(reportProfileAction, {});
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!dialog) return;
    const opener = openerRef.current;
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialog(null);
        return;
      }
      if (event.key !== "Tab") return;
      const modal = closeRef.current?.closest('[role="dialog"]');
      const focusable = modal
        ? Array.from(modal.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ))
        : [];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [dialog]);

  function openDialog(nextDialog: "request" | "report" | "block", trigger: HTMLButtonElement) {
    openerRef.current = trigger;
    setDialog(nextDialog);
  }

  function toggleSaved() {
    const next = !saved;
    startTransition(async () => {
      const result = await toggleSavedProfileAction(profile.id, next);
      if (result.error) setMessage(result.error);
      else {
        setSaved(next);
        setMessage(next ? "Profile saved." : "Profile removed from saved profiles.");
      }
    });
  }

  function confirmBlock() {
    startTransition(async () => {
      const result = await blockProfileAction(profile.id);
      if (result.error) setMessage(result.error);
      else window.location.assign("/discover");
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button onClick={(event) => openDialog("request", event.currentTarget)} type="button">Send learning request</Button>
        <Button aria-pressed={saved} disabled={pending} onClick={toggleSaved} type="button" variant="secondary">{saved ? "Profile saved" : "Save profile"}</Button>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={(event) => openDialog("report", event.currentTarget)} type="button" variant="quiet">Report</Button>
          <Button className="flex-1" onClick={(event) => openDialog("block", event.currentTarget)} type="button" variant="danger">Block</Button>
        </div>
        {message && <p className="text-center text-sm text-ink-500" role="status">{message}</p>}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 grid items-end bg-indigo-950/55 sm:items-center sm:p-6" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setDialog(null);
        }}>
          <section aria-labelledby="profile-dialog-title" aria-modal="true" className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-cream-50 p-5 shadow-2xl sm:mx-auto sm:max-w-xl sm:rounded-[2rem] sm:p-7" role="dialog">
            <div className="flex items-start justify-between gap-5">
              <h2 className="text-2xl font-bold text-indigo-950" id="profile-dialog-title">
                {dialog === "request" ? `Learn with ${profile.name}` : dialog === "report" ? "Report this profile" : `Block ${profile.name}?`}
              </h2>
              <button aria-label="Close dialog" className="grid size-11 shrink-0 place-items-center rounded-full border border-indigo-200 bg-white text-xl" onClick={() => setDialog(null)} ref={closeRef} type="button">×</button>
            </div>
            <div className="mt-6">
              {dialog === "request" && <RequestForm offeredSkills={offeredSkills} profile={profile} />}
              {dialog === "report" && (
                <form action={reportAction} className="space-y-5">
                  <input name="profileId" type="hidden" value={profile.id} />
                  <FormField id="report-reason" label="Reason" error={reportState.fieldErrors?.reason?.[0]}>
                    <select className="field" id="report-reason" name="reason">
                      <option value="safety">Safety concern</option>
                      <option value="harassment">Harassment</option>
                      <option value="spam">Spam</option>
                      <option value="misrepresentation">Misrepresentation</option>
                      <option value="other">Other</option>
                    </select>
                  </FormField>
                  <FormField id="report-details" label="Private details (optional)" error={reportState.fieldErrors?.details?.[0]}>
                    <textarea className="field min-h-24 resize-y" id="report-details" maxLength={1000} name="details" />
                  </FormField>
                  {reportState.error && <p className="text-sm font-medium text-red-700" role="alert">{reportState.error}</p>}
                  {reportState.success ? <p className="text-sm font-medium text-emerald-800" role="status">{reportState.success}</p> : <Button type="submit">Submit report</Button>}
                </form>
              )}
              {dialog === "block" && (
                <div>
                  <p className="text-sm leading-6 text-ink-600">You will no longer appear in each other&apos;s discovery results, and new requests will be disabled. Existing request history remains available.</p>
                  <div className="mt-6 flex gap-3">
                    <Button disabled={pending} onClick={confirmBlock} type="button" variant="danger">Confirm block</Button>
                    <Button onClick={() => setDialog(null)} type="button" variant="quiet">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
