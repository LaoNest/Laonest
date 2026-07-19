-- ============================================
-- LaoNest Migration 001: Roles & Profiles
-- Creates: roles, profiles, user_roles
-- Plus: is_admin() helper, auto-profile trigger, RLS
-- ============================================

-- 1. Roles table
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.roles (name) values
  ('tenant'),
  ('owner'),
  ('admin'),
  ('corporate');

-- 2. Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'lo', 'zh')),
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. User roles (many-to-many)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

-- 4. Admin check helper (used by many future RLS policies)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = 'admin'
  );
$$;

-- 5. Auto-create profile + tenant role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.user_roles (user_id, role_id)
  select new.id, r.id from public.roles r where r.name = 'tenant';

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Row Level Security
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Roles: readable by everyone (it's just the role names)
create policy "roles_select_all"
  on public.roles for select
  using (true);

-- Profiles: users read/update their own; admins read all
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- User roles: users see their own roles; admins see and manage all
create policy "user_roles_select_own_or_admin"
  on public.user_roles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "user_roles_admin_insert"
  on public.user_roles for insert
  with check (public.is_admin());

create policy "user_roles_admin_delete"
  on public.user_roles for delete
  using (public.is_admin());