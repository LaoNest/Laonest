-- ============================================
-- LaoNest Migration 003: Admin Logs
-- Audit trail for admin actions (insert-only)
-- ============================================

create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_logs enable row level security;

-- Admins can read the log
create policy "admin_logs_select_admin"
  on public.admin_logs for select
  using (public.is_admin());

-- Admins can insert their own log entries
create policy "admin_logs_insert_admin"
  on public.admin_logs for insert
  with check (public.is_admin() and admin_id = auth.uid());

-- No update or delete policies on purpose: the audit trail is append-only.
