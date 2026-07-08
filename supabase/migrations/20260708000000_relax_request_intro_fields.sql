alter table public.learning_requests
  alter column preferred_at drop not null;

alter table public.learning_requests
  drop constraint learning_requests_future_time,
  add constraint learning_requests_future_time check (preferred_at is null or preferred_at > created_at);

alter table public.learning_requests
  drop constraint learning_requests_message_check,
  add constraint learning_requests_message_check check (char_length(message) <= 1000);
