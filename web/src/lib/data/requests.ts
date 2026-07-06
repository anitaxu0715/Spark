import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LearningRequest } from "@/types";

type Client = SupabaseClient<Database>;

export async function getLearningRequests(supabase: Client, userId: string): Promise<LearningRequest[]> {
  const { data: rows, error } = await supabase
    .from("learning_requests")
    .select("id, sender_id, recipient_id, requested_skill_id, offered_skill_id, message, preferred_at, format, status, cancellation_reason, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Learning requests could not be loaded.");
  if (!rows?.length) return [];

  const profileIds = [...new Set(rows.flatMap((row) => [row.sender_id, row.recipient_id]))];
  const skillIds = [...new Set(rows.flatMap((row) => [row.requested_skill_id, row.offered_skill_id].filter(Boolean) as string[]))];
  const requestIds = rows.map((row) => row.id);

  const [{ data: profiles }, { data: skills }, { data: feedback }, { data: proposals }] = await Promise.all([
    supabase.from("profiles").select("id, slug, display_name, initials").in("id", profileIds),
    supabase.from("skills").select("id, name").in("id", skillIds),
    supabase.from("session_feedback").select("request_id").eq("user_id", userId).in("request_id", requestIds),
    supabase
      .from("reschedule_proposals")
      .select("id, request_id, proposer_id, proposed_at, proposed_format, note, status, created_at")
      .in("request_id", requestIds)
      .order("created_at", { ascending: false }),
  ]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const skillMap = new Map((skills ?? []).map((skill) => [skill.id, skill.name]));
  const feedbackSet = new Set((feedback ?? []).map((item) => item.request_id));

  return rows.map((row) => {
    const direction = row.sender_id === userId ? "sent" : "incoming";
    const personId = direction === "sent" ? row.recipient_id : row.sender_id;
    const person = profileMap.get(personId);
    return {
      id: row.id,
      direction,
      personId,
      personSlug: person?.slug,
      personName: person?.display_name ?? "Spark member",
      personInitials: person?.initials ?? "S",
      skill: skillMap.get(row.requested_skill_id) ?? "Skill exchange",
      skillId: row.requested_skill_id,
      message: row.message,
      preferredTime: row.preferred_at,
      format: row.format as "online" | "in-person",
      offeredSkill: row.offered_skill_id ? skillMap.get(row.offered_skill_id) : undefined,
      status: row.status,
      createdAt: row.created_at,
      cancellationReason: row.cancellation_reason ?? undefined,
      hasFeedback: feedbackSet.has(row.id),
      rescheduleProposals: (proposals ?? [])
        .filter((proposal) => proposal.request_id === row.id)
        .map((proposal) => ({
          id: proposal.id,
          proposerId: proposal.proposer_id,
          proposedAt: proposal.proposed_at,
          proposedFormat: proposal.proposed_format as "online" | "in-person",
          note: proposal.note,
          status: proposal.status,
          createdAt: proposal.created_at,
        })),
    };
  });
}
