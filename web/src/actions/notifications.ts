"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(notificationId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("owner_id", user.id);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("owner_id", user.id).is("read_at", null);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
