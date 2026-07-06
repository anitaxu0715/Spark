alter type public.notification_type add value if not exists 'reschedule_proposed';
alter type public.notification_type add value if not exists 'reschedule_accepted';
alter type public.notification_type add value if not exists 'reschedule_declined';
alter type public.notification_type add value if not exists 'reschedule_cancelled';
alter type public.notification_type add value if not exists 'restriction_applied';
alter type public.notification_type add value if not exists 'restriction_revoked';
alter type public.notification_type add value if not exists 'account_deletion_cancelled';

create type public.operational_role as enum ('moderator', 'institution_admin', 'platform_admin');
create type public.moderation_case_status as enum ('submitted', 'reviewing', 'resolved', 'dismissed', 'escalated');
create type public.moderation_case_priority as enum ('standard', 'elevated', 'urgent');
create type public.member_restriction_type as enum ('temporary_suspension', 'indefinite_suspension');
create type public.reschedule_status as enum ('pending', 'accepted', 'declined', 'cancelled');
create type public.deletion_request_status as enum ('requested', 'cancelled', 'purged');
create type public.audit_action as enum (
  'case_status_changed',
  'case_priority_changed',
  'case_note_added',
  'restriction_created',
  'restriction_revoked',
  'institution_updated',
  'domain_added',
  'domain_status_changed',
  'role_assigned',
  'role_revoked',
  'account_deletion_requested',
  'account_deletion_cancelled',
  'account_purged'
);

alter table public.university_domains
  add column active boolean not null default true,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table public.reports alter column reporter_id drop not null;
alter table public.reports alter column profile_id drop not null;
alter table public.reports drop constraint reports_reporter_id_fkey;
alter table public.reports drop constraint reports_profile_id_fkey;
alter table public.reports drop constraint reports_request_id_fkey;
alter table public.reports
  add constraint reports_reporter_id_fkey foreign key (reporter_id) references public.profiles(id) on delete set null,
  add constraint reports_profile_id_fkey foreign key (profile_id) references public.profiles(id) on delete set null,
  add constraint reports_request_id_fkey foreign key (request_id) references public.learning_requests(id) on delete set null;

alter table public.learning_requests drop constraint learning_requests_sender_id_fkey;
alter table public.learning_requests drop constraint learning_requests_recipient_id_fkey;
alter table public.learning_requests
  add constraint learning_requests_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade,
  add constraint learning_requests_recipient_id_fkey foreign key (recipient_id) references public.profiles(id) on delete cascade;

alter table public.request_status_events drop constraint request_status_events_actor_id_fkey;
alter table public.request_status_events
  add constraint request_status_events_actor_id_fkey foreign key (actor_id) references public.profiles(id) on delete set null;

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.operational_role not null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.institution_admin_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, university_id)
);

create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid unique references public.reports(id) on delete set null,
  reporter_id uuid references auth.users(id) on delete set null,
  subject_id uuid references auth.users(id) on delete set null,
  university_id uuid references public.universities(id) on delete set null,
  status public.moderation_case_status not null default 'submitted',
  priority public.moderation_case_priority not null default 'standard',
  report_snapshot jsonb not null check (jsonb_typeof(report_snapshot) = 'object'),
  subject_snapshot jsonb not null check (jsonb_typeof(subject_snapshot) = 'object'),
  request_snapshot jsonb check (request_snapshot is null or jsonb_typeof(request_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(trim(body)) between 3 and 2000),
  created_at timestamptz not null default now()
);

create table public.member_restrictions (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.moderation_cases(id) on delete set null,
  restriction_type public.member_restriction_type not null,
  internal_reason text not null check (char_length(trim(internal_reason)) between 10 and 1000),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > starts_at),
  check (
    (restriction_type = 'temporary_suspension' and expires_at is not null)
    or (restriction_type = 'indefinite_suspension' and expires_at is null)
  ),
  check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  )
);

create unique index member_restrictions_one_active
  on public.member_restrictions (target_user_id)
  where revoked_at is null;

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action public.audit_action not null,
  target_type text not null check (char_length(target_type) between 2 and 60),
  target_id text not null check (char_length(target_id) between 1 and 160),
  case_id uuid references public.moderation_cases(id) on delete set null,
  institution_id uuid references public.universities(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.reschedule_proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.learning_requests(id) on delete cascade,
  proposer_id uuid not null references public.profiles(id) on delete cascade,
  proposed_at timestamptz not null,
  proposed_format public.meeting_preference not null check (proposed_format <> 'either'),
  note text check (char_length(note) <= 500),
  status public.reschedule_status not null default 'pending',
  responded_by uuid references public.profiles(id) on delete set null,
  responded_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (proposed_at > created_at),
  check (
    (status = 'pending' and responded_by is null and responded_at is null and cancelled_at is null)
    or (status in ('accepted', 'declined') and responded_by is not null and responded_at is not null and cancelled_at is null)
    or (status = 'cancelled' and responded_by is null and responded_at is null and cancelled_at is not null)
  )
);

create unique index reschedule_proposals_one_pending
  on public.reschedule_proposals (request_id)
  where status = 'pending';

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  request_activity boolean not null default true,
  reschedule_activity boolean not null default true,
  feedback_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status public.deletion_request_status not null default 'requested',
  requested_at timestamptz not null default now(),
  purge_after timestamptz not null default (now() + interval '7 days'),
  cancelled_at timestamptz,
  purged_at timestamptz,
  check (purge_after > requested_at),
  check (
    (status = 'requested' and cancelled_at is null and purged_at is null)
    or (status = 'cancelled' and cancelled_at is not null and purged_at is null)
    or (status = 'purged' and cancelled_at is null and purged_at is not null)
  )
);

create unique index account_deletion_one_pending
  on public.account_deletion_requests (user_id)
  where status = 'requested' and user_id is not null;

create index user_roles_role_idx on public.user_roles (role, user_id);
create index institution_assignments_university_idx on public.institution_admin_assignments (university_id, user_id);
create index moderation_cases_status_idx on public.moderation_cases (status, priority, created_at desc);
create index moderation_cases_subject_idx on public.moderation_cases (subject_id, created_at desc);
create index moderation_notes_case_idx on public.moderation_case_notes (case_id, created_at);
create index restrictions_target_idx on public.member_restrictions (target_user_id, revoked_at, expires_at);
create index audit_events_case_idx on public.audit_events (case_id, created_at);
create index audit_events_institution_idx on public.audit_events (institution_id, created_at);
create index reschedule_request_idx on public.reschedule_proposals (request_id, created_at desc);
create index deletion_requests_due_idx on public.account_deletion_requests (status, purge_after);

create trigger university_domains_set_updated_at
before update on public.university_domains
for each row execute function private.set_updated_at();

create trigger moderation_cases_set_updated_at
before update on public.moderation_cases
for each row execute function private.set_updated_at();

create trigger reschedule_proposals_set_updated_at
before update on public.reschedule_proposals
for each row execute function private.set_updated_at();

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function private.set_updated_at();

create or replace function private.has_role(
  candidate uuid,
  allowed public.operational_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select candidate is not null and exists (
    select 1
    from public.user_roles r
    where r.user_id = candidate
      and r.role = any(allowed)
  );
$$;

create or replace function private.can_admin_institution(candidate uuid, institution uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.has_role(candidate, array['platform_admin'::public.operational_role])
    or (
      private.has_role(candidate, array['institution_admin'::public.operational_role])
      and exists (
        select 1
        from public.institution_admin_assignments a
        where a.user_id = candidate
          and a.university_id = institution
      )
    );
$$;

create or replace function private.has_active_restriction(candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member_restrictions r
    where r.target_user_id = candidate
      and r.revoked_at is null
      and (r.expires_at is null or r.expires_at > now())
  );
$$;

create or replace function private.is_deletion_pending(candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.account_deletion_requests d
    where d.user_id = candidate
      and d.status = 'requested'
  );
$$;

create or replace function private.is_active_member(candidate uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_verified(candidate)
    and not private.has_active_restriction(candidate)
    and not private.is_deletion_pending(candidate);
$$;

create or replace function private.can_view_profile(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_profile = auth.uid()
    or (
      private.is_active_member(auth.uid())
      and private.is_active_member(target_profile)
      and not private.are_blocked(auth.uid(), target_profile)
      and exists (
        select 1
        from public.profiles p
        where p.id = target_profile
          and p.discoverable
          and p.onboarding_completed
      )
    );
$$;

create or replace function private.notification_enabled(
  candidate uuid,
  category text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case category
    when 'request_activity' then coalesce((
      select p.request_activity from public.notification_preferences p where p.user_id = candidate
    ), true)
    when 'reschedule_activity' then coalesce((
      select p.reschedule_activity from public.notification_preferences p where p.user_id = candidate
    ), true)
    when 'feedback_reminders' then coalesce((
      select p.feedback_reminders from public.notification_preferences p where p.user_id = candidate
    ), true)
    else true
  end;
$$;

create or replace function private.log_audit(
  audit_actor uuid,
  audit_action_value public.audit_action,
  audit_target_type text,
  audit_target_id text,
  audit_case_id uuid default null,
  audit_institution_id uuid default null,
  audit_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_events (
    actor_id,
    action,
    target_type,
    target_id,
    case_id,
    institution_id,
    metadata
  ) values (
    audit_actor,
    audit_action_value,
    audit_target_type,
    audit_target_id,
    audit_case_id,
    audit_institution_id,
    coalesce(audit_metadata, '{}'::jsonb)
  );
$$;

create or replace function private.before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_domain text := lower(split_part(event->'user'->>'email', '@', 2));
begin
  if exists (
    select 1
    from public.university_domains d
    join public.universities u on u.id = d.university_id
    where d.domain = candidate_domain
      and d.active
      and u.active
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code', 403,
      'message', 'Use an eligible academic email address to join Spark.'
    )
  );
end;
$$;

create or replace function private.sync_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_domain text := lower(split_part(new.email, '@', 2));
  matched_university uuid;
  base_slug text;
  default_name text;
begin
  default_name := coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1));
  base_slug := regexp_replace(lower(default_name), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug) || '-' || left(new.id::text, 8);

  insert into public.profiles (id, slug, display_name, initials)
  values (
    new.id,
    base_slug,
    default_name,
    upper(left(regexp_replace(default_name, '[^A-Za-z0-9]', '', 'g'), 2))
  )
  on conflict (id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  if new.email_confirmed_at is not null then
    select d.university_id into matched_university
    from public.university_domains d
    join public.universities u on u.id = d.university_id and u.active
    where d.domain = candidate_domain
      and d.active;

    if matched_university is not null then
      insert into public.memberships (user_id, university_id, verified_email_domain, verified_at)
      values (new.id, matched_university, candidate_domain, coalesce(new.email_confirmed_at, now()))
      on conflict (user_id) do update
        set university_id = excluded.university_id,
            verified_email_domain = excluded.verified_email_domain,
            verified_at = excluded.verified_at;

      update public.profiles
      set university_id = matched_university
      where id = new.id;
    end if;
  end if;

  return new;
end;
$$;

insert into public.notification_preferences (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

create or replace function private.open_moderation_case()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subject_university uuid;
  subject_snapshot_value jsonb;
  request_snapshot_value jsonb;
begin
  select
    p.university_id,
    jsonb_build_object(
      'display_name', p.display_name,
      'slug', p.slug,
      'major', p.major,
      'biography', p.biography,
      'university', u.name
    )
  into subject_university, subject_snapshot_value
  from public.profiles p
  left join public.universities u on u.id = p.university_id
  where p.id = new.profile_id;

  if new.request_id is not null then
    select jsonb_build_object(
      'request_id', r.id,
      'sender_id', r.sender_id,
      'recipient_id', r.recipient_id,
      'message', r.message,
      'preferred_at', r.preferred_at,
      'format', r.format,
      'status', r.status,
      'skill', s.name
    )
    into request_snapshot_value
    from public.learning_requests r
    join public.skills s on s.id = r.requested_skill_id
    where r.id = new.request_id;
  end if;

  insert into public.moderation_cases (
    report_id,
    reporter_id,
    subject_id,
    university_id,
    report_snapshot,
    subject_snapshot,
    request_snapshot
  ) values (
    new.id,
    new.reporter_id,
    new.profile_id,
    subject_university,
    jsonb_build_object(
      'reason', new.reason,
      'details', new.details,
      'created_at', new.created_at
    ),
    coalesce(subject_snapshot_value, '{"display_name":"Unavailable member"}'::jsonb),
    request_snapshot_value
  );
  return new;
end;
$$;

create trigger reports_open_moderation_case
after insert on public.reports
for each row execute function private.open_moderation_case();

create or replace function private.validate_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    if not private.is_active_member(auth.uid()) or new.reporter_id <> auth.uid() then
      raise exception 'Reports must be submitted by an active signed-in member.' using errcode = '42501';
    end if;
    if new.moderation_status <> 'submitted' then
      raise exception 'Members cannot set report moderation state.' using errcode = '42501';
    end if;
  end if;
  if new.reporter_id is null or new.profile_id is null then
    raise exception 'A report requires a reporter and subject.' using errcode = '23514';
  end if;
  if new.request_id is not null and not exists (
    select 1 from public.learning_requests r
    where r.id = new.request_id
      and new.reporter_id in (r.sender_id, r.recipient_id)
      and new.profile_id in (r.sender_id, r.recipient_id)
  ) then
    raise exception 'The report does not reference an eligible request.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.validate_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and (
    not private.is_active_member(auth.uid())
    or new.user_id <> auth.uid()
  ) then
    raise exception 'Feedback requires an active signed-in member.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.learning_requests r
    where r.id = new.request_id
      and r.status = 'completed'
      and new.user_id in (r.sender_id, r.recipient_id)
  ) then
    raise exception 'Feedback is limited to participants in completed sessions.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.validate_request_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  other_participant uuid;
  applying_reschedule boolean := current_setting('spark.reschedule_apply', true) = 'on';
begin
  if tg_op = 'INSERT' then
    if actor is not null then
      if new.sender_id <> actor or new.status <> 'pending' then
        raise exception 'New requests must be pending and owned by the sender.' using errcode = '42501';
      end if;
      if not private.is_active_member(actor) or not private.can_view_profile(new.recipient_id) then
        raise exception 'The recipient is not available for learning requests.' using errcode = '42501';
      end if;
      if private.are_blocked(new.sender_id, new.recipient_id) then
        raise exception 'Learning requests are disabled between these members.' using errcode = '42501';
      end if;
      if not exists (
        select 1 from public.profile_skills ps
        where ps.profile_id = new.recipient_id
          and ps.skill_id = new.requested_skill_id
          and ps.mode = 'teach'
      ) then
        raise exception 'The recipient does not offer the requested skill.' using errcode = '23514';
      end if;
      if new.offered_skill_id is not null and not exists (
        select 1 from public.profile_skills ps
        where ps.profile_id = actor
          and ps.skill_id = new.offered_skill_id
          and ps.mode = 'teach'
      ) then
        raise exception 'The offered skill is not listed on your profile.' using errcode = '23514';
      end if;
    end if;
    return new;
  end if;

  if actor is not null then
    other_participant := case when actor = old.sender_id then old.recipient_id else old.sender_id end;

    if applying_reschedule then
      if actor not in (old.sender_id, old.recipient_id)
        or old.status <> 'accepted'
        or new.status <> 'accepted'
        or new.sender_id is distinct from old.sender_id
        or new.recipient_id is distinct from old.recipient_id
        or new.requested_skill_id is distinct from old.requested_skill_id
        or new.offered_skill_id is distinct from old.offered_skill_id
        or new.message is distinct from old.message
        or new.created_at is distinct from old.created_at
        or new.cancelled_by is distinct from old.cancelled_by
        or new.cancellation_reason is distinct from old.cancellation_reason then
        raise exception 'The reschedule update is invalid.' using errcode = '42501';
      end if;
      new.updated_at := now();
      return new;
    end if;

    if private.is_deletion_pending(actor)
      and actor in (old.sender_id, old.recipient_id)
      and old.status in ('pending', 'accepted')
      and new.status = 'cancelled' then
      new.cancelled_by := actor;
      new.updated_at := now();
      return new;
    end if;

    if not private.is_active_member(actor) or not private.is_active_member(other_participant) then
      raise exception 'Request actions require active members.' using errcode = '42501';
    end if;
    if private.are_blocked(old.sender_id, old.recipient_id) then
      raise exception 'Actions are disabled between blocked members.' using errcode = '42501';
    end if;
    if new.sender_id is distinct from old.sender_id
      or new.recipient_id is distinct from old.recipient_id
      or new.requested_skill_id is distinct from old.requested_skill_id
      or new.offered_skill_id is distinct from old.offered_skill_id
      or new.message is distinct from old.message
      or new.preferred_at is distinct from old.preferred_at
      or new.format is distinct from old.format
      or new.created_at is distinct from old.created_at then
      raise exception 'Request details cannot be changed after submission.' using errcode = '42501';
    end if;

    if old.status = 'pending' and new.status in ('accepted', 'declined') and actor = old.recipient_id then
      null;
    elsif old.status = 'pending' and new.status = 'cancelled' and actor = old.sender_id then
      new.cancelled_by := actor;
    elsif old.status = 'accepted' and new.status in ('completed', 'cancelled') and actor in (old.sender_id, old.recipient_id) then
      if new.status = 'cancelled' then new.cancelled_by := actor; end if;
    else
      raise exception 'This request status transition is not allowed.' using errcode = '42501';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.record_request_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  other_user uuid;
  mapped_event public.notification_type;
  always_notify boolean := actor is not null and private.is_deletion_pending(actor);
begin
  if tg_op = 'INSERT' then
    insert into public.request_status_events (request_id, status, actor_id)
    values (new.id, new.status, coalesce(actor, new.sender_id));

    if private.notification_enabled(new.recipient_id, 'request_activity') then
      insert into public.notifications (owner_id, event_type, actor_id, request_id)
      values (new.recipient_id, 'new_request', new.sender_id, new.id);
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.request_status_events (request_id, status, actor_id)
    values (new.id, new.status, actor);

    other_user := case when actor = new.sender_id then new.recipient_id else new.sender_id end;
    mapped_event := case new.status
      when 'accepted' then 'request_accepted'
      when 'declined' then 'request_declined'
      when 'completed' then 'request_completed'
      when 'cancelled' then 'request_cancelled'
      else null
    end;

    if mapped_event is not null
      and other_user is not null
      and (always_notify or private.notification_enabled(other_user, 'request_activity')) then
      insert into public.notifications (owner_id, event_type, actor_id, request_id)
      values (other_user, mapped_event, actor, new.id);
    end if;

    if new.status = 'completed' then
      if private.notification_enabled(new.sender_id, 'feedback_reminders') then
        insert into public.notifications (owner_id, event_type, actor_id, request_id)
        values (new.sender_id, 'feedback_reminder', new.recipient_id, new.id);
      end if;
      if private.notification_enabled(new.recipient_id, 'feedback_reminders') then
        insert into public.notifications (owner_id, event_type, actor_id, request_id)
        values (new.recipient_id, 'feedback_reminder', new.sender_id, new.id);
      end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.save_my_profile(
  profile_display_name text,
  profile_major text,
  profile_biography text,
  profile_location text,
  profile_availability text,
  profile_meeting_preference public.meeting_preference,
  profile_beginner_friendly boolean,
  profile_learning_style text,
  profile_discoverable boolean,
  profile_show_location boolean,
  teaching_skill_ids uuid[],
  learning_skill_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not private.is_active_member(current_user_id) then
    raise exception 'An active verified account is required to save a profile.' using errcode = '42501';
  end if;
  if coalesce(array_length(teaching_skill_ids, 1), 0) = 0
    or coalesce(array_length(learning_skill_ids, 1), 0) = 0 then
    raise exception 'Choose at least one teaching skill and one learning skill.' using errcode = '23514';
  end if;
  if exists (
    select 1 from unnest(teaching_skill_ids || learning_skill_ids) candidate
    where not exists (select 1 from public.skills s where s.id = candidate and s.active)
  ) then
    raise exception 'One or more selected skills are unavailable.' using errcode = '23514';
  end if;

  insert into public.profile_locations (profile_id, general_location)
  values (current_user_id, trim(profile_location))
  on conflict (profile_id) do update
    set general_location = excluded.general_location;

  delete from public.profile_skills where profile_id = current_user_id;

  insert into public.profile_skills (profile_id, skill_id, mode)
  select current_user_id, skill_id, 'teach'::public.skill_mode
  from unnest(teaching_skill_ids) skill_id;

  insert into public.profile_skills (profile_id, skill_id, mode)
  select current_user_id, skill_id, 'learn'::public.skill_mode
  from unnest(learning_skill_ids) skill_id;

  update public.profiles
  set display_name = trim(profile_display_name),
      initials = upper(left(regexp_replace(profile_display_name, '[^A-Za-z0-9]', '', 'g'), 2)),
      major = trim(profile_major),
      biography = trim(profile_biography),
      availability_summary = trim(profile_availability),
      availability_slots = jsonb_build_array(trim(profile_availability)),
      meeting_preference = profile_meeting_preference,
      beginner_friendly = profile_beginner_friendly,
      learning_style = trim(profile_learning_style),
      discoverable = profile_discoverable,
      show_location = profile_show_location,
      onboarding_completed = true
  where id = current_user_id;

  if not found then
    raise exception 'Your profile could not be found.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.get_my_access_state()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'restricted', private.has_active_restriction(auth.uid()),
    'restriction', (
      select jsonb_build_object(
        'type', r.restriction_type,
        'starts_at', r.starts_at,
        'expires_at', r.expires_at
      )
      from public.member_restrictions r
      where r.target_user_id = auth.uid()
        and r.revoked_at is null
        and (r.expires_at is null or r.expires_at > now())
      order by r.created_at desc
      limit 1
    ),
    'deletion_pending', private.is_deletion_pending(auth.uid()),
    'deletion', (
      select jsonb_build_object(
        'id', d.id,
        'requested_at', d.requested_at,
        'purge_after', d.purge_after
      )
      from public.account_deletion_requests d
      where d.user_id = auth.uid()
        and d.status = 'requested'
      limit 1
    )
  )
  where auth.uid() is not null;
$$;

create or replace function public.moderation_update_case(
  target_case_id uuid,
  next_status public.moderation_case_status,
  next_priority public.moderation_case_priority,
  transition_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_case public.moderation_cases%rowtype;
begin
  if not private.has_role(actor, array['moderator'::public.operational_role, 'platform_admin'::public.operational_role]) then
    raise exception 'Moderator access is required.' using errcode = '42501';
  end if;

  select * into current_case
  from public.moderation_cases
  where id = target_case_id
  for update;
  if not found then raise exception 'Moderation case not found.' using errcode = 'P0002'; end if;

  if next_status is distinct from current_case.status then
    if not (
      (current_case.status = 'submitted' and next_status in ('reviewing', 'dismissed'))
      or (current_case.status = 'reviewing' and next_status in ('resolved', 'dismissed', 'escalated'))
      or (current_case.status = 'escalated' and next_status = 'resolved')
    ) then
      raise exception 'This moderation transition is not allowed.' using errcode = '23514';
    end if;
    if next_status = 'escalated' and char_length(trim(coalesce(transition_reason, ''))) < 10 then
      raise exception 'Escalation requires an internal reason.' using errcode = '23514';
    end if;
  end if;

  update public.moderation_cases
  set status = next_status,
      priority = next_priority
  where id = target_case_id;

  if next_status is distinct from current_case.status then
    perform private.log_audit(
      actor,
      'case_status_changed',
      'moderation_case',
      target_case_id::text,
      target_case_id,
      current_case.university_id,
      jsonb_build_object('from', current_case.status, 'to', next_status, 'reason', transition_reason)
    );
  end if;
  if next_priority is distinct from current_case.priority then
    perform private.log_audit(
      actor,
      'case_priority_changed',
      'moderation_case',
      target_case_id::text,
      target_case_id,
      current_case.university_id,
      jsonb_build_object('from', current_case.priority, 'to', next_priority)
    );
  end if;

  if current_case.report_id is not null then
    update public.reports
    set moderation_status = case next_status
      when 'submitted' then 'submitted'::public.moderation_status
      when 'reviewing' then 'reviewing'::public.moderation_status
      when 'escalated' then 'reviewing'::public.moderation_status
      when 'resolved' then 'resolved'::public.moderation_status
      when 'dismissed' then 'dismissed'::public.moderation_status
    end
    where id = current_case.report_id;
  end if;
end;
$$;

create or replace function public.moderation_add_note(target_case_id uuid, note_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  note_id uuid;
  institution uuid;
begin
  if not private.has_role(actor, array['moderator'::public.operational_role, 'platform_admin'::public.operational_role]) then
    raise exception 'Moderator access is required.' using errcode = '42501';
  end if;
  if char_length(trim(note_body)) not between 3 and 2000 then
    raise exception 'Internal notes must be between 3 and 2,000 characters.' using errcode = '23514';
  end if;
  select university_id into institution from public.moderation_cases where id = target_case_id;
  if not found then raise exception 'Moderation case not found.' using errcode = 'P0002'; end if;

  insert into public.moderation_case_notes (case_id, author_id, body)
  values (target_case_id, actor, trim(note_body))
  returning id into note_id;

  perform private.log_audit(
    actor,
    'case_note_added',
    'moderation_case',
    target_case_id::text,
    target_case_id,
    institution,
    jsonb_build_object('note_id', note_id)
  );
  return note_id;
end;
$$;

create or replace function public.moderation_apply_restriction(
  target_case_id uuid,
  target_user uuid,
  selected_type public.member_restriction_type,
  restriction_reason text,
  restriction_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  restriction_id uuid;
  case_row public.moderation_cases%rowtype;
begin
  if not private.has_role(actor, array['moderator'::public.operational_role, 'platform_admin'::public.operational_role]) then
    raise exception 'Moderator access is required.' using errcode = '42501';
  end if;
  select * into case_row from public.moderation_cases where id = target_case_id;
  if not found or case_row.subject_id is distinct from target_user then
    raise exception 'The restriction target does not match this case.' using errcode = '23514';
  end if;
  if char_length(trim(restriction_reason)) < 10 then
    raise exception 'A restriction requires an internal reason.' using errcode = '23514';
  end if;
  if selected_type = 'temporary_suspension' and (
    restriction_expires_at is null or restriction_expires_at <= now()
  ) then
    raise exception 'A temporary suspension requires a future expiration.' using errcode = '23514';
  end if;
  if selected_type = 'indefinite_suspension' then restriction_expires_at := null; end if;

  insert into public.member_restrictions (
    target_user_id,
    case_id,
    restriction_type,
    internal_reason,
    expires_at,
    created_by
  ) values (
    target_user,
    target_case_id,
    selected_type,
    trim(restriction_reason),
    restriction_expires_at,
    actor
  )
  returning id into restriction_id;

  update public.profiles set discoverable = false where id = target_user;
  insert into public.notifications (owner_id, event_type)
  values (target_user, 'restriction_applied');

  perform private.log_audit(
    actor,
    'restriction_created',
    'member',
    target_user::text,
    target_case_id,
    case_row.university_id,
    jsonb_build_object('restriction_id', restriction_id, 'type', selected_type, 'expires_at', restriction_expires_at)
  );
  return restriction_id;
end;
$$;

create or replace function public.moderation_revoke_restriction(target_restriction_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  restriction_row public.member_restrictions%rowtype;
  institution uuid;
begin
  if not private.has_role(actor, array['moderator'::public.operational_role, 'platform_admin'::public.operational_role]) then
    raise exception 'Moderator access is required.' using errcode = '42501';
  end if;
  select * into restriction_row
  from public.member_restrictions
  where id = target_restriction_id and revoked_at is null
  for update;
  if not found then raise exception 'Active restriction not found.' using errcode = 'P0002'; end if;

  update public.member_restrictions
  set revoked_at = now(), revoked_by = actor
  where id = target_restriction_id;

  select university_id into institution
  from public.moderation_cases
  where id = restriction_row.case_id;

  insert into public.notifications (owner_id, event_type)
  values (restriction_row.target_user_id, 'restriction_revoked');

  perform private.log_audit(
    actor,
    'restriction_revoked',
    'member',
    restriction_row.target_user_id::text,
    restriction_row.case_id,
    institution,
    jsonb_build_object('restriction_id', target_restriction_id)
  );
end;
$$;

create or replace function public.propose_reschedule(
  target_request_id uuid,
  new_preferred_at timestamptz,
  new_format public.meeting_preference,
  proposal_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_row public.learning_requests%rowtype;
  proposal_id uuid;
  other_user uuid;
begin
  if not private.is_active_member(actor) then
    raise exception 'An active account is required.' using errcode = '42501';
  end if;
  select * into request_row from public.learning_requests where id = target_request_id;
  if not found or actor not in (request_row.sender_id, request_row.recipient_id) then
    raise exception 'Request not found.' using errcode = 'P0002';
  end if;
  other_user := case when actor = request_row.sender_id then request_row.recipient_id else request_row.sender_id end;
  if request_row.status <> 'accepted'
    or not private.is_active_member(other_user)
    or private.are_blocked(actor, other_user) then
    raise exception 'This request cannot be rescheduled.' using errcode = '42501';
  end if;
  if new_preferred_at <= now() or new_format = 'either' then
    raise exception 'Choose a future time and a specific meeting format.' using errcode = '23514';
  end if;

  insert into public.reschedule_proposals (
    request_id, proposer_id, proposed_at, proposed_format, note
  ) values (
    target_request_id, actor, new_preferred_at, new_format, nullif(trim(proposal_note), '')
  )
  returning id into proposal_id;

  if private.notification_enabled(other_user, 'reschedule_activity') then
    insert into public.notifications (owner_id, event_type, actor_id, request_id)
    values (other_user, 'reschedule_proposed', actor, target_request_id);
  end if;
  return proposal_id;
end;
$$;

create or replace function public.respond_to_reschedule(
  target_proposal_id uuid,
  response public.reschedule_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  proposal_row public.reschedule_proposals%rowtype;
  request_row public.learning_requests%rowtype;
begin
  if response not in ('accepted', 'declined') then
    raise exception 'Choose an accepted or declined response.' using errcode = '23514';
  end if;
  if not private.is_active_member(actor) then
    raise exception 'An active account is required.' using errcode = '42501';
  end if;

  select * into proposal_row
  from public.reschedule_proposals
  where id = target_proposal_id and status = 'pending'
  for update;
  if not found then raise exception 'Pending proposal not found.' using errcode = 'P0002'; end if;

  select * into request_row from public.learning_requests where id = proposal_row.request_id;
  if actor not in (request_row.sender_id, request_row.recipient_id)
    or actor = proposal_row.proposer_id
    or request_row.status <> 'accepted'
    or private.are_blocked(request_row.sender_id, request_row.recipient_id) then
    raise exception 'You cannot respond to this proposal.' using errcode = '42501';
  end if;

  update public.reschedule_proposals
  set status = response, responded_by = actor, responded_at = now()
  where id = target_proposal_id;

  if response = 'accepted' then
    perform set_config('spark.reschedule_apply', 'on', true);
    update public.learning_requests
    set preferred_at = proposal_row.proposed_at,
        format = proposal_row.proposed_format
    where id = proposal_row.request_id;
  end if;

  if private.notification_enabled(proposal_row.proposer_id, 'reschedule_activity') then
    insert into public.notifications (owner_id, event_type, actor_id, request_id)
    values (
      proposal_row.proposer_id,
      case response
        when 'accepted' then 'reschedule_accepted'::public.notification_type
        else 'reschedule_declined'::public.notification_type
      end,
      actor,
      proposal_row.request_id
    );
  end if;
end;
$$;

create or replace function public.cancel_reschedule(target_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  proposal_row public.reschedule_proposals%rowtype;
  request_row public.learning_requests%rowtype;
  other_user uuid;
begin
  if not private.is_active_member(actor) then
    raise exception 'An active account is required.' using errcode = '42501';
  end if;
  select * into proposal_row
  from public.reschedule_proposals
  where id = target_proposal_id and status = 'pending'
  for update;
  if not found or proposal_row.proposer_id <> actor then
    raise exception 'Only the proposer can cancel this proposal.' using errcode = '42501';
  end if;
  select * into request_row from public.learning_requests where id = proposal_row.request_id;
  other_user := case when actor = request_row.sender_id then request_row.recipient_id else request_row.sender_id end;

  update public.reschedule_proposals
  set status = 'cancelled', cancelled_at = now()
  where id = target_proposal_id;

  if private.notification_enabled(other_user, 'reschedule_activity') then
    insert into public.notifications (owner_id, event_type, actor_id, request_id)
    values (other_user, 'reschedule_cancelled', actor, proposal_row.request_id);
  end if;
end;
$$;

create or replace function public.request_account_deletion()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_id uuid;
  last_sign_in timestamptz;
begin
  if actor is null or not private.is_verified(actor) then
    raise exception 'A verified account is required.' using errcode = '42501';
  end if;
  select last_sign_in_at into last_sign_in from auth.users where id = actor;
  if last_sign_in is null or last_sign_in < now() - interval '10 minutes' then
    raise exception 'Recent password verification is required.' using errcode = '42501';
  end if;
  if private.is_deletion_pending(actor) then
    select id into request_id
    from public.account_deletion_requests
    where user_id = actor and status = 'requested';
    return request_id;
  end if;

  insert into public.account_deletion_requests (user_id)
  values (actor)
  returning id into request_id;

  update public.profiles set discoverable = false where id = actor;
  update public.learning_requests
  set status = 'cancelled', cancellation_reason = 'Account deletion requested'
  where actor in (sender_id, recipient_id)
    and status in ('pending', 'accepted');

  perform private.log_audit(
    actor,
    'account_deletion_requested',
    'account_deletion_request',
    request_id::text,
    null,
    null,
    jsonb_build_object('purge_after', now() + interval '7 days')
  );
  return request_id;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  deletion_id uuid;
begin
  update public.account_deletion_requests
  set status = 'cancelled', cancelled_at = now()
  where user_id = actor and status = 'requested'
  returning id into deletion_id;
  if deletion_id is null then
    raise exception 'Pending deletion request not found.' using errcode = 'P0002';
  end if;

  insert into public.notifications (owner_id, event_type)
  values (actor, 'account_deletion_cancelled');
  perform private.log_audit(
    actor,
    'account_deletion_cancelled',
    'account_deletion_request',
    deletion_id::text
  );
end;
$$;

create or replace function private.purge_due_accounts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deletion_row public.account_deletion_requests%rowtype;
  purged_count integer := 0;
begin
  for deletion_row in
    select * from public.account_deletion_requests
    where status = 'requested' and purge_after <= now() and user_id is not null
    for update skip locked
  loop
    update public.reports
    set request_id = null
    where request_id in (
      select r.id from public.learning_requests r
      where deletion_row.user_id in (r.sender_id, r.recipient_id)
    );

    update public.moderation_cases
    set reporter_id = case when reporter_id = deletion_row.user_id then null else reporter_id end,
        subject_id = case when subject_id = deletion_row.user_id then null else subject_id end,
        subject_snapshot = case
          when subject_id = deletion_row.user_id
          then jsonb_build_object('display_name', 'Deleted member')
          else subject_snapshot
        end,
        report_snapshot = report_snapshot - 'reporter_id' - 'profile_id',
        request_snapshot = case
          when request_snapshot is null then null
          else request_snapshot - 'sender_id' - 'recipient_id'
        end
    where reporter_id = deletion_row.user_id or subject_id = deletion_row.user_id;

    update public.reports
    set reporter_id = case when reporter_id = deletion_row.user_id then null else reporter_id end,
        profile_id = case when profile_id = deletion_row.user_id then null else profile_id end
    where reporter_id = deletion_row.user_id or profile_id = deletion_row.user_id;

    update public.audit_events
    set target_id = 'deleted:' || deletion_row.id::text
    where target_type = 'member' and target_id = deletion_row.user_id::text;

    update public.account_deletion_requests
    set status = 'purged',
        purged_at = now(),
        user_id = null
    where id = deletion_row.id;

    delete from auth.users where id = deletion_row.user_id;

    perform private.log_audit(
      null,
      'account_purged',
      'account_deletion_request',
      deletion_row.id::text
    );
    purged_count := purged_count + 1;
  end loop;
  return purged_count;
end;
$$;

create or replace function public.admin_add_domain(
  target_university_id uuid,
  new_domain text,
  development_domain boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  normalized_domain text := lower(trim(new_domain));
  domain_id uuid;
begin
  if not private.can_admin_institution(actor, target_university_id) then
    raise exception 'Institution administrator access is required.' using errcode = '42501';
  end if;
  if development_domain and not private.has_role(actor, array['platform_admin'::public.operational_role]) then
    raise exception 'Only platform administrators can add development domains.' using errcode = '42501';
  end if;
  if normalized_domain !~ '^[a-z0-9.-]+\.[a-z]{2,}$' then
    raise exception 'Enter a valid email domain.' using errcode = '23514';
  end if;

  insert into public.university_domains (university_id, domain, is_development)
  values (target_university_id, normalized_domain, development_domain)
  returning id into domain_id;

  perform private.log_audit(
    actor,
    'domain_added',
    'university_domain',
    domain_id::text,
    null,
    target_university_id,
    jsonb_build_object('domain', normalized_domain, 'development', development_domain)
  );
  return domain_id;
end;
$$;

create or replace function public.admin_set_domain_active(target_domain_id uuid, domain_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  domain_row public.university_domains%rowtype;
begin
  select * into domain_row from public.university_domains where id = target_domain_id;
  if not found or not private.can_admin_institution(actor, domain_row.university_id) then
    raise exception 'Institution administrator access is required.' using errcode = '42501';
  end if;
  if domain_row.is_development and not private.has_role(actor, array['platform_admin'::public.operational_role]) then
    raise exception 'Only platform administrators can modify development domains.' using errcode = '42501';
  end if;

  update public.university_domains set active = domain_active where id = target_domain_id;
  perform private.log_audit(
    actor,
    'domain_status_changed',
    'university_domain',
    target_domain_id::text,
    null,
    domain_row.university_id,
    jsonb_build_object('active', domain_active)
  );
end;
$$;

create or replace function public.admin_set_university_active(target_university_id uuid, university_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if not private.can_admin_institution(actor, target_university_id) then
    raise exception 'Institution administrator access is required.' using errcode = '42501';
  end if;
  update public.universities set active = university_active where id = target_university_id;
  if not found then raise exception 'Institution not found.' using errcode = 'P0002'; end if;
  perform private.log_audit(
    actor,
    'institution_updated',
    'university',
    target_university_id::text,
    null,
    target_university_id,
    jsonb_build_object('active', university_active)
  );
end;
$$;

create or replace function public.get_institution_member_counts()
returns table (university_id uuid, member_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select m.university_id, count(*)::bigint
  from public.memberships m
  where private.can_admin_institution(auth.uid(), m.university_id)
  group by m.university_id;
$$;

create or replace function public.platform_set_role(
  target_user_id uuid,
  selected_role public.operational_role,
  role_enabled boolean,
  target_university_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if not private.has_role(actor, array['platform_admin'::public.operational_role]) then
    raise exception 'Platform administrator access is required.' using errcode = '42501';
  end if;
  if target_user_id = actor and selected_role = 'platform_admin' and not role_enabled then
    raise exception 'You cannot revoke your own platform administrator role.' using errcode = '23514';
  end if;
  if role_enabled then
    insert into public.user_roles (user_id, role, assigned_by)
    values (target_user_id, selected_role, actor)
    on conflict (user_id, role) do nothing;
    if selected_role = 'institution_admin' then
      if target_university_id is null then
        raise exception 'Institution administrators require an institution assignment.' using errcode = '23514';
      end if;
      insert into public.institution_admin_assignments (user_id, university_id, assigned_by)
      values (target_user_id, target_university_id, actor)
      on conflict (user_id, university_id) do nothing;
    end if;
    perform private.log_audit(
      actor,
      'role_assigned',
      'member',
      target_user_id::text,
      null,
      target_university_id,
      jsonb_build_object('role', selected_role)
    );
  else
    delete from public.user_roles where user_id = target_user_id and role = selected_role;
    if selected_role = 'institution_admin' then
      delete from public.institution_admin_assignments
      where user_id = target_user_id
        and (target_university_id is null or university_id = target_university_id);
    end if;
    perform private.log_audit(
      actor,
      'role_revoked',
      'member',
      target_user_id::text,
      null,
      target_university_id,
      jsonb_build_object('role', selected_role)
    );
  end if;
end;
$$;

alter table public.user_roles enable row level security;
alter table public.institution_admin_assignments enable row level security;
alter table public.moderation_cases enable row level security;
alter table public.moderation_case_notes enable row level security;
alter table public.member_restrictions enable row level security;
alter table public.audit_events enable row level security;
alter table public.reschedule_proposals enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy user_roles_read_authorized on public.user_roles
for select to authenticated using (
  user_id = (select auth.uid())
  or private.has_role((select auth.uid()), array['platform_admin'::public.operational_role])
);

create policy institution_assignments_read_authorized on public.institution_admin_assignments
for select to authenticated using (
  user_id = (select auth.uid())
  or private.has_role((select auth.uid()), array['platform_admin'::public.operational_role])
);

create policy moderation_cases_read_moderators on public.moderation_cases
for select to authenticated using (
  private.has_role((select auth.uid()), array['moderator'::public.operational_role, 'platform_admin'::public.operational_role])
);

create policy moderation_notes_read_moderators on public.moderation_case_notes
for select to authenticated using (
  private.has_role((select auth.uid()), array['moderator'::public.operational_role, 'platform_admin'::public.operational_role])
);

create policy restrictions_read_moderators on public.member_restrictions
for select to authenticated using (
  private.has_role((select auth.uid()), array['moderator'::public.operational_role, 'platform_admin'::public.operational_role])
);

create policy audit_read_platform on public.audit_events
for select to authenticated using (
  private.has_role((select auth.uid()), array['platform_admin'::public.operational_role])
);

create policy audit_read_moderation on public.audit_events
for select to authenticated using (
  case_id is not null
  and private.has_role((select auth.uid()), array['moderator'::public.operational_role])
);

create policy audit_read_institution on public.audit_events
for select to authenticated using (
  institution_id is not null
  and private.can_admin_institution((select auth.uid()), institution_id)
);

create policy reschedule_read_participants on public.reschedule_proposals
for select to authenticated using (
  exists (
    select 1
    from public.learning_requests r
    where r.id = request_id
      and (select auth.uid()) in (r.sender_id, r.recipient_id)
  )
);

create policy notification_preferences_read_own on public.notification_preferences
for select to authenticated using (user_id = (select auth.uid()));

create policy notification_preferences_update_own on public.notification_preferences
for update to authenticated
using (user_id = (select auth.uid()) and private.is_active_member())
with check (user_id = (select auth.uid()) and private.is_active_member());

create policy deletion_requests_read_own on public.account_deletion_requests
for select to authenticated using (user_id = (select auth.uid()));

drop policy profiles_update_own_verified on public.profiles;
create policy profiles_update_own_active on public.profiles
for update to authenticated
using (id = (select auth.uid()) and private.is_active_member())
with check (id = (select auth.uid()) and private.is_active_member());

drop policy profile_locations_insert_own on public.profile_locations;
create policy profile_locations_insert_own_active on public.profile_locations
for insert to authenticated
with check (profile_id = (select auth.uid()) and private.is_active_member());

drop policy profile_locations_update_own on public.profile_locations;
create policy profile_locations_update_own_active on public.profile_locations
for update to authenticated
using (profile_id = (select auth.uid()) and private.is_active_member())
with check (profile_id = (select auth.uid()) and private.is_active_member());

drop policy profile_skills_insert_own on public.profile_skills;
create policy profile_skills_insert_own_active on public.profile_skills
for insert to authenticated
with check (profile_id = (select auth.uid()) and private.is_active_member());

drop policy profile_skills_delete_own on public.profile_skills;
create policy profile_skills_delete_own_active on public.profile_skills
for delete to authenticated
using (profile_id = (select auth.uid()) and private.is_active_member());

drop policy saved_profiles_insert_own on public.saved_profiles;
create policy saved_profiles_insert_own_active on public.saved_profiles
for insert to authenticated with check (
  owner_id = (select auth.uid())
  and private.is_active_member()
  and owner_id <> profile_id
  and private.can_view_profile(profile_id)
  and not private.are_blocked(owner_id, profile_id)
);

drop policy blocks_insert_own on public.blocks;
create policy blocks_insert_own_active on public.blocks
for insert to authenticated with check (
  blocker_id = (select auth.uid())
  and private.is_active_member()
  and blocker_id <> blocked_id
);

drop policy reports_insert_own on public.reports;
create policy reports_insert_own_active on public.reports
for insert to authenticated with check (
  reporter_id = (select auth.uid())
  and private.is_active_member()
);

drop policy feedback_insert_own on public.session_feedback;
create policy feedback_insert_own_active on public.session_feedback
for insert to authenticated with check (
  user_id = (select auth.uid())
  and private.is_active_member()
);

drop policy university_domains_read_active on public.university_domains;
create policy university_domains_read_active on public.university_domains
for select to anon, authenticated using (
  active
  and exists (
    select 1 from public.universities u
    where u.id = university_id and u.active
  )
);

create policy universities_read_admin on public.universities
for select to authenticated using (
  private.can_admin_institution((select auth.uid()), id)
);

create policy university_domains_read_admin on public.university_domains
for select to authenticated using (
  private.can_admin_institution((select auth.uid()), university_id)
);

revoke all on public.user_roles,
  public.institution_admin_assignments,
  public.moderation_cases,
  public.moderation_case_notes,
  public.member_restrictions,
  public.audit_events,
  public.reschedule_proposals,
  public.notification_preferences,
  public.account_deletion_requests
from anon, authenticated;

grant select on public.user_roles, public.institution_admin_assignments to authenticated;
grant select on public.moderation_cases, public.moderation_case_notes, public.member_restrictions, public.audit_events to authenticated;
grant select on public.reschedule_proposals to authenticated;
grant select on public.notification_preferences to authenticated;
grant update (request_activity, reschedule_activity, feedback_reminders)
on public.notification_preferences to authenticated;
grant select on public.account_deletion_requests to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated, service_role;
grant execute on function private.is_verified(uuid) to authenticated;
grant execute on function private.are_blocked(uuid, uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
grant execute on function private.has_role(uuid, public.operational_role[]) to authenticated;
grant execute on function private.can_admin_institution(uuid, uuid) to authenticated;
grant execute on function private.has_active_restriction(uuid) to authenticated;
grant execute on function private.is_deletion_pending(uuid) to authenticated;
grant execute on function private.is_active_member(uuid) to authenticated;

revoke execute on function public.get_my_access_state() from public, anon;
grant execute on function public.get_my_access_state() to authenticated;
revoke execute on function public.moderation_update_case(uuid, public.moderation_case_status, public.moderation_case_priority, text) from public, anon;
grant execute on function public.moderation_update_case(uuid, public.moderation_case_status, public.moderation_case_priority, text) to authenticated;
revoke execute on function public.moderation_add_note(uuid, text) from public, anon;
grant execute on function public.moderation_add_note(uuid, text) to authenticated;
revoke execute on function public.moderation_apply_restriction(uuid, uuid, public.member_restriction_type, text, timestamptz) from public, anon;
grant execute on function public.moderation_apply_restriction(uuid, uuid, public.member_restriction_type, text, timestamptz) to authenticated;
revoke execute on function public.moderation_revoke_restriction(uuid) from public, anon;
grant execute on function public.moderation_revoke_restriction(uuid) to authenticated;
revoke execute on function public.propose_reschedule(uuid, timestamptz, public.meeting_preference, text) from public, anon;
grant execute on function public.propose_reschedule(uuid, timestamptz, public.meeting_preference, text) to authenticated;
revoke execute on function public.respond_to_reschedule(uuid, public.reschedule_status) from public, anon;
grant execute on function public.respond_to_reschedule(uuid, public.reschedule_status) to authenticated;
revoke execute on function public.cancel_reschedule(uuid) from public, anon;
grant execute on function public.cancel_reschedule(uuid) to authenticated;
revoke execute on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
revoke execute on function public.cancel_account_deletion() from public, anon;
grant execute on function public.cancel_account_deletion() to authenticated;
revoke execute on function public.admin_add_domain(uuid, text, boolean) from public, anon;
grant execute on function public.admin_add_domain(uuid, text, boolean) to authenticated;
revoke execute on function public.admin_set_domain_active(uuid, boolean) from public, anon;
grant execute on function public.admin_set_domain_active(uuid, boolean) to authenticated;
revoke execute on function public.admin_set_university_active(uuid, boolean) from public, anon;
grant execute on function public.admin_set_university_active(uuid, boolean) to authenticated;
revoke execute on function public.get_institution_member_counts() from public, anon;
grant execute on function public.get_institution_member_counts() to authenticated;
revoke execute on function public.platform_set_role(uuid, public.operational_role, boolean, uuid) from public, anon;
grant execute on function public.platform_set_role(uuid, public.operational_role, boolean, uuid) to authenticated;
revoke execute on function private.purge_due_accounts() from public, anon, authenticated, service_role;
