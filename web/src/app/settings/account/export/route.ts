import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Spark is not connected to Supabase." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });

  const [
    profile,
    membership,
    location,
    skills,
    requests,
    savedProfiles,
    notifications,
    blocks,
    reports,
    feedback,
    preferences,
    deletionRequests,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("memberships").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_locations").select("*").eq("profile_id", user.id).maybeSingle(),
    supabase.from("profile_skills").select("skill_id, mode, created_at, skills(name, category)").eq("profile_id", user.id),
    supabase.from("learning_requests").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
    supabase.from("saved_profiles").select("*").eq("owner_id", user.id),
    supabase.from("notifications").select("*").eq("owner_id", user.id),
    supabase.from("blocks").select("*").or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
    supabase.from("reports").select("id, reporter_id, profile_id, request_id, reason, details, created_at").eq("reporter_id", user.id),
    supabase.from("session_feedback").select("*").eq("user_id", user.id),
    supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("account_deletion_requests").select("*").eq("user_id", user.id),
  ]);

  const failed = [
    profile, membership, location, skills, requests, savedProfiles, notifications,
    blocks, reports, feedback, preferences, deletionRequests,
  ].find((result) => result.error);
  if (failed?.error) return Response.json({ error: "Your export could not be created." }, { status: 500 });

  const requestIds = (requests.data ?? []).map((request) => request.id);
  const requestMessages = requestIds.length
    ? await supabase.from("request_messages").select("*").in("request_id", requestIds)
    : { data: [], error: null };
  if (requestMessages.error) return Response.json({ error: "Your export could not be created." }, { status: 500 });

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile.data,
    membership: membership.data,
    location: location.data,
    skills: skills.data,
    learningRequests: requests.data,
    requestMessages: requestMessages.data,
    savedProfiles: savedProfiles.data,
    notifications: notifications.data,
    blocks: blocks.data,
    reports: reports.data,
    privateFeedback: feedback.data,
    notificationPreferences: preferences.data,
    deletionRequests: deletionRequests.data,
  };
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="spark-data-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
