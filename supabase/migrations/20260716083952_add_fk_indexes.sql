create index if not exists idx_attendance_month_locks_locked_by
on public.attendance_month_locks(locked_by)
where locked_by is not null;

create index if not exists idx_leave_requests_escalated_by
on public.leave_requests(escalated_by)
where escalated_by is not null;

create index if not exists idx_payroll_adjustments_employee_id
on public.payroll_adjustments(employee_id);
