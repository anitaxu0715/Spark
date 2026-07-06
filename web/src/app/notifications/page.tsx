import Link from "next/link";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/actions/notifications";
import { EmptyState } from "@/components/EmptyState";
import { SetupState } from "@/components/SetupState";
import { Button, buttonStyles } from "@/components/ui/Button";
import { requireVerifiedMember } from "@/lib/auth/viewer";
import { getNotifications } from "@/lib/data/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const messages = {
  new_request: "sent you a new learning request.",
  request_accepted: "accepted your learning request.",
  request_declined: "declined your learning request.",
  request_completed: "marked your session complete.",
  request_cancelled: "cancelled a learning request.",
  feedback_reminder: "Your session is complete. Private feedback is ready.",
  reschedule_proposed: "proposed a new schedule.",
  reschedule_accepted: "accepted your proposed schedule.",
  reschedule_declined: "declined your proposed schedule.",
  reschedule_cancelled: "withdrew a schedule proposal.",
  restriction_applied: "Your community access has been restricted.",
  restriction_revoked: "Your community access restriction was removed.",
  account_deletion_cancelled: "Your account deletion was cancelled.",
};

export default async function NotificationsPage() {
  const viewer = await requireVerifiedMember("/notifications");
  if (!viewer.configured) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase || !viewer.user) return <SetupState />;
  const notifications = await getNotifications(supabase, viewer.user.id);
  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="page-shell py-12 sm:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-coral-600">In-app updates</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-indigo-950 sm:text-5xl">Notifications</h1></div>
        {unread > 0 && <form action={markAllNotificationsReadAction}><Button type="submit" variant="secondary">Mark all as read</Button></form>}
      </div>
      {notifications.length ? (
        <ul className="mt-9 space-y-3">
          {notifications.map((item) => (
            <li className={`rounded-2xl border p-5 ${item.readAt ? "border-cream-200 bg-white" : "border-coral-200 bg-coral-50"}`} key={item.id}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-indigo-950">{item.actorName === "Spark" || item.eventType === "feedback_reminder" ? messages[item.eventType] : <><strong>{item.actorName}</strong> {messages[item.eventType]}</>}</p>
                  <time className="mt-1 block text-xs text-ink-400" dateTime={item.createdAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time>
                </div>
                <div className="flex gap-2">
                  {item.requestId && <Link className={buttonStyles("secondary")} href="/requests">View request</Link>}
                  {!item.readAt && <form action={markNotificationReadAction.bind(null, item.id)}><Button type="submit" variant="quiet">Mark read</Button></form>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : <div className="mt-9"><EmptyState title="You are all caught up" description="New requests and status changes will appear here." /></div>}
    </div>
  );
}
