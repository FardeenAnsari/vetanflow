do $$
declare
  v_organization uuid := '00000000-0000-0000-0000-000000000001';
begin
  if (select count(*) from public.payroll_runs where organization_id = v_organization and status = 'finalized') <> 9
    or (select count(*) from public.payroll_run_lines l join public.payroll_runs r on r.id = l.payroll_run_id where r.organization_id = v_organization) <> 198 then
    raise exception 'Expected nine finalized sample periods with 22 lines each';
  end if;
  if exists (select 1 from public.payroll_run_lines l join public.payroll_runs r on r.id = l.payroll_run_id
    join public.employees e on e.id = l.employee_id where r.organization_id = v_organization and (
      l.calculation_snapshot #>> '{money,currencyCode}' is distinct from 'INR'
      or l.calculation_snapshot #>> '{money,locale}' is distinct from 'en-IN'
      or l.calculation_snapshot #>> '{employee,name}' is distinct from e.full_name
      or abs(l.net_pay - (l.total_earnings - l.total_deductions)) > 0.01
      or abs(l.gross_pay - (l.calculation_snapshot #>> '{payroll,grossMonthly}')::numeric) > 0.01
      or abs(l.net_pay - (l.calculation_snapshot #>> '{payroll,netPay}')::numeric) > 0.01
      or abs(l.total_earnings - (l.calculation_snapshot #>> '{payroll,totalEarnings}')::numeric) > 0.01
      or abs(l.total_deductions - (l.calculation_snapshot #>> '{payroll,totalDeductions}')::numeric) > 0.01
      or (select count(*) from public.attendance_entries a where a.employee_id = l.employee_id
        and a.work_date between r.period_start and r.period_end) <> (r.period_end - r.period_start + 1)
      or (l.calculation_snapshot #>> '{attendance,presentDays}')::numeric is distinct from
        (select sum(case a.attendance_status when 'present' then 1 when 'half_day' then 0.5 else 0 end)
          from public.attendance_entries a where a.employee_id = l.employee_id and a.work_date between r.period_start and r.period_end)
      or (l.calculation_snapshot #>> '{attendance,payableDays}')::numeric is distinct from
        (select sum(a.payable_hours) / 8 from public.attendance_entries a
          where a.employee_id = l.employee_id and a.work_date between r.period_start and r.period_end)
    )) then
    raise exception 'Currency, identity, monetary arithmetic, or daily attendance does not reconcile';
  end if;
  if exists (select 1 from public.payroll_runs r where r.organization_id = v_organization
    and (r.created_by = r.approved_by or r.created_by = r.finalized_by or r.approved_by is null or r.finalized_by is null)) then
    raise exception 'Maker/checker separation is missing';
  end if;
  if (select count(*) from public.payslips p join public.payroll_run_lines l on l.id = p.payroll_run_line_id
    join public.payroll_runs r on r.id = l.payroll_run_id where r.organization_id = v_organization
    and p.published_at is not null and p.storage_path is not null) <> 198 then
    raise exception 'Expected a published private payslip for every line';
  end if;
  if exists (select 1 from public.salary_revisions where organization_id = v_organization and currency_code <> 'INR') then
    raise exception 'Non-INR sample salary revisions remain';
  end if;
  if exists (select profile_id from public.employees where organization_id = v_organization and profile_id is not null
    group by profile_id having count(*) > 1) then
    raise exception 'Duplicate employee account links';
  end if;
  if (select count(*) from pg_trigger where tgname in (
    'payroll_runs_prevent_finalized_changes', 'payroll_run_lines_prevent_finalized_changes',
    'payroll_adjustments_prevent_finalized_changes', 'attendance_entries_prevent_locked_changes',
    'holidays_prevent_locked_changes') and tgenabled = 'O') <> 5 then
    raise exception 'A protection trigger is missing or disabled';
  end if;
  if exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then
    raise exception 'A public table lacks RLS';
  end if;
end $$;

select r.period_start, count(l.id) as employees, sum(l.total_earnings) as earnings_inr,
  sum(l.total_deductions) as deductions_inr, sum(l.net_pay) as net_inr
from public.payroll_runs r join public.payroll_run_lines l on l.payroll_run_id = r.id
where r.organization_id = '00000000-0000-0000-0000-000000000001'
group by r.period_start order by r.period_start;

select 'INR history integrity checks passed' as result;
