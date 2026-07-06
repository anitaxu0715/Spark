create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.meeting_preference as enum ('online', 'in-person', 'either');
create type public.skill_mode as enum ('teach', 'learn');
create type public.request_status as enum ('pending', 'accepted', 'completed', 'declined', 'cancelled');
create type public.notification_type as enum (
  'new_request',
  'request_accepted',
  'request_declined',
  'request_completed',
  'request_cancelled',
  'feedback_reminder'
);
create type public.report_reason as enum ('safety', 'harassment', 'spam', 'misrepresentation', 'other');
create type public.moderation_status as enum ('submitted', 'reviewing', 'resolved', 'dismissed');

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.university_domains (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  domain text not null check (domain = lower(domain) and domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  is_development boolean not null default false,
  unique (domain)
);

create table public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  university_id uuid not null references public.universities(id),
  verified_email_domain text not null,
  verified_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  initials text not null check (char_length(initials) between 1 and 3),
  avatar_color text not null default 'coral',
  university_id uuid references public.universities(id),
  major text not null default '' check (char_length(major) <= 120),
  biography text not null default '' check (char_length(biography) <= 800),
  availability_summary text not null default '' check (char_length(availability_summary) <= 240),
  availability_slots jsonb not null default '[]'::jsonb check (jsonb_typeof(availability_slots) = 'array'),
  meeting_preference public.meeting_preference not null default 'either',
  beginner_friendly boolean not null default true,
  learning_style text not null default '' check (char_length(learning_style) <= 240),
  experience_tags text[] not null default '{}',
  discoverable boolean not null default false,
  show_location boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_locations (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  general_location text not null check (char_length(general_location) between 2 and 120),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  canonical_name text generated always as (lower(regexp_replace(trim(name), '\s+', ' ', 'g'))) stored,
  category text not null check (char_length(category) between 2 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (canonical_name)
);

create table public.profile_skills (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  mode public.skill_mode not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id, mode)
);

create table public.learning_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  requested_skill_id uuid not null references public.skills(id),
  offered_skill_id uuid references public.skills(id),
  message text not null check (char_length(message) between 20 and 1000),
  preferred_at timestamptz not null,
  format public.meeting_preference not null check (format <> 'either'),
  status public.request_status not null default 'pending',
  cancelled_by uuid references public.profiles(id),
  cancellation_reason text check (char_length(cancellation_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_requests_not_self check (sender_id <> recipient_id),
  constraint learning_requests_future_time check (preferred_at > created_at),
  constraint learning_requests_cancellation_consistency check (
    (status = 'cancelled' and cancelled_by is not null)
    or (status <> 'cancelled' and cancelled_by is null and cancellation_reason is null)
  )
);

create unique index learning_requests_unique_active
  on public.learning_requests (sender_id, recipient_id, requested_skill_id)
  where status in ('pending', 'accepted');

create table public.request_status_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.learning_requests(id) on delete cascade,
  status public.request_status not null,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.saved_profiles (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, profile_id),
  check (owner_id <> profile_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  event_type public.notification_type not null,
  actor_id uuid references public.profiles(id) on delete set null,
  request_id uuid references public.learning_requests(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  profile_id uuid not null references public.profiles(id),
  request_id uuid references public.learning_requests(id),
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  moderation_status public.moderation_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id <> profile_id)
);

create table public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.learning_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  helpful boolean not null,
  comfortable_and_respected boolean not null,
  learn_together_again boolean not null,
  private_note text check (char_length(private_note) <= 1000),
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

create index university_domains_university_idx on public.university_domains (university_id);
create index profiles_university_discovery_idx on public.profiles (university_id, discoverable) where onboarding_completed;
create index profile_skills_skill_mode_idx on public.profile_skills (skill_id, mode, profile_id);
create index learning_requests_sender_idx on public.learning_requests (sender_id, status, created_at desc);
create index learning_requests_recipient_idx on public.learning_requests (recipient_id, status, created_at desc);
create index request_events_request_idx on public.request_status_events (request_id, created_at);
create index saved_profiles_profile_idx on public.saved_profiles (profile_id);
create index notifications_owner_idx on public.notifications (owner_id, read_at, created_at desc);
create index blocks_blocked_idx on public.blocks (blocked_id, blocker_id);
create index reports_reporter_idx on public.reports (reporter_id, created_at desc);
create index feedback_request_idx on public.session_feedback (request_id);

create or replace function private.is_verified(candidate uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.universities u on u.id = m.university_id and u.active
    where m.user_id = candidate
  );
$$;

create or replace function private.are_blocked(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = first_user and b.blocked_id = second_user)
       or (b.blocker_id = second_user and b.blocked_id = first_user)
  );
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
      private.is_verified(auth.uid())
      and private.is_verified(target_profile)
      and not private.are_blocked(auth.uid(), target_profile)
      and exists (
        select 1 from public.profiles p
        where p.id = target_profile
          and p.discoverable
          and p.onboarding_completed
      )
    );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger profile_locations_set_updated_at
before update on public.profile_locations
for each row execute function private.set_updated_at();

create trigger reports_set_updated_at
before update on public.reports
for each row execute function private.set_updated_at();

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
    where d.domain = candidate_domain and u.active
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

grant usage on schema private to supabase_auth_admin;
grant execute on function private.before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function private.before_user_created(jsonb) from public, anon, authenticated;

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

  if new.email_confirmed_at is not null then
    select d.university_id into matched_university
    from public.university_domains d
    join public.universities u on u.id = d.university_id and u.active
    where d.domain = candidate_domain;

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

create trigger auth_user_sync
after insert or update of email, email_confirmed_at on auth.users
for each row execute function private.sync_auth_user();

create or replace function private.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and (
    new.id is distinct from old.id
    or new.slug is distinct from old.slug
    or new.university_id is distinct from old.university_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Protected profile fields cannot be changed.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
before update on public.profiles
for each row execute function private.protect_profile_fields();

create or replace function private.validate_profile_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.onboarding_completed and (
    char_length(trim(new.major)) < 2
    or char_length(trim(new.biography)) < 20
    or char_length(trim(new.availability_summary)) < 2
    or char_length(trim(new.learning_style)) < 2
    or not exists (
      select 1 from public.profile_locations l
      where l.profile_id = new.id and char_length(trim(l.general_location)) >= 2
    )
    or not exists (
      select 1 from public.profile_skills ps
      where ps.profile_id = new.id and ps.mode = 'teach'
    )
    or not exists (
      select 1 from public.profile_skills ps
      where ps.profile_id = new.id and ps.mode = 'learn'
    )
  ) then
    raise exception 'Complete the required profile and skill fields before onboarding.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_completion
before update on public.profiles
for each row execute function private.validate_profile_completion();

create or replace function private.validate_request_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor is not null then
      if new.sender_id <> actor or new.status <> 'pending' then
        raise exception 'New requests must be pending and owned by the sender.' using errcode = '42501';
      end if;
      if not private.is_verified(actor) or not private.can_view_profile(new.recipient_id) then
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

create trigger learning_requests_validate
before insert or update on public.learning_requests
for each row execute function private.validate_request_write();

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
begin
  if tg_op = 'INSERT' then
    insert into public.request_status_events (request_id, status, actor_id)
    values (new.id, new.status, coalesce(actor, new.sender_id));

    insert into public.notifications (owner_id, event_type, actor_id, request_id)
    values (new.recipient_id, 'new_request', new.sender_id, new.id);
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

    if mapped_event is not null and other_user is not null then
      insert into public.notifications (owner_id, event_type, actor_id, request_id)
      values (other_user, mapped_event, actor, new.id);
    end if;

    if new.status = 'completed' then
      insert into public.notifications (owner_id, event_type, actor_id, request_id)
      values
        (new.sender_id, 'feedback_reminder', new.recipient_id, new.id),
        (new.recipient_id, 'feedback_reminder', new.sender_id, new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger learning_requests_activity
after insert or update on public.learning_requests
for each row execute function private.record_request_activity();

create or replace function private.validate_notification_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and (
    new.id is distinct from old.id
    or new.owner_id is distinct from old.owner_id
    or new.event_type is distinct from old.event_type
    or new.actor_id is distinct from old.actor_id
    or new.request_id is distinct from old.request_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Only notification read state can be changed.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger notifications_protect_fields
before update on public.notifications
for each row execute function private.validate_notification_update();

create or replace function private.handle_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.saved_profiles
  where (owner_id = new.blocker_id and profile_id = new.blocked_id)
     or (owner_id = new.blocked_id and profile_id = new.blocker_id);
  return new;
end;
$$;

create trigger blocks_remove_saves
after insert on public.blocks
for each row execute function private.handle_block();

create or replace function private.validate_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.reporter_id <> auth.uid() then
    raise exception 'Reports must be submitted by the signed-in member.' using errcode = '42501';
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

create trigger reports_validate
before insert on public.reports
for each row execute function private.validate_report();

create or replace function private.validate_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.user_id <> auth.uid() then
    raise exception 'Feedback must be submitted by the signed-in member.' using errcode = '42501';
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

create trigger session_feedback_validate
before insert on public.session_feedback
for each row execute function private.validate_feedback();

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
  if current_user_id is null or not private.is_verified(current_user_id) then
    raise exception 'A verified account is required to save a profile.' using errcode = '42501';
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

alter table public.universities enable row level security;
alter table public.university_domains enable row level security;
alter table public.memberships enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_locations enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.learning_requests enable row level security;
alter table public.request_status_events enable row level security;
alter table public.saved_profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.session_feedback enable row level security;

create policy universities_read_active on public.universities
for select to anon, authenticated using (active);

create policy university_domains_read_active on public.university_domains
for select to anon, authenticated using (
  exists (select 1 from public.universities u where u.id = university_id and u.active)
);

create policy memberships_read_own on public.memberships
for select to authenticated using (user_id = (select auth.uid()));

create policy profiles_read_authorized on public.profiles
for select to authenticated using (private.can_view_profile(id));

create policy profiles_update_own_verified on public.profiles
for update to authenticated
using (id = (select auth.uid()) and private.is_verified())
with check (id = (select auth.uid()) and private.is_verified());

create policy profile_locations_read_authorized on public.profile_locations
for select to authenticated using (
  profile_id = (select auth.uid())
  or (
    private.can_view_profile(profile_id)
    and exists (select 1 from public.profiles p where p.id = profile_id and p.show_location)
  )
);

create policy profile_locations_insert_own on public.profile_locations
for insert to authenticated with check (profile_id = (select auth.uid()) and private.is_verified());

create policy profile_locations_update_own on public.profile_locations
for update to authenticated
using (profile_id = (select auth.uid()) and private.is_verified())
with check (profile_id = (select auth.uid()) and private.is_verified());

create policy skills_read_active on public.skills
for select to anon, authenticated using (active);

create policy profile_skills_read_authorized on public.profile_skills
for select to authenticated using (private.can_view_profile(profile_id));

create policy profile_skills_insert_own on public.profile_skills
for insert to authenticated with check (profile_id = (select auth.uid()) and private.is_verified());

create policy profile_skills_delete_own on public.profile_skills
for delete to authenticated using (profile_id = (select auth.uid()) and private.is_verified());

create policy learning_requests_read_participants on public.learning_requests
for select to authenticated using ((select auth.uid()) in (sender_id, recipient_id));

create policy learning_requests_create_sender on public.learning_requests
for insert to authenticated with check (sender_id = (select auth.uid()) and status = 'pending');

create policy learning_requests_update_participants on public.learning_requests
for update to authenticated
using ((select auth.uid()) in (sender_id, recipient_id))
with check ((select auth.uid()) in (sender_id, recipient_id));

create policy request_events_read_participants on public.request_status_events
for select to authenticated using (
  exists (
    select 1 from public.learning_requests r
    where r.id = request_id and (select auth.uid()) in (r.sender_id, r.recipient_id)
  )
);

create policy saved_profiles_read_own on public.saved_profiles
for select to authenticated using (owner_id = (select auth.uid()));

create policy saved_profiles_insert_own on public.saved_profiles
for insert to authenticated with check (
  owner_id = (select auth.uid())
  and owner_id <> profile_id
  and private.can_view_profile(profile_id)
  and not private.are_blocked(owner_id, profile_id)
);

create policy saved_profiles_delete_own on public.saved_profiles
for delete to authenticated using (owner_id = (select auth.uid()));

create policy notifications_read_own on public.notifications
for select to authenticated using (owner_id = (select auth.uid()));

create policy notifications_update_own on public.notifications
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy blocks_read_own on public.blocks
for select to authenticated using (blocker_id = (select auth.uid()));

create policy blocks_insert_own on public.blocks
for insert to authenticated with check (blocker_id = (select auth.uid()) and blocker_id <> blocked_id);

create policy blocks_delete_own on public.blocks
for delete to authenticated using (blocker_id = (select auth.uid()));

create policy reports_read_own on public.reports
for select to authenticated using (reporter_id = (select auth.uid()));

create policy reports_insert_own on public.reports
for insert to authenticated with check (reporter_id = (select auth.uid()));

create policy feedback_read_own on public.session_feedback
for select to authenticated using (user_id = (select auth.uid()));

create policy feedback_insert_own on public.session_feedback
for insert to authenticated with check (user_id = (select auth.uid()));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.universities, public.university_domains, public.skills to anon, authenticated;
grant select on public.memberships to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.profile_locations to authenticated;
grant select on public.profile_skills to authenticated;
grant select, insert, update on public.learning_requests to authenticated;
grant select on public.request_status_events to authenticated;
grant select, insert, delete on public.saved_profiles to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert on public.session_feedback to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke execute on function public.save_my_profile(
  text, text, text, text, text, public.meeting_preference, boolean, text, boolean, boolean, uuid[], uuid[]
) from public, anon;
grant execute on function public.save_my_profile(
  text, text, text, text, text, public.meeting_preference, boolean, text, boolean, boolean, uuid[], uuid[]
) to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_verified(uuid) to authenticated;
grant execute on function private.are_blocked(uuid, uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
