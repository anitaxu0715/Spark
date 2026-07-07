create or replace function private.normalize_skill_name(candidate text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(regexp_replace(coalesce(candidate, ''), '\s+', ' ', 'g'));
$$;

create or replace function private.is_valid_custom_skill_name(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select candidate <> ''
    and char_length(candidate) between 2 and 80
    and candidate ~ '[[:alnum:]]'
    and candidate !~* '(^|[[:space:]])https?://'
    and candidate !~* '(^|[[:space:]])www\.'
    and candidate !~* '[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}'
    and candidate !~ '[<>]';
$$;

revoke execute on function private.normalize_skill_name(text) from public, anon, authenticated;
revoke execute on function private.is_valid_custom_skill_name(text) from public, anon, authenticated;

create or replace function private.validate_profile_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.onboarding_completed and (
    char_length(trim(new.display_name)) < 1
    or not exists (
      select 1 from public.profile_skills ps
      where ps.profile_id = new.id and ps.mode = 'teach'
    )
    or not exists (
      select 1 from public.profile_skills ps
      where ps.profile_id = new.id and ps.mode = 'learn'
    )
  ) then
    raise exception 'Choose at least one teaching skill and one learning skill before onboarding.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.save_my_profile(
  text, text, text, text, text, public.meeting_preference, boolean, text, boolean, boolean, uuid[], uuid[]
) from public, anon, authenticated;

drop function public.save_my_profile(
  text, text, text, text, text, public.meeting_preference, boolean, text, boolean, boolean, uuid[], uuid[]
);

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
  learning_skill_ids uuid[],
  custom_teaching_skill_names text[],
  custom_learning_skill_names text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_display_name text := trim(coalesce(profile_display_name, ''));
  normalized_major text := trim(coalesce(profile_major, ''));
  normalized_biography text := trim(coalesce(profile_biography, ''));
  normalized_location text := trim(coalesce(profile_location, ''));
  normalized_availability text := trim(coalesce(profile_availability, ''));
  normalized_learning_style text := trim(coalesce(profile_learning_style, ''));
  normalized_custom_teaching text[];
  normalized_custom_learning text[];
  custom_teaching_ids uuid[];
  custom_learning_ids uuid[];
  final_teaching_ids uuid[];
  final_learning_ids uuid[];
begin
  if current_user_id is null or not private.is_active_member(current_user_id) then
    raise exception 'An active verified account is required to save a profile.' using errcode = '42501';
  end if;

  if char_length(normalized_display_name) not between 1 and 80 then
    raise exception 'Enter your display name.' using errcode = '23514';
  end if;
  if char_length(normalized_major) > 120
    or char_length(normalized_biography) > 800
    or char_length(normalized_availability) > 240
    or char_length(normalized_learning_style) > 240
    or char_length(normalized_location) > 120
    or (normalized_location <> '' and char_length(normalized_location) < 2) then
    raise exception 'One or more profile fields are too long or invalid.' using errcode = '23514';
  end if;

  normalized_custom_teaching := array(
    select distinct private.normalize_skill_name(candidate)
    from unnest(coalesce(custom_teaching_skill_names, '{}'::text[])) candidate
    where private.normalize_skill_name(candidate) <> ''
  );
  normalized_custom_learning := array(
    select distinct private.normalize_skill_name(candidate)
    from unnest(coalesce(custom_learning_skill_names, '{}'::text[])) candidate
    where private.normalize_skill_name(candidate) <> ''
  );

  if exists (
    select 1
    from unnest(normalized_custom_teaching || normalized_custom_learning) candidate
    where not private.is_valid_custom_skill_name(candidate)
  ) then
    raise exception 'Custom skills must be 2-80 characters and cannot contain URLs, emails, or markup.' using errcode = '23514';
  end if;

  if exists (
    select 1 from unnest(coalesce(teaching_skill_ids, '{}'::uuid[]) || coalesce(learning_skill_ids, '{}'::uuid[])) candidate
    where not exists (select 1 from public.skills s where s.id = candidate and s.active)
  ) then
    raise exception 'One or more selected skills are unavailable.' using errcode = '23514';
  end if;

  insert into public.skills (name, category)
  select candidate, 'Community'
  from unnest(normalized_custom_teaching || normalized_custom_learning) candidate
  on conflict (canonical_name) do nothing;

  custom_teaching_ids := array(
    select s.id
    from unnest(normalized_custom_teaching) candidate
    join public.skills s on s.canonical_name = lower(regexp_replace(candidate, '\s+', ' ', 'g'))
    where s.active
  );
  custom_learning_ids := array(
    select s.id
    from unnest(normalized_custom_learning) candidate
    join public.skills s on s.canonical_name = lower(regexp_replace(candidate, '\s+', ' ', 'g'))
    where s.active
  );

  if coalesce(array_length(normalized_custom_teaching, 1), 0) <> coalesce(array_length(custom_teaching_ids, 1), 0)
    or coalesce(array_length(normalized_custom_learning, 1), 0) <> coalesce(array_length(custom_learning_ids, 1), 0) then
    raise exception 'One or more custom skills are unavailable.' using errcode = '23514';
  end if;

  final_teaching_ids := array(
    select distinct skill_id
    from unnest(coalesce(teaching_skill_ids, '{}'::uuid[]) || coalesce(custom_teaching_ids, '{}'::uuid[])) skill_id
  );
  final_learning_ids := array(
    select distinct skill_id
    from unnest(coalesce(learning_skill_ids, '{}'::uuid[]) || coalesce(custom_learning_ids, '{}'::uuid[])) skill_id
  );

  if coalesce(array_length(final_teaching_ids, 1), 0) = 0
    or coalesce(array_length(final_learning_ids, 1), 0) = 0 then
    raise exception 'Choose at least one teaching skill and one learning skill.' using errcode = '23514';
  end if;

  if normalized_location = '' then
    delete from public.profile_locations where profile_id = current_user_id;
  else
    insert into public.profile_locations (profile_id, general_location)
    values (current_user_id, normalized_location)
    on conflict (profile_id) do update
      set general_location = excluded.general_location;
  end if;

  delete from public.profile_skills where profile_id = current_user_id;

  insert into public.profile_skills (profile_id, skill_id, mode)
  select current_user_id, skill_id, 'teach'::public.skill_mode
  from unnest(final_teaching_ids) skill_id;

  insert into public.profile_skills (profile_id, skill_id, mode)
  select current_user_id, skill_id, 'learn'::public.skill_mode
  from unnest(final_learning_ids) skill_id;

  update public.profiles
  set display_name = normalized_display_name,
      initials = upper(left(regexp_replace(normalized_display_name, '[^A-Za-z0-9]', '', 'g'), 2)),
      major = normalized_major,
      biography = normalized_biography,
      availability_summary = normalized_availability,
      availability_slots = case
        when normalized_availability = '' then '[]'::jsonb
        else jsonb_build_array(normalized_availability)
      end,
      meeting_preference = profile_meeting_preference,
      beginner_friendly = profile_beginner_friendly,
      learning_style = normalized_learning_style,
      discoverable = profile_discoverable,
      show_location = profile_show_location,
      onboarding_completed = true
  where id = current_user_id;

  if not found then
    raise exception 'Your profile could not be found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.save_my_profile(
  text, text, text, text, text, public.meeting_preference, boolean, text, boolean, boolean, uuid[], uuid[], text[], text[]
) from public, anon;
grant execute on function public.save_my_profile(
  text, text, text, text, text, public.meeting_preference, boolean, text, boolean, boolean, uuid[], uuid[], text[], text[]
) to authenticated;
