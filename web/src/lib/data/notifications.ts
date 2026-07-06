import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { NotificationItem } from "@/types";

type Client = SupabaseClient<Database>;

export async function getNotifications(supabase: Client, userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, event_type, actor_id, request_id, read_at, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Notifications could not be loaded.");

  const actorIds = [...new Set((data ?? []).map((item) => item.actor_id).filter(Boolean) as string[])];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", actorIds)
    : { data: [] };
  const actorMap = new Map((actors ?? []).map((actor) => [actor.id, actor.display_name]));

  return (data ?? []).map((item) => ({
    id: item.id,
    eventType: item.event_type,
    actorName: item.actor_id ? actorMap.get(item.actor_id) ?? "A Spark member" : "Spark",
    requestId: item.request_id,
    readAt: item.read_at,
    createdAt: item.created_at,
  }));
}

export async function getUnreadNotificationCount(supabase: Client, userId: string) {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
