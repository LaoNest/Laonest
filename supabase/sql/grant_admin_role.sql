-- ============================================
-- One-off: grant the ADMIN role to your account
-- Run AFTER 003_admin_logs.sql
-- ============================================

insert into public.user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p, public.roles r
where p.full_name = 'Vixaty'
  and r.name = 'admin'
on conflict (user_id, role_id) do nothing;

-- Verify: you should now have 3 rows (tenant, owner, admin)
select p.full_name, r.name as role
from public.user_roles ur
join public.profiles p on p.id = ur.user_id
join public.roles r on r.id = ur.role_id
order by r.name;
