begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

select is(
  (
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'universities', 'university_domains', 'memberships', 'profiles',
        'profile_locations', 'skills', 'profile_skills', 'learning_requests',
        'request_status_events', 'saved_profiles', 'notifications', 'blocks',
        'reports', 'session_feedback'
      )
      and not c.relrowsecurity
  ),
  0::bigint,
  'Every exposed Phase 2 table has RLS enabled'
);

select is(
  private.before_user_created(
    '{"user":{"email":"student@gmail.com"}}'::jsonb
  )->'error'->>'http_code',
  '403',
  'The Auth hook rejects a non-academic email domain'
);

select is(
  private.before_user_created(
    '{"user":{"email":"new-member@spark.test"}}'::jsonb
  ),
  '{}'::jsonb,
  'The Auth hook allows an active academic development domain'
);

set local role anon;
select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501',
  'permission denied for table profiles',
  'Anonymous users cannot read member profiles'
);
reset role;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '90000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'unverified@spark.test',
  extensions.crypt('TestPassword!2026', extensions.gen_salt('bf')),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*) from public.profiles where id = '30000000-0000-4000-8000-000000000002'),
  0::bigint,
  'Unverified users cannot browse the community'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*) from public.profiles where id = '30000000-0000-4000-8000-000000000002'),
  1::bigint,
  'Verified members can read discoverable profiles'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
update public.profiles set discoverable = false where id = '30000000-0000-4000-8000-000000000002';
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*) from public.profiles where id = '30000000-0000-4000-8000-000000000002'),
  0::bigint,
  'Hidden profiles are unavailable to other members'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
update public.profiles set discoverable = true where id = '30000000-0000-4000-8000-000000000002';
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ update public.profiles
     set biography = 'Unauthorized change'
     where id = '30000000-0000-4000-8000-000000000002'
     returning id $$,
  '42501',
  null,
  'Members cannot update another profile'
);

select throws_ok(
  $$ insert into public.memberships (user_id, university_id, verified_email_domain, verified_at)
     values (
       '90000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000001',
       'spark.test',
       now()
     ) $$,
  '42501',
  'permission denied for table memberships',
  'Members cannot forge academic verification'
);

insert into public.blocks (blocker_id, blocked_id)
values ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002');

select is(
  (select count(*) from public.profiles where id = '30000000-0000-4000-8000-000000000002'),
  0::bigint,
  'Blocked profiles disappear from discovery'
);

select throws_ok(
  $$ insert into public.learning_requests (
       sender_id, recipient_id, requested_skill_id, message, preferred_at, format
     ) values (
       '30000000-0000-4000-8000-000000000001',
       '30000000-0000-4000-8000-000000000002',
       '20000000-0000-4000-8000-000000000003',
       'This valid-length request should be rejected because the members are blocked.',
       now() + interval '4 days',
       'online'
     ) $$,
  '42501',
  null,
  'Blocked members cannot create learning requests'
);

delete from public.blocks
where blocker_id = '30000000-0000-4000-8000-000000000001'
  and blocked_id = '30000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ insert into public.learning_requests (
       id, sender_id, recipient_id, requested_skill_id, message, preferred_at, format
     ) values (
       '90000000-0000-4000-8000-000000000010',
       '30000000-0000-4000-8000-000000000001',
       '30000000-0000-4000-8000-000000000002',
       '20000000-0000-4000-8000-000000000003',
       'I would appreciate a focused review of my resume hierarchy and spacing.',
       now() + interval '7 days',
       'online'
     ) $$,
  'A verified sender can create a valid request'
);

select throws_ok(
  $$ insert into public.learning_requests (
       sender_id, recipient_id, requested_skill_id, message, preferred_at, format
     ) values (
       '30000000-0000-4000-8000-000000000001',
       '30000000-0000-4000-8000-000000000001',
       '20000000-0000-4000-8000-000000000003',
       'This request has enough text but should fail because it targets the sender.',
       now() + interval '8 days',
       'online'
     ) $$,
  '23514',
  null,
  'Self-requests are rejected'
);

select throws_ok(
  $$ update public.learning_requests
     set status = 'accepted'
     where id = '90000000-0000-4000-8000-000000000010' $$,
  '42501',
  null,
  'The sender cannot accept a pending request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*) from public.learning_requests where id = '90000000-0000-4000-8000-000000000010'),
  0::bigint,
  'Unrelated members cannot read a request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$ update public.learning_requests
     set status = 'accepted'
     where id = '90000000-0000-4000-8000-000000000010' $$,
  'The recipient can accept a pending request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ update public.learning_requests
     set status = 'completed'
     where id = '90000000-0000-4000-8000-000000000010' $$,
  'Either participant can complete an accepted request'
);

select throws_ok(
  $$ update public.learning_requests
     set status = 'accepted'
     where id = '90000000-0000-4000-8000-000000000010' $$,
  '42501',
  null,
  'Terminal requests cannot be reopened'
);

select lives_ok(
  $$ insert into public.session_feedback (
       request_id, user_id, helpful, comfortable_and_respected, learn_together_again
     ) values (
       '90000000-0000-4000-8000-000000000010',
       '30000000-0000-4000-8000-000000000001',
       true,
       true,
       true
     ) $$,
  'A participant can submit private feedback after completion'
);

insert into public.saved_profiles (owner_id, profile_id)
values ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*) from public.saved_profiles where owner_id = '30000000-0000-4000-8000-000000000001'),
  0::bigint,
  'Saved profiles are scoped to their owner'
);

select throws_ok(
  $$ insert into public.session_feedback (
       request_id, user_id, helpful, comfortable_and_respected, learn_together_again
     ) values (
       '90000000-0000-4000-8000-000000000010',
       '30000000-0000-4000-8000-000000000003',
       true,
       true,
       true
     ) $$,
  '23514',
  null,
  'Unrelated members cannot submit session feedback'
);

insert into public.reports (id, reporter_id, profile_id, reason, details)
values (
  '90000000-0000-4000-8000-000000000020',
  '30000000-0000-4000-8000-000000000003',
  '30000000-0000-4000-8000-000000000002',
  'other',
  'A private test report.'
);

select throws_ok(
  $$ select moderation_status
     from public.reports
     where id = '90000000-0000-4000-8000-000000000020' $$,
  '42501',
  null,
  'Members cannot read internal report moderation state'
);

select throws_ok(
  $$ update public.reports
     set moderation_status = 'resolved'
     where id = '90000000-0000-4000-8000-000000000020' $$,
  '42501',
  'permission denied for table reports',
  'Normal members cannot update report moderation state'
);

select is(
  (select count(*) from public.notifications where owner_id <> '30000000-0000-4000-8000-000000000003'),
  0::bigint,
  'Notifications are scoped to their owner'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ update public.profiles
     set biography = 'A direct client update must not bypass the profile transaction.'
     where id = '30000000-0000-4000-8000-000000000001' $$,
  '42501',
  null,
  'Members cannot directly update profile content outside the profile RPC'
);

select lives_ok(
  $$ update public.profiles
     set show_location = false
     where id = '30000000-0000-4000-8000-000000000001' $$,
  'Members retain column-limited access to their privacy settings'
);

select throws_ok(
  $$ insert into public.reports (
       reporter_id, profile_id, reason, moderation_status
     ) values (
       '30000000-0000-4000-8000-000000000001',
       '30000000-0000-4000-8000-000000000002',
       'other',
       'resolved'
     ) $$,
  '42501',
  null,
  'Members cannot set internal moderation state while creating a report'
);

select throws_ok(
  $$ update public.learning_requests
     set message = 'A member must not edit immutable request content through the API.'
     where id = '40000000-0000-4000-8000-000000000001' $$,
  '42501',
  null,
  'Members cannot update immutable learning request columns'
);

select throws_ok(
  $$ update public.notifications
     set event_type = 'request_completed'
     where owner_id = '30000000-0000-4000-8000-000000000001' $$,
  '42501',
  null,
  'Members cannot alter notification event data'
);

select lives_ok(
  $$ update public.notifications
     set read_at = now()
     where owner_id = '30000000-0000-4000-8000-000000000001' $$,
  'Members can update only their notification read state'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
update public.profiles
set show_location = false
where id = '30000000-0000-4000-8000-000000000002';
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*) from public.profile_locations where profile_id = '30000000-0000-4000-8000-000000000002'),
  0::bigint,
  'A hidden location is not exposed to another verified member'
);

select is(
  (select count(*) from public.reports where reporter_id = '30000000-0000-4000-8000-000000000003'),
  0::bigint,
  'Reports remain private to their reporter'
);

insert into public.blocks (blocker_id, blocked_id)
values ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*) from public.blocks where blocker_id = '30000000-0000-4000-8000-000000000001'),
  0::bigint,
  'Block relationships remain private to the blocker'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*) from public.session_feedback where user_id = '30000000-0000-4000-8000-000000000001'),
  0::bigint,
  'Private feedback is not exposed to other members'
);

select * from finish();
rollback;
