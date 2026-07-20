-- ============================================
-- LaoNest Migration 002: Properties
-- Creates: properties, property_images, property_facilities,
--          property_costs, property_translations
-- Plus: RLS for all
-- ============================================

-- 1. Properties (core listing record)
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  property_type text not null check (property_type in (
    'apartment', 'flat', 'house', 'villa', 'studio', 'room',
    'office', 'shophouse', 'commercial', 'warehouse'
  )),
  status text not null default 'draft' check (status in (
    'draft', 'pending', 'active', 'rented', 'hidden', 'rejected'
  )),
  district text not null,
  village text,
  address_note text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  bedrooms int not null default 0,
  bathrooms int not null default 0,
  area_sqm numeric(8,2),
  monthly_rent numeric(14,2) not null,
  deposit_amount numeric(14,2) not null default 0,
  currency text not null default 'LAK' check (currency in ('LAK', 'USD')),
  available_from date,
  is_verified boolean not null default false,
  is_certified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Property images
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Property facilities (stored as keys, translated in language files)
create table public.property_facilities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  facility_key text not null,
  unique (property_id, facility_key)
);

-- 4. Transparent pricing lines
create table public.property_costs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  cost_type text not null check (cost_type in (
    'electricity', 'water', 'internet', 'parking', 'other'
  )),
  amount numeric(14,2),
  unit text not null default 'per_month' check (unit in (
    'per_month', 'per_unit', 'one_time'
  )),
  note text,
  created_at timestamptz not null default now()
);

-- 5. Multilingual content
create table public.property_translations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  language_code text not null check (language_code in ('en', 'lo', 'zh')),
  title text not null,
  description text,
  location_note text,
  unique (property_id, language_code)
);

-- ============================================
-- Row Level Security
-- ============================================

alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_facilities enable row level security;
alter table public.property_costs enable row level security;
alter table public.property_translations enable row level security;

-- Properties: public sees active; owner sees + manages own; admin sees all
create policy "properties_select_public_or_own_or_admin"
  on public.properties for select
  using (status = 'active' or owner_id = auth.uid() or public.is_admin());

create policy "properties_insert_own"
  on public.properties for insert
  with check (owner_id = auth.uid());

create policy "properties_update_own_or_admin"
  on public.properties for update
  using (owner_id = auth.uid() or public.is_admin());

create policy "properties_delete_own_or_admin"
  on public.properties for delete
  using (owner_id = auth.uid() or public.is_admin());

-- Child tables follow the parent property's visibility.
-- Helper: can the current user see this property?
create or replace function public.can_view_property(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.properties p
    where p.id = p_id
      and (p.status = 'active' or p.owner_id = auth.uid() or public.is_admin())
  );
$$;

-- Helper: does the current user own this property?
create or replace function public.owns_property(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.properties p
    where p.id = p_id
      and (p.owner_id = auth.uid() or public.is_admin())
  );
$$;

-- Images
create policy "property_images_select" on public.property_images
  for select using (public.can_view_property(property_id));
create policy "property_images_insert" on public.property_images
  for insert with check (public.owns_property(property_id));
create policy "property_images_update" on public.property_images
  for update using (public.owns_property(property_id));
create policy "property_images_delete" on public.property_images
  for delete using (public.owns_property(property_id));

-- Facilities
create policy "property_facilities_select" on public.property_facilities
  for select using (public.can_view_property(property_id));
create policy "property_facilities_insert" on public.property_facilities
  for insert with check (public.owns_property(property_id));
create policy "property_facilities_delete" on public.property_facilities
  for delete using (public.owns_property(property_id));

-- Costs
create policy "property_costs_select" on public.property_costs
  for select using (public.can_view_property(property_id));
create policy "property_costs_insert" on public.property_costs
  for insert with check (public.owns_property(property_id));
create policy "property_costs_update" on public.property_costs
  for update using (public.owns_property(property_id));
create policy "property_costs_delete" on public.property_costs
  for delete using (public.owns_property(property_id));

-- Translations
create policy "property_translations_select" on public.property_translations
  for select using (public.can_view_property(property_id));
create policy "property_translations_insert" on public.property_translations
  for insert with check (public.owns_property(property_id));
create policy "property_translations_update" on public.property_translations
  for update using (public.owns_property(property_id));
create policy "property_translations_delete" on public.property_translations
  for delete using (public.owns_property(property_id));