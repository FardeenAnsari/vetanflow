revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

create index if not exists idx_attendance_entries_organization_id
on public.attendance_entries(organization_id);

create index if not exists idx_audit_logs_actor_id
on public.audit_logs(actor_id);

create index if not exists idx_employees_department_id
on public.employees(department_id);

create index if not exists idx_leave_requests_organization_id
on public.leave_requests(organization_id);

create index if not exists idx_payroll_run_lines_employee_id
on public.payroll_run_lines(employee_id);

create index if not exists idx_payroll_runs_approved_by
on public.payroll_runs(approved_by);

create index if not exists idx_payroll_runs_created_by
on public.payroll_runs(created_by);

create index if not exists idx_payslips_payroll_run_line_id
on public.payslips(payroll_run_line_id);
