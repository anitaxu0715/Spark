import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

describe.skipIf(!url || !key)("two-user Supabase workflow", () => {
  it("persists a request, notification, transition, completion, feedback, and block enforcement", async () => {
    const anita = createClient<Database>(url!, key!, { auth: { persistSession: false } });
    const maya = createClient<Database>(url!, key!, { auth: { persistSession: false } });

    const { data: anitaAuth, error: anitaAuthError } = await anita.auth.signInWithPassword({
      email: "anita@spark.test",
      password: "SparkLocal!2026",
    });
    const { data: mayaAuth, error: mayaAuthError } = await maya.auth.signInWithPassword({
      email: "maya@spark.test",
      password: "SparkLocal!2026",
    });
    expect(anitaAuthError).toBeNull();
    expect(mayaAuthError).toBeNull();

    const requestId = crypto.randomUUID();
    const { error: createError } = await anita.from("learning_requests").insert({
      id: requestId,
      sender_id: anitaAuth.user!.id,
      recipient_id: mayaAuth.user!.id,
      requested_skill_id: "20000000-0000-4000-8000-000000000003",
      message: "I would appreciate a focused review of the hierarchy and spacing in my resume.",
      preferred_at: new Date(Date.now() + 10 * 86_400_000).toISOString(),
      format: "online",
    });
    expect(createError).toBeNull();

    const { data: notification } = await maya
      .from("notifications")
      .select("event_type")
      .eq("request_id", requestId)
      .eq("event_type", "new_request")
      .single();
    expect(notification?.event_type).toBe("new_request");

    const { error: acceptError } = await maya.from("learning_requests").update({ status: "accepted" }).eq("id", requestId);
    expect(acceptError).toBeNull();

    const { data: accepted } = await anita.from("learning_requests").select("status").eq("id", requestId).single();
    expect(accepted?.status).toBe("accepted");

    const { error: completeError } = await anita.from("learning_requests").update({ status: "completed" }).eq("id", requestId);
    expect(completeError).toBeNull();

    const { error: feedbackError } = await anita.from("session_feedback").insert({
      request_id: requestId,
      user_id: anitaAuth.user!.id,
      helpful: true,
      comfortable_and_respected: true,
      learn_together_again: true,
      private_note: "A useful local integration test session.",
    });
    expect(feedbackError).toBeNull();

    const { error: blockError } = await anita.from("blocks").insert({
      blocker_id: anitaAuth.user!.id,
      blocked_id: mayaAuth.user!.id,
    });
    expect(blockError).toBeNull();

    const { error: blockedRequestError } = await anita.from("learning_requests").insert({
      sender_id: anitaAuth.user!.id,
      recipient_id: mayaAuth.user!.id,
      requested_skill_id: "20000000-0000-4000-8000-000000000001",
      message: "This request should be rejected because a block now exists between the members.",
      preferred_at: new Date(Date.now() + 12 * 86_400_000).toISOString(),
      format: "online",
    });
    expect(blockedRequestError).not.toBeNull();

    await anita.from("blocks").delete().eq("blocker_id", anitaAuth.user!.id).eq("blocked_id", mayaAuth.user!.id);
  });
});
