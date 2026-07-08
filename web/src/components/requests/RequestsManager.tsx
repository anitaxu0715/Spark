"use client";

import { useMemo, useState, useTransition } from "react";
import { transitionRequestAction } from "@/actions/requests";
import { cancelRescheduleAction, respondToRescheduleAction } from "@/actions/rescheduling";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { SafetyNotice } from "@/components/SafetyNotice";
import { StatusBadge } from "@/components/StatusBadge";
import { FeedbackForm } from "@/components/requests/FeedbackForm";
import { RescheduleForm } from "@/components/requests/RescheduleForm";
import { Button } from "@/components/ui/Button";
import type { LearningRequest, RequestStatus } from "@/types";

const statuses: Array<"all" | RequestStatus> = ["all", "pending", "accepted", "completed", "declined", "cancelled"];
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function RequestsManager({ requests, initialView = "incoming" }: { requests: LearningRequest[]; initialView?: "incoming" | "sent" }) {
  const [direction, setDirection] = useState(initialView);
  const [status, setStatus] = useState<"all" | RequestStatus>("all");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const visible = useMemo(() => requests.filter((request) => request.direction === direction && (status === "all" || request.status === status)), [direction, requests, status]);

  function transition(id: string, next: RequestStatus) {
    startTransition(async () => {
      const result = await transitionRequestAction(id, next, next === "cancelled" ? "Plans changed" : undefined);
      if (result.error) setMessage(result.error);
      else {
        setMessage("Request updated.");
        setConfirming(null);
      }
    });
  }

  function updateProposal(id: string, response: "accepted" | "declined" | "cancelled") {
    startTransition(async () => {
      const result = response === "cancelled"
        ? await cancelRescheduleAction(id)
        : await respondToRescheduleAction(id, response);
      setMessage(result?.error ?? "Reschedule proposal updated.");
    });
  }

  return (
    <>
      <div className="mt-10 border-b border-cream-200" role="group" aria-label="Request direction">
        {(["incoming", "sent"] as const).map((item) => (
          <button aria-pressed={direction === item} className={`min-h-12 border-b-2 px-5 text-sm font-bold capitalize focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral-300 ${direction === item ? "border-coral-500 text-indigo-950" : "border-transparent text-ink-500"}`} key={item} onClick={() => setDirection(item)} type="button">
            {item} <span className="ml-1 rounded-full bg-cream-100 px-2 py-0.5 text-xs">{requests.filter((request) => request.direction === item).length}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter requests by status">
        {statuses.map((item) => (
          <button aria-pressed={status === item} className={`min-h-10 rounded-full px-4 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral-300 ${status === item ? "bg-indigo-950 text-white" : "border border-indigo-200 bg-white text-indigo-800"}`} key={item} onClick={() => setStatus(item)} type="button">{item}</button>
        ))}
      </div>
      {message && <p className="mt-5 rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-800" role="status">{message}</p>}
      <div className="mt-7 space-y-5">
        {visible.length ? visible.map((request) => {
          const canRespond = request.direction === "incoming" && request.status === "pending";
          const canCancel = (request.direction === "sent" && request.status === "pending") || request.status === "accepted";
          const canComplete = request.status === "accepted";
          const pendingProposal = request.rescheduleProposals.find((proposal) => proposal.status === "pending");
          return (
            <article className="rounded-[1.75rem] border border-cream-200 bg-white p-5 shadow-card sm:p-6" key={request.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar initials={request.personInitials} size="sm" />
                  <div><h2 className="font-bold text-indigo-950">{request.personName}</h2><p className="mt-0.5 text-sm text-ink-500">{request.direction === "incoming" ? "Wants to learn" : "You want to learn"} <strong>{request.skill}</strong></p></div>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <blockquote className="mt-5 rounded-2xl bg-cream-100 p-4 text-sm leading-6 text-ink-600">
                {request.message ? `"${request.message}"` : "No message added yet."}
              </blockquote>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="eyebrow">Suggested time</dt>
                  <dd className="mt-1.5 font-semibold text-indigo-950">
                    {request.preferredTime ? (
                      <time dateTime={request.preferredTime} suppressHydrationWarning>{dateFormatter.format(new Date(request.preferredTime))}</time>
                    ) : "Not set yet"}
                  </dd>
                </div>
                <div><dt className="eyebrow">Format</dt><dd className="mt-1.5 font-semibold capitalize text-indigo-950">{request.format}</dd></div>
              </dl>
              {request.format === "in-person" && <div className="mt-5"><SafetyNotice compact /></div>}
              {pendingProposal && (
                <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="font-bold text-indigo-950">Pending reschedule proposal</h3>
                  <p className="mt-2 text-sm text-ink-600">
                    {dateFormatter.format(new Date(pendingProposal.proposedAt))}
                    {" · "}{pendingProposal.proposedFormat}
                  </p>
                  {pendingProposal.note && <p className="mt-2 text-sm text-ink-500">{pendingProposal.note}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pendingProposal.proposerId === request.personId ? (
                      <>
                        <Button disabled={pending} onClick={() => updateProposal(pendingProposal.id, "accepted")} type="button">Accept new schedule</Button>
                        <Button disabled={pending} onClick={() => updateProposal(pendingProposal.id, "declined")} type="button" variant="danger">Decline</Button>
                      </>
                    ) : (
                      <Button disabled={pending} onClick={() => updateProposal(pendingProposal.id, "cancelled")} type="button" variant="secondary">Withdraw proposal</Button>
                    )}
                  </div>
                </section>
              )}
              {(canRespond || canCancel || canComplete || (request.status === "completed" && !request.hasFeedback)) && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-cream-200 pt-5">
                  {canRespond && <><Button disabled={pending} onClick={() => transition(request.id, "accepted")} type="button">Accept</Button><Button disabled={pending} onClick={() => transition(request.id, "declined")} type="button" variant="danger">Decline</Button></>}
                  {canComplete && <Button disabled={pending} onClick={() => transition(request.id, "completed")} type="button" variant="secondary">Mark completed</Button>}
                  {canCancel && <Button disabled={pending} onClick={() => setConfirming(request.id)} type="button" variant="danger">Cancel request</Button>}
                  {request.status === "completed" && !request.hasFeedback && <Button onClick={() => setFeedback(feedback === request.id ? null : request.id)} type="button" variant="secondary">Leave private feedback</Button>}
                </div>
              )}
              {confirming === request.id && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-900">Cancel this request? This action cannot be reversed.</p>
                  <div className="mt-3 flex gap-3"><Button disabled={pending} onClick={() => transition(request.id, "cancelled")} type="button" variant="danger">Confirm cancellation</Button><Button onClick={() => setConfirming(null)} type="button" variant="quiet">Keep request</Button></div>
                </div>
              )}
              {feedback === request.id && <div className="mt-4"><FeedbackForm requestId={request.id} /></div>}
              {request.status === "accepted" && !pendingProposal && <RescheduleForm requestId={request.id} />}
            </article>
          );
        }) : <EmptyState title={`No ${status === "all" ? "" : `${status} `}${direction} requests`} description="Requests matching this view will appear here." action={direction === "sent" ? { href: "/discover", label: "Discover skills" } : undefined} />}
      </div>
    </>
  );
}
