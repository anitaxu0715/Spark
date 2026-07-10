"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRequestMessageAction } from "@/actions/requests";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import type { RequestMessage, RequestStatus } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function RequestConversation({
  requestId,
  messages,
  status,
  viewerId,
}: {
  requestId: string;
  messages: RequestMessage[];
  status: RequestStatus;
  viewerId: string;
}) {
  const [state, action] = useActionState(createRequestMessageAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const error = state.fieldErrors?.body?.[0] ?? state.error;
  const canMessage = status === "pending" || status === "accepted";
  const closedCopy = {
    completed: "This request is complete. Conversation history stays visible, but new messages are closed.",
    cancelled: "This request was cancelled, so new messages are closed.",
    declined: "This request was declined, so new messages are closed.",
  } satisfies Partial<Record<RequestStatus, string>>;

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <section className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4" aria-labelledby={`conversation-${requestId}`}>
      <h3 className="font-bold text-indigo-950" id={`conversation-${requestId}`}>Conversation</h3>
      <p className="mt-1 text-xs leading-5 text-ink-500">Use this space to coordinate time, place, or quick questions. Keep messages friendly and practical.</p>

      <div className="mt-4 space-y-3">
        {messages.length ? messages.map((message) => {
          const isViewer = message.authorId === viewerId;
          return (
            <div className={`rounded-2xl border p-3 ${isViewer ? "border-coral-100 bg-white" : "border-indigo-100 bg-cream-50"}`} key={message.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="font-bold text-indigo-950">{isViewer ? "You" : message.authorName}</p>
                <time className="text-ink-400" dateTime={message.createdAt} suppressHydrationWarning>{dateFormatter.format(new Date(message.createdAt))}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-600">{message.body}</p>
            </div>
          );
        }) : (
          <p className="rounded-2xl bg-white p-4 text-sm text-ink-500">No messages yet. Use this space to coordinate time, place, or questions.</p>
        )}
      </div>

      {canMessage ? (
        <form action={action} className="mt-4" noValidate ref={formRef}>
          <input name="requestId" type="hidden" value={requestId} />
          <label className="block text-sm font-semibold text-indigo-950" htmlFor={`request-message-${requestId}`}>Add a message</label>
          <textarea
            aria-describedby={`request-message-help-${requestId}${error ? ` request-message-error-${requestId}` : ""}`}
            className="mt-2 min-h-24 w-full resize-y rounded-xl border border-indigo-200 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral-300"
            id={`request-message-${requestId}`}
            maxLength={1000}
            name="body"
            placeholder="e.g. I can meet near the library after 3pm."
            required
          />
          <p className="mt-1 text-xs leading-5 text-ink-500" id={`request-message-help-${requestId}`}>1-1000 characters. Please avoid sharing sensitive contact details until you feel comfortable.</p>
          {error && <p className="mt-2 text-sm font-semibold text-red-700" id={`request-message-error-${requestId}`} role="alert">{error}</p>}
          {state.success && <p className="mt-2 text-sm font-semibold text-emerald-800" role="status">{state.success}</p>}
          <div className="mt-3"><AuthSubmitButton pendingLabel="Sending message...">Send message</AuthSubmitButton></div>
        </form>
      ) : (
        <p className="mt-4 rounded-xl bg-cream-100 p-3 text-sm text-ink-500">{closedCopy[status] ?? "New messages are closed for this request."}</p>
      )}
    </section>
  );
}
