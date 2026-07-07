begin;

create extension if not exists pgtap with schema extensions;
select plan(43);

select is(
  (
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'user_roles', 'institution_admin_assignments', 'moderation_cases',
        'moderation_case_notes', 'member_restrictions', 'audit_events',
        'reschedule_proposals', 'notification_preferences',
        'account_deletion_requests'
      )
      and not c.relrowsecurity
  ),
  0::bigint,
  'Every Phase 3 table has RLS enabled'
);

select is(
  (
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosecdef
      and not ('search_path=""' = any(coalesce(p.proconfig, array[]::text[])))
  ),
  0::bigint,
  'Every application security-definer function has an empty search path'
);

select is(
  has_schema_privilege('anon', 'private', 'usage'),
  false,
  'Anonymous clients cannot use the private schema'
);

select is(
  has_schema_privilege('authenticated', 'private', 'usage'),
  false,
  'Authenticated clients cannot use the private schema through PostgREST'
);

select is(
  private.before_user_created('{"user":{"email":"student@spark.test"}}'::jsonb),
  '{}'::jsonb,
  'Active development domains remain eligible for signup'
);

update public.university_domains set active = false where domain = 'spark.test';
select is(
  private.before_user_created('{"user":{"email":"student@spark.test"}}'::jsonb)->'error'->>'http_code',
  '403',
  'Inactive domains are rejected by the Auth hook'
);
update public.university_domains set active = true where domain = 'spark.test';

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ insert into public.user_roles (user_id, role)
     values ('30000000-0000-4000-8000-000000000001', 'platform_admin') $$,
  '42501',
  'permission denied for table user_roles',
  'Members cannot assign themselves an operational role'
);
select is((select count(*) from public.moderation_cases), 0::bigint, 'Members cannot read moderation cases');
select is((select count(*) from public.audit_events), 0::bigint, 'Members cannot read audit events');
select is((select count(*) from public.member_restrictions), 0::bigint, 'Members cannot read restriction details');
reset role;

insert into public.reports (id, reporter_id, profile_id, reason, details)
values (
  '90000000-0000-4000-8000-000000000100',
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  'other',
  'A deterministic Phase 3 moderation test report.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000010', true);
select is((select count(*) from public.moderation_cases), 1::bigint, 'Moderators can read moderation cases');
select lives_ok(
  $$ select public.moderation_add_note(
       (select id from public.moderation_cases where report_id = '90000000-0000-4000-8000-000000000100'),
       'Internal test note'
     ) $$,
  'Moderators can add internal case notes'
);
select lives_ok(
  $$ select public.moderation_update_case(
       (select id from public.moderation_cases where report_id = '90000000-0000-4000-8000-000000000100'),
       'reviewing',
       'elevated',
       null
     ) $$,
  'Moderators can perform an allowed case transition'
);
select throws_ok(
  $$ select public.moderation_update_case(
       (select id from public.moderation_cases where report_id = '90000000-0000-4000-8000-000000000100'),
       'submitted',
       'standard',
       null
     ) $$,
  '23514',
  null,
  'Invalid moderation transitions are rejected'
);
select lives_ok(
  $$ select public.moderation_apply_restriction(
       (select id from public.moderation_cases where report_id = '90000000-0000-4000-8000-000000000100'),
       '30000000-0000-4000-8000-000000000002',
       'temporary_suspension',
       'Deterministic test restriction',
       now() + interval '1 day'
     ) $$,
  'Moderators can apply a case-linked restriction'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
select is(
  (public.get_my_access_state()->>'restricted')::boolean,
  true,
  'Restricted members receive a safe access-state signal'
);
select throws_ok(
  $$ insert into public.saved_profiles (owner_id, profile_id)
     values (
       '30000000-0000-4000-8000-000000000002',
       '30000000-0000-4000-8000-000000000003'
     ) $$,
  '42501',
  null,
  'Restricted members cannot perform community mutations'
);
select is((select count(*) from public.member_restrictions), 0::bigint, 'Restriction reasons remain hidden from their subject');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000010', true);
select lives_ok(
  $$ select public.moderation_revoke_restriction(
       (select id from public.member_restrictions
        where target_user_id = '30000000-0000-4000-8000-000000000002'
          and revoked_at is null)
     ) $$,
  'Moderators can revoke a restriction'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000011', true);
select is(
  (select count(*) from public.universities where id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'Institution administrators can read their assigned institution'
);
select is(
  (select count(*) from public.institution_admin_assignments
   where university_id = '10000000-0000-4000-8000-000000000002'),
  0::bigint,
  'Institution administrators cannot read assignments for another institution'
);
select throws_ok(
  $$ select public.admin_set_university_active(
       '10000000-0000-4000-8000-000000000002',
       false
     ) $$,
  '42501',
  null,
  'Institution administrators cannot alter another institution'
);
select is((select count(*) from public.moderation_cases), 0::bigint, 'Institution administrators cannot read moderation cases');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ select public.propose_reschedule(
       '40000000-0000-4000-8000-000000000002',
       now() + interval '10 days',
       'online',
       'A deterministic Phase 3 proposal'
     ) $$,
  'A participant can propose a new time for an accepted request'
);
select throws_ok(
  $$ select public.respond_to_reschedule(
       (select id from public.reschedule_proposals
        where request_id = '40000000-0000-4000-8000-000000000002'
          and status = 'pending'),
       'accepted'
     ) $$,
  '42501',
  null,
  'The proposer cannot accept their own proposal'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$ select public.respond_to_reschedule(
       (select id from public.reschedule_proposals
        where request_id = '40000000-0000-4000-8000-000000000002'
          and status = 'pending'),
       'accepted'
     ) $$,
  'The other participant can accept a proposal'
);
select cmp_ok(
  (select preferred_at from public.learning_requests where id = '40000000-0000-4000-8000-000000000002'),
  '>',
  now() + interval '9 days',
  'Accepting a proposal updates the request schedule'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000004', true);
select lives_ok(
  $$ select public.save_my_profile(
       'Minimal Member',
       '',
       '',
       '',
       '',
       'either',
       true,
       '',
       true,
       false,
       '{}'::uuid[],
       '{}'::uuid[],
       array['  Crochet   Basics  '],
       array['crochet basics']
     ) $$,
  'A member can complete onboarding with optional profile fields empty and custom skills'
);
select is(
  (
    select jsonb_build_object(
      'major', major,
      'biography', biography,
      'availability', availability_summary,
      'style', learning_style,
      'onboarding', onboarding_completed
    )
    from public.profiles
    where id = '30000000-0000-4000-8000-000000000004'
  ),
  '{"major":"","biography":"","availability":"","style":"","onboarding":true}'::jsonb,
  'Optional profile fields remain empty strings while onboarding completes'
);
select is(
  (select count(*) from public.profile_locations where profile_id = '30000000-0000-4000-8000-000000000004'),
  0::bigint,
  'Empty optional location removes the profile location row'
);
select is(
  (select count(*) from public.skills where canonical_name = 'crochet basics' and category = 'Community'),
  1::bigint,
  'Custom skills are normalized and deduplicated case-insensitively'
);
select is(
  (select count(*) from public.profile_skills where profile_id = '30000000-0000-4000-8000-000000000004'),
  2::bigint,
  'The normalized custom skill can be attached for both teaching and learning'
);
select throws_ok(
  $$ select public.save_my_profile(
       'Minimal Member',
       '',
       '',
       '',
       '',
       'either',
       true,
       '',
       true,
       false,
       array['20000000-0000-4000-8000-000000000001']::uuid[],
       array['20000000-0000-4000-8000-000000000002']::uuid[],
       array['https://bad.example'],
       '{}'::text[]
     ) $$,
  '23514',
  null,
  'Custom skills reject URLs and markup-like unsafe input'
);
select throws_ok(
  $$ select public.save_my_profile(
       'Minimal Member',
       '',
       '',
       '',
       '',
       'either',
       true,
       '',
       true,
       false,
       '{}'::uuid[],
       '{}'::uuid[],
       '{}'::text[],
       '{}'::text[]
     ) $$,
  '23514',
  null,
  'Members still need at least one teaching and one learning skill'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$ select private.purge_due_accounts() $$,
  '42501',
  null,
  'Authenticated clients cannot invoke the account purge routine'
);
reset role;

update auth.users
set last_sign_in_at = now()
where id = '30000000-0000-4000-8000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$ select public.request_account_deletion() $$,
  'A recently reauthenticated member can request deletion'
);
select is(
  (public.get_my_access_state()->>'deletion_pending')::boolean,
  true,
  'A deletion request immediately changes the safe access state'
);
select lives_ok(
  $$ select public.cancel_account_deletion() $$,
  'The member can cancel during the grace period'
);
select is(
  (public.get_my_access_state()->>'deletion_pending')::boolean,
  false,
  'Cancellation restores the active account state'
);
select lives_ok(
  $$ select public.request_account_deletion() $$,
  'A member can create a new request after cancelling an earlier one'
);
reset role;

update public.account_deletion_requests
set requested_at = now() - interval '8 days',
    purge_after = now() - interval '1 day'
where user_id = '30000000-0000-4000-8000-000000000003'
  and status = 'requested';

select is(
  private.purge_due_accounts(),
  1,
  'The owner-only purge removes one due account'
);
select is(
  (select count(*) from auth.users where id = '30000000-0000-4000-8000-000000000003'),
  0::bigint,
  'Purging removes the Auth user'
);
select is(
  (
    select count(*) from public.account_deletion_requests
    where status = 'purged' and user_id is null
  ),
  1::bigint,
  'The deletion request retains only anonymized purge history'
);

select * from finish();
rollback;
