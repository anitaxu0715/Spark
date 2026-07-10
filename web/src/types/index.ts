export type LearningFormat = "online" | "in-person" | "either";
export type RequestStatus = "pending" | "accepted" | "completed" | "declined" | "cancelled";

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface Availability {
  summary: string;
  timeSlots: string[];
}

export interface PortfolioItem {
  title: string;
  description: string;
}

export interface Profile {
  id: string;
  slug: string;
  name: string;
  initials: string;
  university: string;
  major: string;
  location: string | null;
  bio: string;
  teachSkills: string[];
  learnSkills: string[];
  teachSkillOptions: Skill[];
  learnSkillOptions: Skill[];
  format: LearningFormat;
  beginnerFriendly: boolean;
  availability: Availability;
  style: string;
  tags: string[];
  color: string;
  portfolio: PortfolioItem[];
  discoverable: boolean;
  showLocation: boolean;
  onboardingCompleted: boolean;
  saved?: boolean;
}

export interface LearningRequest {
  id: string;
  direction: "incoming" | "sent";
  viewerId: string;
  personId: string;
  personSlug?: string;
  personName: string;
  personInitials: string;
  skill: string;
  skillId: string;
  message: string;
  preferredTime: string | null;
  format: Exclude<LearningFormat, "either">;
  offeredSkill?: string;
  status: RequestStatus;
  createdAt: string;
  cancellationReason?: string;
  hasFeedback: boolean;
  rescheduleProposals: RescheduleProposal[];
  messages: RequestMessage[];
}

export interface RequestMessage {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface RescheduleProposal {
  id: string;
  proposerId: string;
  proposedAt: string;
  proposedFormat: Exclude<LearningFormat, "either">;
  note: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  eventType:
    | "new_request"
    | "request_accepted"
    | "request_declined"
    | "request_completed"
    | "request_cancelled"
    | "request_message"
    | "feedback_reminder"
    | "reschedule_proposed"
    | "reschedule_accepted"
    | "reschedule_declined"
    | "reschedule_cancelled"
    | "restriction_applied"
    | "restriction_revoked"
    | "account_deletion_cancelled";
  actorName: string;
  requestId: string | null;
  readAt: string | null;
  createdAt: string;
}
