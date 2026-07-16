alter table public.attendance_entries
add column if not exists attendance_status text not null default 'present',
add column if not exists notes text,
add column if not exists recorded_by uuid references auth.users(id) on delete set null,
add column if not exists updated_at timestamptz not null default now();

alter table public.attendance_entries
drop constraint if exists attendance_entries_status_check;

alter table public.attendance_entries
add constraint attendance_entries_status_check
check (
  attendance_status in (
    'present',
    'absent',
    'half_day',
    'paid_leave',
    'unpaid_leave',
    'holiday',
    'weekly_off'
  )
);

create index if not exists idx_attendance_entries_org_date
on public.attendance_entries(organization_id, work_date);

create index if not exists idx_attendance_entries_recorded_by
on public.attendance_entries(recorded_by)
where recorded_by is not null;

create table if not exists public.attendance_month_locks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_month date not null,
  locked_by uuid references auth.users(id) on delete set null,
  locked_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  unique (organization_id, period_month),
  check (period_month = date_trunc('month', period_month)::date)
);

alter table public.attendance_month_locks enable row level security;

grant select on table public.attendance_month_locks to authenticated;
grant all privileges on table public.attendance_month_locks to service_role;

create index if not exists idx_attendance_month_locks_org_month
on public.attendance_month_locks(organization_id, period_month desc);

drop policy if exists "attendance_month_locks_select_member" on public.attendance_month_locks;

create policy "attendance_month_locks_select_member"
on public.attendance_month_locks
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create or replace function public.prevent_locked_attendance_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_organization_id uuid;
  target_work_date date;
begin
  if tg_table_name = 'attendance_entries' then
    target_organization_id := coalesce(new.organization_id, old.organization_id);
    target_work_date := coalesce(new.work_date, old.work_date);
  elsif tg_table_name = 'holidays' then
    target_organization_id := coalesce(new.organization_id, old.organization_id);
    target_work_date := coalesce(new.holiday_date, old.holiday_date);
  else
    return new;
  end if;

  if exists (
    select 1
    from public.attendance_month_locks
    where attendance_month_locks.organization_id = target_organization_id
      and attendance_month_locks.period_month = date_trunc('month', target_work_date)::date
  ) then
    raise exception 'Attendance period % is locked', date_trunc('month', target_work_date)::date
      using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_locked_attendance_changes() from public;
revoke execute on function public.prevent_locked_attendance_changes() from anon;
revoke execute on function public.prevent_locked_attendance_changes() from authenticated;

drop trigger if exists attendance_entries_prevent_locked_changes on public.attendance_entries;
create trigger attendance_entries_prevent_locked_changes
before insert or update or delete on public.attendance_entries
for each row execute function public.prevent_locked_attendance_changes();

drop trigger if exists holidays_prevent_locked_changes on public.holidays;
create trigger holidays_prevent_locked_changes
before insert or update or delete on public.holidays
for each row execute function public.prevent_locked_attendance_changes();

drop policy if exists "attendance_entries_select_ops_team_or_self" on public.attendance_entries;

create policy "attendance_entries_select_ops_team_or_self"
on public.attendance_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.employees
    where employees.id = attendance_entries.employee_id
      and employees.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.employees
    where employees.id = attendance_entries.employee_id
      and employees.manager_profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.organization_id = attendance_entries.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role
      )
  )
);

insert into public.holidays (organization_id, holiday_date, name, region)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  seeded.holiday_date::date,
  seeded.name,
  'IN'
from (
  values
    ('2026-01-26', 'Republic Day'),
    ('2026-08-15', 'Independence Day'),
    ('2026-10-02', 'Gandhi Jayanti')
) as seeded(holiday_date, name)
where exists (
  select 1
  from public.organizations
  where organizations.id = '00000000-0000-0000-0000-000000000001'::uuid
)
on conflict (organization_id, holiday_date)
do update set
  name = excluded.name,
  region = excluded.region;
