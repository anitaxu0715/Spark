export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          cancelled_at: string | null
          id: string
          purge_after: string
          purged_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["deletion_request_status"]
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          id?: string
          purge_after?: string
          purged_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["deletion_request_status"]
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          id?: string
          purge_after?: string
          purged_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["deletion_request_status"]
          user_id?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          case_id: string | null
          created_at: string
          id: number
          institution_id: string | null
          metadata: Json
          target_id: string
          target_type: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          case_id?: string | null
          created_at?: string
          id?: never
          institution_id?: string | null
          metadata?: Json
          target_id: string
          target_type: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          case_id?: string | null
          created_at?: string
          id?: never
          institution_id?: string | null
          metadata?: Json
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_admin_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          university_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          university_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_admin_assignments_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          active: boolean
          code_hash: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          label: string
          max_uses: number
          university_id: string
          updated_at: string
          used_count: number
        }
        Insert: {
          active?: boolean
          code_hash: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string
          max_uses?: number
          university_id: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          active?: boolean
          code_hash?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string
          max_uses?: number
          university_id?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_redemptions: {
        Row: {
          email_domain: string
          id: string
          invite_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          email_domain: string
          id?: string
          invite_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          email_domain?: string
          id?: string
          invite_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_requests: {
        Row: {
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string
          format: Database["public"]["Enums"]["meeting_preference"]
          id: string
          message: string
          offered_skill_id: string | null
          preferred_at: string | null
          recipient_id: string
          requested_skill_id: string
          sender_id: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          format: Database["public"]["Enums"]["meeting_preference"]
          id?: string
          message: string
          offered_skill_id?: string | null
          preferred_at?: string | null
          recipient_id: string
          requested_skill_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          format?: Database["public"]["Enums"]["meeting_preference"]
          id?: string
          message?: string
          offered_skill_id?: string | null
          preferred_at?: string | null
          recipient_id?: string
          requested_skill_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_requests_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_requests_offered_skill_id_fkey"
            columns: ["offered_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_requests_requested_skill_id_fkey"
            columns: ["requested_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_restrictions: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          internal_reason: string
          restriction_type: Database["public"]["Enums"]["member_restriction_type"]
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string
          target_user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          internal_reason: string
          restriction_type: Database["public"]["Enums"]["member_restriction_type"]
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string
          target_user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          internal_reason?: string
          restriction_type?: Database["public"]["Enums"]["member_restriction_type"]
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_restrictions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          university_id: string
          user_id: string
          verified_at: string
          verified_email_domain: string
        }
        Insert: {
          created_at?: string
          university_id: string
          user_id: string
          verified_at: string
          verified_email_domain: string
        }
        Update: {
          created_at?: string
          university_id?: string
          user_id?: string
          verified_at?: string
          verified_email_domain?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_case_notes: {
        Row: {
          author_id: string | null
          body: string
          case_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          case_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          case_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_cases: {
        Row: {
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["moderation_case_priority"]
          report_id: string | null
          report_snapshot: Json
          reporter_id: string | null
          request_snapshot: Json | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          subject_id: string | null
          subject_snapshot: Json
          university_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["moderation_case_priority"]
          report_id?: string | null
          report_snapshot: Json
          reporter_id?: string | null
          request_snapshot?: Json | null
          status?: Database["public"]["Enums"]["moderation_case_status"]
          subject_id?: string | null
          subject_snapshot: Json
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["moderation_case_priority"]
          report_id?: string | null
          report_snapshot?: Json
          reporter_id?: string | null
          request_snapshot?: Json | null
          status?: Database["public"]["Enums"]["moderation_case_status"]
          subject_id?: string | null
          subject_snapshot?: Json
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_cases_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          feedback_reminders: boolean
          request_activity: boolean
          reschedule_activity: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          feedback_reminders?: boolean
          request_activity?: boolean
          reschedule_activity?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          feedback_reminders?: boolean
          request_activity?: boolean
          reschedule_activity?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["notification_type"]
          id: string
          owner_id: string
          read_at: string | null
          request_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["notification_type"]
          id?: string
          owner_id: string
          read_at?: string | null
          request_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["notification_type"]
          id?: string
          owner_id?: string
          read_at?: string | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "learning_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_locations: {
        Row: {
          general_location: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          general_location: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          general_location?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_locations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          created_at: string
          mode: Database["public"]["Enums"]["skill_mode"]
          profile_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          mode: Database["public"]["Enums"]["skill_mode"]
          profile_id: string
          skill_id: string
        }
        Update: {
          created_at?: string
          mode?: Database["public"]["Enums"]["skill_mode"]
          profile_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability_slots: Json
          availability_summary: string
          avatar_color: string
          beginner_friendly: boolean
          biography: string
          created_at: string
          discoverable: boolean
          display_name: string
          experience_tags: string[]
          id: string
          initials: string
          learning_style: string
          major: string
          meeting_preference: Database["public"]["Enums"]["meeting_preference"]
          onboarding_completed: boolean
          show_location: boolean
          slug: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          availability_slots?: Json
          availability_summary?: string
          avatar_color?: string
          beginner_friendly?: boolean
          biography?: string
          created_at?: string
          discoverable?: boolean
          display_name: string
          experience_tags?: string[]
          id: string
          initials: string
          learning_style?: string
          major?: string
          meeting_preference?: Database["public"]["Enums"]["meeting_preference"]
          onboarding_completed?: boolean
          show_location?: boolean
          slug: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          availability_slots?: Json
          availability_summary?: string
          avatar_color?: string
          beginner_friendly?: boolean
          biography?: string
          created_at?: string
          discoverable?: boolean
          display_name?: string
          experience_tags?: string[]
          id?: string
          initials?: string
          learning_style?: string
          major?: string
          meeting_preference?: Database["public"]["Enums"]["meeting_preference"]
          onboarding_completed?: boolean
          show_location?: boolean
          slug?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          profile_id: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string | null
          request_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          profile_id?: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string | null
          request_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          profile_id?: string | null
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string | null
          request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "learning_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_status_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          request_id: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          request_id: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          request_id?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_status_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_status_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "learning_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reschedule_proposals: {
        Row: {
          cancelled_at: string | null
          created_at: string
          id: string
          note: string | null
          proposed_at: string
          proposed_format: Database["public"]["Enums"]["meeting_preference"]
          proposer_id: string
          request_id: string
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["reschedule_status"]
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          proposed_at: string
          proposed_format: Database["public"]["Enums"]["meeting_preference"]
          proposer_id: string
          request_id: string
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["reschedule_status"]
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          proposed_at?: string
          proposed_format?: Database["public"]["Enums"]["meeting_preference"]
          proposer_id?: string
          request_id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["reschedule_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedule_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "learning_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_proposals_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_profiles: {
        Row: {
          created_at: string
          owner_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          owner_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          owner_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_feedback: {
        Row: {
          comfortable_and_respected: boolean
          created_at: string
          helpful: boolean
          id: string
          learn_together_again: boolean
          private_note: string | null
          request_id: string
          user_id: string
        }
        Insert: {
          comfortable_and_respected: boolean
          created_at?: string
          helpful: boolean
          id?: string
          learn_together_again: boolean
          private_note?: string | null
          request_id: string
          user_id: string
        }
        Update: {
          comfortable_and_respected?: boolean
          created_at?: string
          helpful?: boolean
          id?: string
          learn_together_again?: boolean
          private_note?: string | null
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "learning_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          active: boolean
          canonical_name: string | null
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          canonical_name?: string | null
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          canonical_name?: string | null
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      university_domains: {
        Row: {
          active: boolean
          created_at: string
          domain: string
          id: string
          is_development: boolean
          university_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          domain: string
          id?: string
          is_development?: boolean
          university_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          domain?: string
          id?: string
          is_development?: boolean
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_domains_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          role: Database["public"]["Enums"]["operational_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          role: Database["public"]["Enums"]["operational_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          role?: Database["public"]["Enums"]["operational_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_domain: {
        Args: {
          development_domain?: boolean
          new_domain: string
          target_university_id: string
        }
        Returns: string
      }
      admin_set_domain_active: {
        Args: { domain_active: boolean; target_domain_id: string }
        Returns: undefined
      }
      admin_set_university_active: {
        Args: { target_university_id: string; university_active: boolean }
        Returns: undefined
      }
      cancel_account_deletion: { Args: never; Returns: undefined }
      cancel_reschedule: {
        Args: { target_proposal_id: string }
        Returns: undefined
      }
      get_institution_member_counts: {
        Args: never
        Returns: {
          member_count: number
          university_id: string
        }[]
      }
      get_my_access_state: { Args: never; Returns: Json }
      moderation_add_note: {
        Args: { note_body: string; target_case_id: string }
        Returns: string
      }
      moderation_apply_restriction: {
        Args: {
          restriction_expires_at?: string
          restriction_reason: string
          selected_type: Database["public"]["Enums"]["member_restriction_type"]
          target_case_id: string
          target_user: string
        }
        Returns: string
      }
      moderation_revoke_restriction: {
        Args: { target_restriction_id: string }
        Returns: undefined
      }
      moderation_update_case: {
        Args: {
          next_priority: Database["public"]["Enums"]["moderation_case_priority"]
          next_status: Database["public"]["Enums"]["moderation_case_status"]
          target_case_id: string
          transition_reason?: string
        }
        Returns: undefined
      }
      platform_set_role: {
        Args: {
          role_enabled: boolean
          selected_role: Database["public"]["Enums"]["operational_role"]
          target_university_id?: string
          target_user_id: string
        }
        Returns: undefined
      }
      propose_reschedule: {
        Args: {
          new_format: Database["public"]["Enums"]["meeting_preference"]
          new_preferred_at: string
          proposal_note?: string
          target_request_id: string
        }
        Returns: string
      }
      request_account_deletion: { Args: never; Returns: string }
      respond_to_reschedule: {
        Args: {
          response: Database["public"]["Enums"]["reschedule_status"]
          target_proposal_id: string
        }
        Returns: undefined
      }
      save_my_profile: {
        Args: {
          custom_learning_skill_names: string[]
          custom_teaching_skill_names: string[]
          learning_skill_ids: string[]
          profile_availability: string
          profile_beginner_friendly: boolean
          profile_biography: string
          profile_discoverable: boolean
          profile_display_name: string
          profile_learning_style: string
          profile_location: string
          profile_major: string
          profile_meeting_preference: Database["public"]["Enums"]["meeting_preference"]
          profile_show_location: boolean
          teaching_skill_ids: string[]
        }
        Returns: undefined
      }
      validate_invite_code: {
        Args: { invite_code_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      audit_action:
        | "case_status_changed"
        | "case_priority_changed"
        | "case_note_added"
        | "restriction_created"
        | "restriction_revoked"
        | "institution_updated"
        | "domain_added"
        | "domain_status_changed"
        | "role_assigned"
        | "role_revoked"
        | "account_deletion_requested"
        | "account_deletion_cancelled"
        | "account_purged"
      deletion_request_status: "requested" | "cancelled" | "purged"
      meeting_preference: "online" | "in-person" | "either"
      member_restriction_type: "temporary_suspension" | "indefinite_suspension"
      moderation_case_priority: "standard" | "elevated" | "urgent"
      moderation_case_status:
        | "submitted"
        | "reviewing"
        | "resolved"
        | "dismissed"
        | "escalated"
      moderation_status: "submitted" | "reviewing" | "resolved" | "dismissed"
      notification_type:
        | "new_request"
        | "request_accepted"
        | "request_declined"
        | "request_completed"
        | "request_cancelled"
        | "feedback_reminder"
        | "reschedule_proposed"
        | "reschedule_accepted"
        | "reschedule_declined"
        | "reschedule_cancelled"
        | "restriction_applied"
        | "restriction_revoked"
        | "account_deletion_cancelled"
      operational_role: "moderator" | "institution_admin" | "platform_admin"
      report_reason:
        | "safety"
        | "harassment"
        | "spam"
        | "misrepresentation"
        | "other"
      request_status:
        | "pending"
        | "accepted"
        | "completed"
        | "declined"
        | "cancelled"
      reschedule_status: "pending" | "accepted" | "declined" | "cancelled"
      skill_mode: "teach" | "learn"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_action: [
        "case_status_changed",
        "case_priority_changed",
        "case_note_added",
        "restriction_created",
        "restriction_revoked",
        "institution_updated",
        "domain_added",
        "domain_status_changed",
        "role_assigned",
        "role_revoked",
        "account_deletion_requested",
        "account_deletion_cancelled",
        "account_purged",
      ],
      deletion_request_status: ["requested", "cancelled", "purged"],
      meeting_preference: ["online", "in-person", "either"],
      member_restriction_type: [
        "temporary_suspension",
        "indefinite_suspension",
      ],
      moderation_case_priority: ["standard", "elevated", "urgent"],
      moderation_case_status: [
        "submitted",
        "reviewing",
        "resolved",
        "dismissed",
        "escalated",
      ],
      moderation_status: ["submitted", "reviewing", "resolved", "dismissed"],
      notification_type: [
        "new_request",
        "request_accepted",
        "request_declined",
        "request_completed",
        "request_cancelled",
        "feedback_reminder",
        "reschedule_proposed",
        "reschedule_accepted",
        "reschedule_declined",
        "reschedule_cancelled",
        "restriction_applied",
        "restriction_revoked",
        "account_deletion_cancelled",
      ],
      operational_role: ["moderator", "institution_admin", "platform_admin"],
      report_reason: [
        "safety",
        "harassment",
        "spam",
        "misrepresentation",
        "other",
      ],
      request_status: [
        "pending",
        "accepted",
        "completed",
        "declined",
        "cancelled",
      ],
      reschedule_status: ["pending", "accepted", "declined", "cancelled"],
      skill_mode: ["teach", "learn"],
    },
  },
} as const

