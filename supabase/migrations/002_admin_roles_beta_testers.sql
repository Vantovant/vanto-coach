create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;

create policy "No direct reads on admin emails"
  on public.admin_emails for select using (false);

insert into public.admin_emails (email)
values ('vanto@onlinecourseformlm.com')
on conflict (email) do nothing;

create or replace function public.is_admin_email(candidate_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_emails
    where email = candidate_email
  );
$$;

create or replace function public.get_beta_testers_overview()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_sessions bigint,
  first_session_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    count(cs.id) as total_sessions,
    min(cs.created_at) as first_session_at
  from auth.users au
  left join public.coach_sessions cs
    on cs.user_id = au.id
   and cs.deleted_at is null
  where exists (
    select 1
    from public.admin_emails ae
    where ae.email = auth.jwt()->>'email'
  )
  group by au.id, au.email, au.created_at, au.last_sign_in_at
  order by au.created_at desc;
$$;
