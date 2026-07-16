begin;

alter table public.payroll_runs disable trigger payroll_runs_prevent_finalized_changes;
alter table public.payroll_run_lines disable trigger payroll_run_lines_prevent_finalized_changes;
alter table public.payroll_adjustments disable trigger payroll_adjustments_prevent_finalized_changes;
alter table public.attendance_entries disable trigger attendance_entries_prevent_locked_changes;
alter table public.holidays disable trigger holidays_prevent_locked_changes;

delete from public.audit_logs
where organization_id = '00000000-0000-0000-0000-000000000001';

delete from public.payroll_runs
where organization_id = '00000000-0000-0000-0000-000000000001';

delete from public.attendance_month_locks
where organization_id = '00000000-0000-0000-0000-000000000001';

delete from public.attendance_entries
where organization_id = '00000000-0000-0000-0000-000000000001';

delete from public.holidays
where organization_id = '00000000-0000-0000-0000-000000000001';

delete from public.leave_requests
where organization_id = '00000000-0000-0000-0000-000000000001';

delete from public.user_roles
where organization_id = '00000000-0000-0000-0000-000000000001'
  and user_id in (
    select profiles.id
    from public.profiles
    where profiles.email = 'demo.employee@vetanflow.example.com'
       or profiles.email like 'phase5-%@example.test'
       or profiles.full_name like 'Phase Five%'
  );

delete from public.profiles
where email = 'demo.employee@vetanflow.example.com'
   or email like 'phase5-%@example.test'
   or full_name like 'Phase Five%';

delete from public.employees
where organization_id = '00000000-0000-0000-0000-000000000001'
  and (
    employee_code like 'TMP-%'
    or work_email like 'phase5-%@example.test'
    or work_email = 'demo.employee@vetanflow.example.com'
    or full_name like 'Phase Five%'
  );

update public.employees
set status = 'active',
    updated_at = now()
where organization_id = '00000000-0000-0000-0000-000000000001'
  and employee_code in ('IND-001', 'IND-002', 'IND-003');

alter table public.holidays enable trigger holidays_prevent_locked_changes;
alter table public.attendance_entries enable trigger attendance_entries_prevent_locked_changes;
alter table public.payroll_adjustments enable trigger payroll_adjustments_prevent_finalized_changes;
alter table public.payroll_run_lines enable trigger payroll_run_lines_prevent_finalized_changes;
alter table public.payroll_runs enable trigger payroll_runs_prevent_finalized_changes;

commit;

select
  (select count(*) from public.employees where organization_id = '00000000-0000-0000-0000-000000000001') as employees,
  (select count(*) from public.employees where organization_id = '00000000-0000-0000-0000-000000000001' and status = 'active') as active_employees,
  (select count(*) from public.payroll_runs where organization_id = '00000000-0000-0000-0000-000000000001') as payroll_runs,
  (select count(*) from public.attendance_month_locks where organization_id = '00000000-0000-0000-0000-000000000001') as attendance_locks;
