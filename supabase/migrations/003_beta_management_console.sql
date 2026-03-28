create table if not exists public.beta_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by_email text not null,
  is_active boolean not null default true,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  used_by_user_id uuid references auth.users(id) on delete set null,
  used_by_email text,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.beta_user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  route text,
  tab_name text,
  action_name text,
  invite_code_id uuid references public.beta_invite_codes(id) on delete set null,
  client_session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_beta_user_events_created_at
  on public.beta_user_events (created_at desc);
create index if not exists idx_beta_user_events_user_id
  on public.beta_user_events (user_id, created_at desc);
create index if not exists idx_beta_user_events_event_name
  on public.beta_user_events (event_name, created_at desc);

alter table public.beta_invite_codes enable row level security;
alter table public.beta_user_events enable row level security;

create policy "No direct reads on beta invite codes"
  on public.beta_invite_codes for select using (false);
create policy "No direct reads on beta user events"
  on public.beta_user_events for select using (false);

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_emails
    where email = auth.jwt()->>'email'
  );
$$;

create or replace function public.create_beta_invite_code(
  expires_in_days integer default null,
  max_uses integer default 1
)
returns public.beta_invite_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  new_row public.beta_invite_codes;
begin
  if not public.is_current_user_admin() then
    raise exception 'not authorized';
  end if;

  new_code := upper(substr(md5(gen_random_uuid()::text), 1, 10));

  insert into public.beta_invite_codes (
    code,
    created_by_email,
    max_uses,
    expires_at
  )
  values (
    new_code,
    coalesce(auth.jwt()->>'email', 'unknown'),
    case when max_uses is not null and max_uses > 0 then max_uses else null end,
    case when expires_in_days is not null and expires_in_days > 0 then now() + make_interval(days => expires_in_days) else null end
  )
  returning * into new_row;

  return new_row;
end;
$$;

create or replace function public.validate_beta_invite_code(candidate_code text)
returns table (
  id uuid,
  code text,
  is_valid boolean,
  reason text
)
language sql
security definer
set search_path = public
as $$
  with matched as (
    select *
    from public.beta_invite_codes
    where upper(code) = upper(trim(candidate_code))
    limit 1
  )
  select
    matched.id,
    matched.code,
    case
      when matched.id is null then false
      when not matched.is_active then false
      when matched.expires_at is not null and matched.expires_at < now() then false
      when matched.max_uses is not null and matched.used_count >= matched.max_uses then false
      else true
    end as is_valid,
    case
      when matched.id is null then 'invalid_code'
      when not matched.is_active then 'inactive_code'
      when matched.expires_at is not null and matched.expires_at < now() then 'expired_code'
      when matched.max_uses is not null and matched.used_count >= matched.max_uses then 'code_already_used'
      else 'valid'
    end as reason
  from matched
  right join (select 1) as fallback on true;
$$;

create or replace function public.consume_beta_invite_code(
  invite_code_id uuid,
  signup_user_id uuid,
  signup_email text
)
returns public.beta_invite_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.beta_invite_codes;
begin
  update public.beta_invite_codes
  set
    used_count = used_count + 1,
    used_by_user_id = signup_user_id,
    used_by_email = signup_email,
    used_at = now(),
    is_active = case
      when max_uses is not null and used_count + 1 >= max_uses then false
      else is_active
    end
  where id = invite_code_id
    and is_active = true
    and (expires_at is null or expires_at >= now())
    and (max_uses is null or used_count < max_uses)
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'invite code unavailable';
  end if;

  return updated_row;
end;
$$;

create or replace function public.track_beta_event(
  p_event_name text,
  p_route text default null,
  p_tab_name text default null,
  p_action_name text default null,
  p_invite_code_id uuid default null,
  p_client_session_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
  current_user_id uuid;
begin
  if p_event_name not in (
    'page_view',
    'tab_view',
    'button_click',
    'signup_started',
    'signup_succeeded',
    'signup_failed',
    'diary_record_started',
    'diary_processed',
    'today_viewed',
    'insights_viewed',
    'action_plans_viewed',
    'scripture_viewed'
  ) then
    raise exception 'unsupported event';
  end if;

  current_user_id := auth.uid();

  insert into public.beta_user_events (
    user_id,
    event_name,
    route,
    tab_name,
    action_name,
    invite_code_id,
    client_session_id,
    metadata
  )
  values (
    current_user_id,
    p_event_name,
    p_route,
    p_tab_name,
    p_action_name,
    p_invite_code_id,
    p_client_session_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into event_id;

  return event_id;
end;
$$;

create or replace function public.get_beta_console_overview()
returns table (
  total_testers bigint,
  active_invite_codes bigint,
  top_page text,
  top_page_views bigint,
  top_action text,
  top_action_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from auth.users)::bigint as total_testers,
    (select count(*) from public.beta_invite_codes where is_active = true and (expires_at is null or expires_at >= now()))::bigint as active_invite_codes,
    (select route from public.beta_user_events where event_name = 'page_view' and route is not null group by route order by count(*) desc, route asc limit 1) as top_page,
    (select count(*) from public.beta_user_events where event_name = 'page_view' and route = (select route from public.beta_user_events where event_name = 'page_view' and route is not null group by route order by count(*) desc, route asc limit 1))::bigint as top_page_views,
    (select action_name from public.beta_user_events where action_name is not null group by action_name order by count(*) desc, action_name asc limit 1) as top_action,
    (select count(*) from public.beta_user_events where action_name = (select action_name from public.beta_user_events where action_name is not null group by action_name order by count(*) desc, action_name asc limit 1))::bigint as top_action_count
  where public.is_current_user_admin();
$$;

create or replace function public.get_beta_top_routes_and_actions()
returns table (
  kind text,
  label text,
  total bigint
)
language sql
security definer
set search_path = public
as $$
  select * from (
    select 'route'::text as kind, route as label, count(*)::bigint as total
    from public.beta_user_events
    where public.is_current_user_admin() and event_name = 'page_view' and route is not null
    group by route
    union all
    select 'action'::text as kind, action_name as label, count(*)::bigint as total
    from public.beta_user_events
    where public.is_current_user_admin() and action_name is not null
    group by action_name
  ) ranked
  order by total desc, label asc;
$$;

create or replace function public.get_beta_user_activity()
returns table (
  user_id uuid,
  email text,
  first_seen timestamptz,
  last_seen timestamptz,
  total_events bigint,
  total_sessions bigint,
  last_route text
)
language sql
security definer
set search_path = public
as $$
  select
    au.id as user_id,
    au.email::text,
    min(e.created_at) as first_seen,
    max(e.created_at) as last_seen,
    count(e.id)::bigint as total_events,
    count(distinct cs.id)::bigint as total_sessions,
    (
      select e2.route
      from public.beta_user_events e2
      where e2.user_id = au.id and e2.route is not null
      order by e2.created_at desc
      limit 1
    ) as last_route
  from auth.users au
  left join public.beta_user_events e on e.user_id = au.id
  left join public.coach_sessions cs on cs.user_id = au.id and cs.deleted_at is null
  where public.is_current_user_admin()
  group by au.id, au.email
  order by max(e.created_at) desc nulls last, au.created_at desc;
$$;

create or replace function public.get_beta_recent_activity()
returns table (
  id uuid,
  user_id uuid,
  email text,
  event_name text,
  route text,
  tab_name text,
  action_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    e.id,
    e.user_id,
    au.email::text,
    e.event_name,
    e.route,
    e.tab_name,
    e.action_name,
    e.created_at
  from public.beta_user_events e
  left join auth.users au on au.id = e.user_id
  where public.is_current_user_admin()
  order by e.created_at desc
  limit 100;
$$;

create or replace function public.get_beta_invite_codes()
returns table (
  id uuid,
  code text,
  is_active boolean,
  max_uses integer,
  used_count integer,
  expires_at timestamptz,
  used_by_email text,
  used_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    bic.id,
    bic.code,
    bic.is_active,
    bic.max_uses,
    bic.used_count,
    bic.expires_at,
    bic.used_by_email,
    bic.used_at,
    bic.created_at
  from public.beta_invite_codes bic
  where public.is_current_user_admin()
  order by bic.created_at desc;
$$;
