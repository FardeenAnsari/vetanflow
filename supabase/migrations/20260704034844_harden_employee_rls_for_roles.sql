alter table public.employees
add column if not exists profile_id uuid references public.profiles(id) on delete set null;

create unique index if not exists idx_employees_profile_id
on public.employees(profile_id)
where profile_id is not null;

drop policy if exists "employees_select_member" on public.employees;
drop policy if exists "attendance_entries_select_member" on public.attendance_entries;
drop policy if exists "leave_requests_select_member" on public.leave_requests;
drop policy if exists "payroll_runs_select_member" on public.payroll_runs;
drop policy if exists "payroll_run_lines_select_member" on public.payroll_run_lines;
drop policy if exists "payslips_select_member" on public.payslips;
drop policy if exists "audit_logs_select_member" on public.audit_logs;

create policy "employees_select_payroll_team_or_self"
on public.employees
for select
to authenticated
using (
  profile_id = (select auth.uid())
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
    from public.user_roles
    where user_roles.organization_id = attendance_entries.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role,
        'manager'::public.app_role
      )
  )
);

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
        'hr'::public.app_role,
        'finance'::public.app_role,
        'manager'::public.app_role
      )
  )
);

create policy "payroll_runs_select_payroll_team"
on public.payroll_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_roles.organization_id = payroll_runs.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role
      )
  )
);

create policy "payroll_run_lines_select_payroll_team_or_self"
on public.payroll_run_lines
for select
to authenticated
using (
  exists (
    select 1
    from public.employees
    where employees.id = payroll_run_lines.employee_id
      and employees.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.payroll_runs
    join public.user_roles on user_roles.organization_id = payroll_runs.organization_id
    where payroll_runs.id = payroll_run_lines.payroll_run_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role
      )
  )
);

create policy "payslips_select_payroll_team_or_self"
on public.payslips
for select
to authenticated
using (
  exists (
    select 1
    from public.payroll_run_lines
    join public.employees on employees.id = payroll_run_lines.employee_id
    where payroll_run_lines.id = payslips.payroll_run_line_id
      and employees.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.payroll_run_lines
    join public.payroll_runs on payroll_runs.id = payroll_run_lines.payroll_run_id
    join public.user_roles on user_roles.organization_id = payroll_runs.organization_id
    where payroll_run_lines.id = payslips.payroll_run_line_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role
      )
  )
);

create policy "audit_logs_select_admin_team"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_roles.organization_id = audit_logs.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role
      )
  )
);
