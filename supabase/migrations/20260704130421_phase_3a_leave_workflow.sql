alter table public.employees
add column if not exists manager_employee_id uuid references public.employees(id) on delete set null,
add column if not exists manager_profile_id uuid references public.profiles(id) on delete set null;

alter table public.leave_requests
add column if not exists reason text not null default '',
add column if not exists requested_by uuid references auth.users(id) on delete set null,
add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
add column if not exists reviewed_at timestamptz,
add column if not exists decision_note text,
add column if not exists approval_stage text not null default 'manager',
add column if not exists escalated_by uuid references auth.users(id) on delete set null,
add column if not exists escalated_at timestamptz,
add column if not exists updated_at timestamptz not null default now();

alter table public.leave_requests
drop constraint if exists leave_requests_approval_stage_check;

alter table public.leave_requests
add constraint leave_requests_approval_stage_check
check (approval_stage in ('manager', 'hr', 'closed'));

create index if not exists idx_employees_manager_employee_id
on public.employees(manager_employee_id)
where manager_employee_id is not null;

create index if not exists idx_employees_manager_profile_id
on public.employees(manager_profile_id)
where manager_profile_id is not null;

create index if not exists idx_leave_requests_status_stage
on public.leave_requests(organization_id, status, approval_stage, created_at desc);

create index if not exists idx_leave_requests_requested_by
on public.leave_requests(requested_by)
where requested_by is not null;

create index if not exists idx_leave_requests_reviewed_by
on public.leave_requests(reviewed_by)
where reviewed_by is not null;

update public.employees as employee
set manager_employee_id = manager.id
from public.employees as manager
where employee.organization_id = '00000000-0000-0000-0000-000000000001'
  and employee.employee_code in ('IND-001', 'IND-002')
  and manager.organization_id = employee.organization_id
  and manager.employee_code = 'IND-003'
  and employee.manager_employee_id is null;

update public.employees as employee
set manager_profile_id = manager.profile_id
from public.employees as manager
where employee.manager_employee_id = manager.id
  and manager.profile_id is not null
  and employee.manager_profile_id is null;

drop policy if exists "employees_select_payroll_team_or_self" on public.employees;

create policy "employees_select_payroll_team_or_self"
on public.employees
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or manager_profile_id = (select auth.uid())
  or exists (
    select 1
    from public.user_roles
    where user_roles.organization_id = employees.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role
      )
  )
);

drop policy if exists "leave_requests_select_ops_team_or_self" on public.leave_requests;

create policy "leave_requests_select_ops_team_or_self"
on public.leave_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.employees
    where employees.id = leave_requests.employee_id
      and employees.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.organization_id = leave_requests.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role
      )
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.organization_id = leave_requests.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role = 'finance'::public.app_role
      and leave_requests.status = 'approved'::public.leave_status
  )
  or exists (
    select 1
    from public.employees
    where employees.id = leave_requests.employee_id
      and employees.manager_profile_id = (select auth.uid())
  )
);
