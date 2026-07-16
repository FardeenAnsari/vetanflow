drop function if exists public.record_salary_revision(uuid, date, numeric, text, uuid);

alter table public.employees
drop constraint if exists employees_bank_ifsc_format;

alter table public.employees
rename column annual_ctc to annual_compensation;

alter table public.employees
rename column bank_ifsc to bank_routing_code;

alter table public.salary_revisions
drop constraint if exists salary_revisions_annual_ctc_check;

alter table public.salary_revisions
rename column annual_ctc to annual_compensation;

alter table public.employees
add constraint employees_annual_compensation_non_negative
check (annual_compensation >= 0);

alter table public.employees
add constraint employees_bank_routing_code_format
check (
  bank_routing_code is null
  or bank_routing_code ~ '^[A-Z0-9][A-Z0-9 -]{3,33}$'
);

alter table public.salary_revisions
add constraint salary_revisions_annual_compensation_non_negative
check (annual_compensation >= 0);

alter table public.work_locations
alter column country_code set default 'US';

alter table public.holidays
alter column region set default 'GLOBAL';

alter table public.salary_revisions
alter column currency_code set default 'USD';

update public.holidays
set region = 'GLOBAL'
where region = 'IN';

update public.salary_revisions as revision
set currency_code = organization.currency_code
from public.organizations as organization
where organization.id = revision.organization_id;

alter table public.payroll_run_lines
disable trigger payroll_run_lines_prevent_finalized_changes;

with normalized as (
  select
    id,
    calculation_snapshot as snapshot,
    coalesce(
      calculation_snapshot #> '{payroll,deductionSummary,retirementContribution}',
      calculation_snapshot #> '{payroll,deductions,retirementContribution}',
      calculation_snapshot #> '{payroll,statutory,employeePf}',
      calculation_snapshot #> '{payroll,deductions,employeePf}',
      '0'::jsonb
    ) as retirement_contribution,
    coalesce(
      calculation_snapshot #> '{payroll,deductionSummary,socialInsurance}',
      calculation_snapshot #> '{payroll,deductions,socialInsurance}',
      calculation_snapshot #> '{payroll,statutory,employeeEsi}',
      calculation_snapshot #> '{payroll,deductions,employeeEsi}',
      '0'::jsonb
    ) as social_insurance,
    coalesce(
      calculation_snapshot #> '{payroll,deductionSummary,localPayrollTax}',
      calculation_snapshot #> '{payroll,deductions,localPayrollTax}',
      calculation_snapshot #> '{payroll,statutory,professionalTax}',
      calculation_snapshot #> '{payroll,deductions,professionalTax}',
      '0'::jsonb
    ) as local_payroll_tax,
    coalesce(
      calculation_snapshot #> '{payroll,deductionSummary,withholdingTax}',
      calculation_snapshot #> '{payroll,deductions,withholdingTax}',
      calculation_snapshot #> '{payroll,statutory,tds}',
      calculation_snapshot #> '{payroll,deductions,tds}',
      '0'::jsonb
    ) as withholding_tax
  from public.payroll_run_lines
  where jsonb_typeof(calculation_snapshot) = 'object'
    and calculation_snapshot ? 'payroll'
)
update public.payroll_run_lines as line
set calculation_snapshot = (
  jsonb_set(
    jsonb_set(
      normalized.snapshot,
      '{payroll,deductionSummary}',
      jsonb_build_object(
        'retirementContribution', normalized.retirement_contribution,
        'socialInsurance', normalized.social_insurance,
        'localPayrollTax', normalized.local_payroll_tax,
        'withholdingTax', normalized.withholding_tax
      ),
      true
    ),
    '{payroll,deductions}',
    (
      coalesce(normalized.snapshot #> '{payroll,deductions}', '{}'::jsonb)
      - 'employeePf'
      - 'employeeEsi'
      - 'professionalTax'
      - 'tds'
    ) || jsonb_build_object(
      'retirementContribution', normalized.retirement_contribution,
      'socialInsurance', normalized.social_insurance,
      'localPayrollTax', normalized.local_payroll_tax,
      'withholdingTax', normalized.withholding_tax
    ),
    true
  ) #- '{payroll,statutory}'
)
from normalized
where line.id = normalized.id;

alter table public.payroll_run_lines
enable trigger payroll_run_lines_prevent_finalized_changes;

create or replace function public.record_compensation_revision(
  p_employee_id uuid,
  p_effective_from date,
  p_annual_compensation numeric,
  p_reason text,
  p_actor_id uuid default null
)
returns public.salary_revisions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_employee public.employees%rowtype;
  v_revision public.salary_revisions%rowtype;
begin
  if p_annual_compensation < 0 then
    raise exception 'annual_compensation_must_be_non_negative';
  end if;

  select *
  into v_employee
  from public.employees
  where id = p_employee_id;

  if not found then
    raise exception 'employee_not_found';
  end if;

  insert into public.salary_revisions (
    organization_id,
    employee_id,
    effective_from,
    annual_compensation,
    currency_code,
    reason,
    created_by
  )
  values (
    v_employee.organization_id,
    p_employee_id,
    p_effective_from,
    p_annual_compensation,
    coalesce(
      (select currency_code from public.organizations where id = v_employee.organization_id),
      'USD'
    ),
    p_reason,
    p_actor_id
  )
  on conflict (employee_id, effective_from)
  do update set
    annual_compensation = excluded.annual_compensation,
    currency_code = excluded.currency_code,
    reason = excluded.reason,
    created_by = excluded.created_by
  returning * into v_revision;

  update public.employees
  set
    annual_compensation = p_annual_compensation,
    updated_at = now()
  where id = p_employee_id;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_employee.organization_id,
    p_actor_id,
    'compensation_revision_recorded',
    'employee',
    p_employee_id,
    jsonb_build_object(
      'effective_from', p_effective_from,
      'annual_compensation', p_annual_compensation,
      'reason', p_reason
    )
  );

  return v_revision;
end;
$$;

revoke execute on function public.record_compensation_revision(uuid, date, numeric, text, uuid)
from public, anon, authenticated;

grant execute on function public.record_compensation_revision(uuid, date, numeric, text, uuid)
to service_role;

comment on column public.employees.annual_compensation is
  'Protected annual compensation data. Read through authorized backend payroll endpoints.';

comment on column public.employees.bank_routing_code is
  'Protected payout routing data. Read through authorized backend payroll endpoints.';
