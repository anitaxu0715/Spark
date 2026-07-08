insert into public.universities (id, name, slug)
values ('10000000-0000-4000-8000-000000000099', 'Spark Invite Beta', 'spark-invite-beta')
on conflict (id) do nothing;

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  label text not null default 'Beta invite' check (char_length(label) between 2 and 120),
  university_id uuid not null references public.universities(id),
  max_uses integer not null default 1 check (max_uses > 0 and max_uses <= 10000),
  used_count integer not null default 0 check (used_count >= 0 and used_count <= max_uses),
  active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  invite_code_id uuid not null references public.invite_codes(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  email_domain text not null check (email_domain = lower(email_domain) and email_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  redeemed_at timestamptz not null default now(),
  unique (invite_code_id, user_id)
);

create index invite_codes_active_idx on public.invite_codes (active, expires_at);
create index invite_redemptions_code_idx on public.invite_redemptions (invite_code_id);

create trigger invite_codes_set_updated_at
before update on public.invite_codes
for each row execute function private.set_updated_at();

create or replace function private.is_invite_hash_available(invite_hash text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.invite_codes c
    join public.universities u on u.id = c.university_id
    where c.code_hash = lower(trim(coalesce(invite_hash, '')))
      and c.active
      and u.active
      and c.used_count < c.max_uses
      and (c.expires_at is null or c.expires_at > now())
  );
$$;

create or replace function public.validate_invite_code(invite_code_hash text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_invite_hash_available(invite_code_hash);
$$;

create or replace function private.before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_domain text := lower(split_part(event->'user'->>'email', '@', 2));
  candidate_invite_hash text := coalesce(
    event->'user'->'raw_user_meta_data'->>'invite_code_hash',
    event->'user'->'user_metadata'->>'invite_code_hash'
  );
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

  if private.is_invite_hash_available(candidate_invite_hash) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code', 403,
      'message', 'Use an eligible academic email address or a valid invite code to join Spark.'
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
  candidate_invite_hash text := new.raw_user_meta_data->>'invite_code_hash';
  matched_university uuid;
  invite_id uuid;
  invite_university uuid;
  redemption_id uuid;
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

    if matched_university is null and candidate_invite_hash is not null then
      select c.id, c.university_id into invite_id, invite_university
      from public.invite_codes c
      join public.universities u on u.id = c.university_id and u.active
      where c.code_hash = lower(trim(candidate_invite_hash))
        and c.active
        and c.used_count < c.max_uses
        and (c.expires_at is null or c.expires_at > now())
      for update of c;

      if invite_id is not null then
        insert into public.invite_redemptions (invite_code_id, user_id, email_domain)
        values (invite_id, new.id, candidate_domain)
        on conflict (user_id) do nothing
        returning id into redemption_id;

        if redemption_id is not null then
          update public.invite_codes
          set used_count = used_count + 1
          where id = invite_id;
        end if;

        matched_university := invite_university;
      end if;
    end if;

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

alter table public.invite_codes enable row level security;
alter table public.invite_redemptions enable row level security;

create policy invite_codes_read_platform_admin on public.invite_codes
for select to authenticated
using (private.has_role((select auth.uid()), array['platform_admin'::public.operational_role]));

create policy invite_redemptions_read_platform_admin on public.invite_redemptions
for select to authenticated
using (private.has_role((select auth.uid()), array['platform_admin'::public.operational_role]));

revoke all on public.invite_codes, public.invite_redemptions from public, anon, authenticated;
grant select on public.invite_codes, public.invite_redemptions to authenticated;

revoke execute on function private.is_invite_hash_available(text) from public, anon, authenticated;
revoke execute on function public.validate_invite_code(text) from public, authenticated;
grant execute on function public.validate_invite_code(text) to anon;
