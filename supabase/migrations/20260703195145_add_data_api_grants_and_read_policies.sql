grant usage on schema public to authenticated, service_role;

grant select on table
  public.organizations,
  public.profiles,
  public.user_roles,
  public.departments,
  public.employees,
  public.attendance_entries,
  public.leave_requests,
  public.holidays,
  public.payroll_runs,
  public.payroll_run_lines,
  public.payslips,
  public.audit_logs
to authenticated;

grant all privileges on table
  public.organizations,
  public.profiles,
  public.user_roles,
  public.departments,
  public.employees,
  public.attendance_entries,
  public.leave_requests,
  public.holidays,
  public.payroll_runs,
  public.payroll_run_lines,
  public.payslips,
  public.audit_logs
to service_role;

create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "user_roles_select_self"
on public.user_roles
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "organizations_select_member"
on public.organizations
for select
to authenticated
using (
  id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "departments_select_member"
on public.departments
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "employees_select_member"
on public.employees
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "attendance_entries_select_member"
on public.attendance_entries
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "leave_requests_select_member"
on public.leave_requests
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "holidays_select_member"
on public.holidays
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "payroll_runs_select_member"
on public.payroll_runs
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "payroll_run_lines_select_member"
on public.payroll_run_lines
for select
to authenticated
using (
  exists (
    select 1
    from public.payroll_runs
    join public.profiles on profiles.organization_id = payroll_runs.organization_id
    where payroll_runs.id = payroll_run_lines.payroll_run_id
      and profiles.id = (select auth.uid())
  )
);

create policy "payslips_select_member"
on public.payslips
for select
to authenticated
using (
  exists (
    select 1
    from public.payroll_run_lines
    join public.payroll_runs on payroll_runs.id = payroll_run_lines.payroll_run_id
    join public.profiles on profiles.organization_id = payroll_runs.organization_id
    where payroll_run_lines.id = payslips.payroll_run_line_id
      and profiles.id = (select auth.uid())
  )
);

create policy "audit_logs_select_member"
on public.audit_logs
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);
