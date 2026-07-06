insert into public.universities (id, name, slug) values
  ('10000000-0000-4000-8000-000000000001', 'University of Washington', 'university-of-washington'),
  ('10000000-0000-4000-8000-000000000002', 'Seattle University', 'seattle-university'),
  ('10000000-0000-4000-8000-000000000003', 'Bellevue College', 'bellevue-college'),
  ('10000000-0000-4000-8000-000000000004', 'Cornish College of the Arts', 'cornish-college-of-the-arts'),
  ('10000000-0000-4000-8000-000000000005', 'North Seattle College', 'north-seattle-college')
on conflict (id) do nothing;

insert into public.university_domains (university_id, domain, is_development) values
  ('10000000-0000-4000-8000-000000000001', 'uw.edu', false),
  ('10000000-0000-4000-8000-000000000001', 'spark.test', true),
  ('10000000-0000-4000-8000-000000000002', 'seattleu.edu', false),
  ('10000000-0000-4000-8000-000000000003', 'bellevuecollege.edu', false),
  ('10000000-0000-4000-8000-000000000004', 'cornish.edu', false),
  ('10000000-0000-4000-8000-000000000005', 'seattlecolleges.edu', false)
on conflict (domain) do nothing;

insert into public.skills (id, name, category) values
  ('20000000-0000-4000-8000-000000000001', 'Photography', 'Creative'),
  ('20000000-0000-4000-8000-000000000002', 'Python Basics', 'Technology'),
  ('20000000-0000-4000-8000-000000000003', 'Resume Design', 'Career'),
  ('20000000-0000-4000-8000-000000000004', 'Baking', 'Food'),
  ('20000000-0000-4000-8000-000000000005', 'Guitar', 'Music'),
  ('20000000-0000-4000-8000-000000000006', 'Japanese', 'Language'),
  ('20000000-0000-4000-8000-000000000007', 'Tennis', 'Wellness'),
  ('20000000-0000-4000-8000-000000000008', 'Video Editing', 'Creative'),
  ('20000000-0000-4000-8000-000000000009', 'Excel', 'Technology'),
  ('20000000-0000-4000-8000-000000000010', 'Public Speaking', 'Communication'),
  ('20000000-0000-4000-8000-000000000011', 'Illustration', 'Creative'),
  ('20000000-0000-4000-8000-000000000012', 'Fitness', 'Wellness'),
  ('20000000-0000-4000-8000-000000000013', 'Photoshop', 'Creative'),
  ('20000000-0000-4000-8000-000000000014', 'Lightroom', 'Creative'),
  ('20000000-0000-4000-8000-000000000015', 'Meal Planning', 'Food'),
  ('20000000-0000-4000-8000-000000000016', 'Motion Graphics', 'Creative')
on conflict (id) do nothing;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'anita@spark.test', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Anita"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'maya@spark.test', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Maya Chen"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'jordan@seattleu.edu', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Jordan Bell"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'sofia@uw.edu', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Sofia Ramirez"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'ethan@bellevuecollege.edu', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Ethan Park"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'aiko@uw.edu', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Aiko Tanaka"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'marcus@seattleu.edu', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Marcus Green"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000008', 'authenticated', 'authenticated', 'nora@cornish.edu', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Nora Ellis"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000009', 'authenticated', 'authenticated', 'leo@seattlecolleges.edu', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Leo Martinez"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000010', 'authenticated', 'authenticated', 'moderator@spark.test', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Morgan Lee"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'institution-admin@spark.test', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Taylor Brooks"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'admin@spark.test', extensions.crypt('SparkLocal!2026', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Alex Rivera"}', now(), now())
on conflict (id) do nothing;

update auth.users
set confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    phone_change = '',
    phone_change_token = '',
    email_change_token_current = '',
    reauthentication_token = ''
where id between '30000000-0000-4000-8000-000000000001' and '30000000-0000-4000-8000-000000000012';

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id,
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.id between '30000000-0000-4000-8000-000000000001' and '30000000-0000-4000-8000-000000000012'
on conflict (provider_id, provider) do nothing;

insert into public.user_roles (user_id, role, assigned_by) values
  ('30000000-0000-4000-8000-000000000010', 'moderator', '30000000-0000-4000-8000-000000000012'),
  ('30000000-0000-4000-8000-000000000011', 'institution_admin', '30000000-0000-4000-8000-000000000012'),
  ('30000000-0000-4000-8000-000000000012', 'platform_admin', '30000000-0000-4000-8000-000000000012')
on conflict do nothing;

insert into public.institution_admin_assignments (user_id, university_id, assigned_by) values (
  '30000000-0000-4000-8000-000000000011',
  '10000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000012'
)
on conflict do nothing;

update public.profiles set
  slug = 'anita',
  display_name = 'Anita',
  initials = 'A',
  avatar_color = 'coral',
  major = 'Information Systems',
  biography = 'I enjoy making ideas easier to understand through thoughtful design and small, useful technical projects.',
  availability_summary = 'Weekday evenings and Saturday mornings',
  availability_slots = '["Weekday evenings", "Saturday mornings"]',
  meeting_preference = 'either',
  beginner_friendly = true,
  learning_style = 'Friendly, structured, and collaborative',
  experience_tags = array['Design-minded', 'Patient', 'Project-based'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000001';

update public.profiles set
  slug = 'maya-chen',
  display_name = 'Maya Chen',
  initials = 'MC',
  avatar_color = 'coral',
  major = 'Visual Communication Design',
  biography = 'I love helping people make thoughtful images without getting lost in camera settings. I am happiest on neighborhood photo walks.',
  availability_summary = 'Weekday afternoons',
  availability_slots = '["Tuesday after 3 PM", "Thursday after 2 PM"]',
  meeting_preference = 'either',
  beginner_friendly = true,
  learning_style = 'Patient, practical, and project-based',
  experience_tags = array['3 years shooting', 'Visual learner', 'Photo walks'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000002';

update public.profiles set
  slug = 'jordan-bell',
  display_name = 'Jordan Bell',
  initials = 'JB',
  avatar_color = 'indigo',
  major = 'Computer Science',
  biography = 'I make programming feel less mysterious through tiny experiments and clear explanations. No prior coding experience is needed.',
  availability_summary = 'Evenings and Sunday mornings',
  availability_slots = '["Wednesday after 6 PM", "Sunday before noon"]',
  meeting_preference = 'online',
  beginner_friendly = true,
  learning_style = 'Small steps, live examples, and lots of questions',
  experience_tags = array['Peer tutor', 'Beginner-first', 'Problem solver'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000003';

update public.profiles set
  slug = 'sofia-ramirez',
  display_name = 'Sofia Ramirez',
  initials = 'SR',
  avatar_color = 'gold',
  major = 'Food Systems',
  biography = 'Weekend baker, recipe tinkerer, and believer that a slightly messy first loaf still counts as a very good afternoon.',
  availability_summary = 'Saturday afternoons',
  availability_slots = '["Saturday 1–5 PM"]',
  meeting_preference = 'in-person',
  beginner_friendly = true,
  learning_style = 'Hands-on, relaxed, and encouraging',
  experience_tags = array['Home baker', 'Hands-on', 'Recipe swaps'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000004';

update public.profiles set
  slug = 'ethan-park',
  display_name = 'Ethan Park',
  initials = 'EP',
  avatar_color = 'sage',
  major = 'Digital Media Arts',
  biography = 'I edit short films and social videos, with a focus on pacing and story. I can help you finish the project sitting in your camera roll.',
  availability_summary = 'Friday evenings',
  availability_slots = '["Friday after 5 PM"]',
  meeting_preference = 'either',
  beginner_friendly = false,
  learning_style = 'Collaborative critique with a clear final outcome',
  experience_tags = array['Premiere Pro', 'Storytelling', 'Portfolio review'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000005';

update public.profiles set
  slug = 'aiko-tanaka',
  display_name = 'Aiko Tanaka',
  initials = 'AT',
  avatar_color = 'rose',
  major = 'International Studies',
  biography = 'I enjoy friendly language exchange built around real conversation, useful phrases, and the occasional excellent snack recommendation.',
  availability_summary = 'Monday and Thursday evenings',
  availability_slots = '["Monday after 6 PM", "Thursday after 6 PM"]',
  meeting_preference = 'online',
  beginner_friendly = true,
  learning_style = 'Conversation-led with simple take-home practice',
  experience_tags = array['Native speaker', 'Conversation', 'Cultural exchange'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000006';

update public.profiles set
  slug = 'marcus-green',
  display_name = 'Marcus Green',
  initials = 'MG',
  avatar_color = 'blue',
  major = 'Kinesiology',
  biography = 'I teach movement in a low-pressure way. Whether it is your first tennis rally or a new gym routine, we will start where you are.',
  availability_summary = 'Weekday mornings and weekends',
  availability_slots = '["Tuesday morning", "Sunday afternoon"]',
  meeting_preference = 'in-person',
  beginner_friendly = true,
  learning_style = 'Supportive coaching with adaptable goals',
  experience_tags = array['First aid trained', 'Beginner-friendly', 'Outdoor sessions'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000007';

update public.profiles set
  slug = 'nora-ellis',
  display_name = 'Nora Ellis',
  initials = 'NE',
  avatar_color = 'purple',
  major = 'Illustration',
  biography = 'I help new illustrators loosen up, find visual references, and turn a rough idea into a finished piece they recognize as their own.',
  availability_summary = 'Wednesday afternoons',
  availability_slots = '["Wednesday 1–5 PM"]',
  meeting_preference = 'either',
  beginner_friendly = true,
  learning_style = 'Playful prompts, demonstrations, and kind critique',
  experience_tags = array['Digital art', 'Sketchbooks', 'Creative confidence'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000008';

update public.profiles set
  slug = 'leo-martinez',
  display_name = 'Leo Martinez',
  initials = 'LM',
  avatar_color = 'orange',
  major = 'Business Administration',
  biography = 'I have played guitar for seven years and enjoy teaching songs people genuinely want to play. I also love making spreadsheets behave.',
  availability_summary = 'Tuesday evenings and Sundays',
  availability_slots = '["Tuesday after 6 PM", "Sunday afternoon"]',
  meeting_preference = 'either',
  beginner_friendly = false,
  learning_style = 'Goal-oriented sessions built around your interests',
  experience_tags = array['7 years playing', 'Acoustic guitar', 'Practical Excel'],
  discoverable = true,
  show_location = true,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000009';

update public.profiles set
  slug = 'morgan-lee',
  display_name = 'Morgan Lee',
  initials = 'ML',
  avatar_color = 'indigo',
  major = 'Student Affairs',
  biography = 'I support the local Spark pilot and review safety concerns with care and discretion.',
  availability_summary = 'Weekday business hours',
  availability_slots = '["Weekday business hours"]',
  meeting_preference = 'online',
  beginner_friendly = true,
  learning_style = 'Clear, respectful, and process-focused',
  experience_tags = array['Moderator', 'Student support'],
  discoverable = false,
  show_location = false,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000010';

update public.profiles set
  slug = 'taylor-brooks',
  display_name = 'Taylor Brooks',
  initials = 'TB',
  avatar_color = 'sage',
  major = 'University Administration',
  biography = 'I maintain institution eligibility settings for the local university pilot environment.',
  availability_summary = 'Weekday business hours',
  availability_slots = '["Weekday business hours"]',
  meeting_preference = 'online',
  beginner_friendly = true,
  learning_style = 'Organized, practical, and policy-aware',
  experience_tags = array['Institution administrator'],
  discoverable = false,
  show_location = false,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000011';

update public.profiles set
  slug = 'alex-rivera',
  display_name = 'Alex Rivera',
  initials = 'AR',
  avatar_color = 'purple',
  major = 'Platform Operations',
  biography = 'I maintain trusted operational access for the local Spark pilot and its institutions.',
  availability_summary = 'Weekday business hours',
  availability_slots = '["Weekday business hours"]',
  meeting_preference = 'online',
  beginner_friendly = true,
  learning_style = 'Structured, careful, and evidence-based',
  experience_tags = array['Platform administrator'],
  discoverable = false,
  show_location = false,
  onboarding_completed = false
where id = '30000000-0000-4000-8000-000000000012';

insert into public.profile_locations (profile_id, general_location) values
  ('30000000-0000-4000-8000-000000000001', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000002', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000003', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000004', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000005', 'Bellevue, WA'),
  ('30000000-0000-4000-8000-000000000006', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000007', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000008', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000009', 'Shoreline, WA'),
  ('30000000-0000-4000-8000-000000000010', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000011', 'Seattle, WA'),
  ('30000000-0000-4000-8000-000000000012', 'Seattle, WA')
on conflict (profile_id) do update set general_location = excluded.general_location;

insert into public.profile_skills (profile_id, skill_id, mode) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000013', 'teach'),
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'teach'),
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'teach'),
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000007', 'learn'),
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'learn'),
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000006', 'learn'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'teach'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000014', 'teach'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 'teach'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000006', 'learn'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 'learn'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'teach'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000009', 'teach'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005', 'learn'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000010', 'learn'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'teach'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000015', 'teach'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'learn'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000012', 'learn'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000008', 'teach'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000016', 'teach'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000007', 'learn'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000006', 'learn'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000006', 'teach'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000010', 'teach'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', 'learn'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000011', 'learn'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000007', 'teach'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000012', 'teach'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000009', 'learn'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000004', 'learn'),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000011', 'teach'),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000013', 'teach'),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000005', 'learn'),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000008', 'learn'),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000005', 'teach'),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000009', 'teach'),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000003', 'learn'),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000001', 'learn'),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000010', 'teach'),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000009', 'learn'),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000009', 'teach'),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000010', 'learn'),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000002', 'teach'),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000011', 'learn')
on conflict do nothing;

update public.profiles
set onboarding_completed = true
where id between '30000000-0000-4000-8000-000000000001' and '30000000-0000-4000-8000-000000000012';

insert into public.learning_requests (
  id, sender_id, recipient_id, requested_skill_id, offered_skill_id, message, preferred_at, format
) values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'I would love help understanding natural-light portraits and choosing a few camera settings to practice.',
    now() + interval '12 days',
    'in-person'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'Could you help me make my internship resume clearer and easier to scan?',
    now() + interval '8 days',
    'online'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000013',
    'I would like to practice everyday introductions and learn how to keep studying between sessions.',
    now() + interval '5 days',
    'online'
  );

update public.learning_requests
set status = 'accepted'
where id = '40000000-0000-4000-8000-000000000002';

update public.learning_requests
set status = 'accepted'
where id = '40000000-0000-4000-8000-000000000003';

update public.learning_requests
set status = 'completed'
where id = '40000000-0000-4000-8000-000000000003';

insert into public.session_feedback (
  request_id, user_id, helpful, comfortable_and_respected, learn_together_again, private_note
) values (
  '40000000-0000-4000-8000-000000000003',
  '30000000-0000-4000-8000-000000000001',
  true,
  true,
  true,
  'The conversation prompts made it easy to practice without feeling put on the spot.'
);
