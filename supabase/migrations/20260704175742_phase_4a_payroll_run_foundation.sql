alter table public.payroll_runs
add column if not exists attendance_month_lock_id uuid references public.attendance_month_locks(id) on delete restrict,
add column if not exists updated_at timestamptz not null default now();

alter table public.payroll_run_lines
add column if not exists updated_at timestamptz not null default now();

grant select on table
  public.payroll_runs,
  public.payroll_run_lines
to authenticated;

grant all privileges on table
  public.payroll_runs,
  public.payroll_run_lines
to service_role;

create index if not exists idx_payroll_runs_attendance_month_lock_id
on public.payroll_runs(attendance_month_lock_id)
where attendance_month_lock_id is not null;

create index if not exists idx_payroll_runs_org_status_period
on public.payroll_runs(organization_id, status, period_start desc);

create index if not exists idx_payroll_run_lines_run_employee
on public.payroll_run_lines(payroll_run_id, employee_id);
