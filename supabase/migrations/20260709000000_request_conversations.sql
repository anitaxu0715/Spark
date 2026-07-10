alter type public.notification_type add value if not exists 'request_message';

create table public.request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.learning_requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index request_messages_request_created_idx
  on public.request_messages (request_id, created_at);

create index request_messages_author_idx
  on public.request_messages (author_id, created_at desc);

create or replace function private.validate_request_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_row public.learning_requests%rowtype;
  other_user uuid;
begin
  if actor is not null then
    if new.author_id <> actor or not private.is_active_member(actor) then
      raise exception 'Messages must be sent by an active signed-in participant.' using errcode = '42501';
    end if;
  end if;

  new.body := trim(regexp_replace(new.body, '\s+', ' ', 'g'));
  if char_length(new.body) = 0 or char_length(new.body) > 1000 then
    raise exception 'Messages must be 1-1000 characters.' using errcode = '23514';
  end if;

  select * into request_row
  from public.learning_requests
  where id = new.request_id;

  if not found or new.author_id not in (request_row.sender_id, request_row.recipient_id) then
    raise exception 'Messages are limited to request participants.' using errcode = '42501';
  end if;

  other_user := case
    when new.author_id = request_row.sender_id then request_row.recipient_id
    else request_row.sender_id
  end;

  if actor is not null and not private.is_active_member(other_user) then
    raise exception 'Messages require active request participants.' using errcode = '42501';
  end if;

  if request_row.status not in ('pending', 'accepted') then
    raise exception 'Messages are closed for this request.' using errcode = '42501';
  end if;

  if private.are_blocked(request_row.sender_id, request_row.recipient_id) then
    raise exception 'Messages are disabled between blocked members.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger request_messages_validate
before insert on public.request_messages
for each row execute function private.validate_request_message();

create or replace function private.notify_request_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  select case when new.author_id = r.sender_id then r.recipient_id else r.sender_id end
  into recipient
  from public.learning_requests r
  where r.id = new.request_id;

  if recipient is not null and private.notification_enabled(recipient, 'request_activity') then
    insert into public.notifications (owner_id, event_type, actor_id, request_id)
    values (recipient, 'request_message', new.author_id, new.request_id);
  end if;

  return new;
end;
$$;

create trigger request_messages_notify
after insert on public.request_messages
for each row execute function private.notify_request_message();

alter table public.request_messages enable row level security;

create policy request_messages_read_participants on public.request_messages
for select to authenticated using (
  exists (
    select 1 from public.learning_requests r
    where r.id = request_id
      and (select auth.uid()) in (r.sender_id, r.recipient_id)
  )
);

create policy request_messages_insert_participants on public.request_messages
for insert to authenticated with check (
  author_id = (select auth.uid())
  and private.is_active_member()
  and exists (
    select 1 from public.learning_requests r
    where r.id = request_id
      and (select auth.uid()) in (r.sender_id, r.recipient_id)
      and r.status in ('pending', 'accepted')
      and not private.are_blocked(r.sender_id, r.recipient_id)
  )
);

revoke all on public.request_messages from anon, authenticated;
grant select on public.request_messages to authenticated;
grant insert (id, request_id, author_id, body) on public.request_messages to authenticated;
