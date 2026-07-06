import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";
import { SetupState } from "@/components/SetupState";
import { requireVerifiedMember } from "@/lib/auth/viewer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NotificationSettingsPage() {
  const viewer = await requireVerifiedMember("/settings/notifications");
  if (!viewer.configured || !viewer.user) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <SetupState />;
  const { data } = await supabase.from("notification_preferences")
    .select("request_activity, reschedule_activity, feedback_reminders")
    .eq("user_id", viewer.user.id).single();
  return (
    <main className="page-shell py-12 sm:py-16">
      <p className="eyebrow text-coral-600">Settings</p>
      <h1 className="mt-4 text-4xl font-bold text-indigo-950 sm:text-5xl">Notifications</h1>
      <p className="mt-4 max-w-2xl leading-7 text-ink-500">Choose which optional in-app updates Spark creates for you. Security and account-state notices are always delivered.</p>
      <NotificationPreferencesForm
        feedbackReminders={data?.feedback_reminders ?? true}
        requestActivity={data?.request_activity ?? true}
        rescheduleActivity={data?.reschedule_activity ?? true}
      />
    </main>
  );
}
