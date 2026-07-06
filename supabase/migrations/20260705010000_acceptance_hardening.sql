revoke update on public.profiles from authenticated;
grant update (discoverable, show_location) on public.profiles to authenticated;

revoke insert, update on public.learning_requests from authenticated;
grant insert (
  id,
  sender_id,
  recipient_id,
  requested_skill_id,
  offered_skill_id,
  message,
  preferred_at,
  format
) on public.learning_requests to authenticated;
grant update (status, cancellation_reason) on public.learning_requests to authenticated;

revoke insert on public.saved_profiles from authenticated;
grant insert (owner_id, profile_id) on public.saved_profiles to authenticated;

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke insert on public.blocks from authenticated;
grant insert (blocker_id, blocked_id) on public.blocks to authenticated;

revoke insert on public.reports from authenticated;
grant insert (id, reporter_id, profile_id, request_id, reason, details) on public.reports to authenticated;
revoke select on public.reports from authenticated;
grant select (id, reporter_id, profile_id, request_id, reason, details, created_at)
on public.reports to authenticated;

revoke insert on public.session_feedback from authenticated;
grant insert (
  request_id,
  user_id,
  helpful,
  comfortable_and_respected,
  learn_together_again,
  private_note
) on public.session_feedback to authenticated;

create or replace function private.validate_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    if new.reporter_id <> auth.uid() then
      raise exception 'Reports must be submitted by the signed-in member.' using errcode = '42501';
    end if;
    if new.moderation_status <> 'submitted' then
      raise exception 'Members cannot set report moderation state.' using errcode = '42501';
    end if;
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
