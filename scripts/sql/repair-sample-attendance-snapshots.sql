-- Reconcile sample attendance metadata only; earnings, deductions, and net pay are unchanged.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '60s';
lock table public.payroll_run_lines in access exclusive mode;
do $$
begin
  if (select count(*) from public.payroll_run_lines l join public.payroll_runs r on r.id = l.payroll_run_id
    where r.organization_id = '00000000-0000-0000-0000-000000000001'
      and r.period_start between '2026-01-01' and '2026-09-01'
      and l.calculation_snapshot #>> '{source,version}' = 'demo_prepare_v1'
      and l.calculation_snapshot #>> '{money,currencyCode}' = 'INR') <> 198 then
    raise exception 'Expected exactly the rebuilt INR sample lines';
  end if;
end $$;
alter table public.payroll_run_lines disable trigger payroll_run_lines_prevent_finalized_changes;
with counts as (
  select l.id,
    sum(case a.attendance_status when 'present' then 1 when 'half_day' then 0.5 else 0 end) as present_days,
    sum(a.payable_hours) / 8 as payable_days
  from public.payroll_run_lines l join public.payroll_runs r on r.id = l.payroll_run_id
  join public.attendance_entries a on a.employee_id = l.employee_id and a.work_date between r.period_start and r.period_end
  where r.organization_id = '00000000-0000-0000-0000-000000000001'
    and r.period_start between '2026-01-01' and '2026-09-01'
  group by l.id
)
update public.payroll_run_lines l set calculation_snapshot =
  jsonb_set(jsonb_set(l.calculation_snapshot, '{attendance,presentDays}', to_jsonb(c.present_days)),
    '{attendance,payableDays}', to_jsonb(c.payable_days))
from counts c where l.id = c.id;
alter table public.payroll_run_lines enable trigger payroll_run_lines_prevent_finalized_changes;
commit;
