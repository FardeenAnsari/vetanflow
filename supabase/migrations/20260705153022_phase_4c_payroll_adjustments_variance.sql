create table if not exists public.payroll_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  component_type text not null,
  component_code text not null,
  component_name text not null,
  amount numeric(12, 2) not null,
  tax_treatment text not null default 'taxable',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_adjustments_component_type_check
    check (component_type in ('earning', 'deduction', 'reimbursement')),
  constraint payroll_adjustments_tax_treatment_check
    check (tax_treatment in (
      'taxable',
      'pre_tax_deduction',
      'post_tax_deduction',
      'non_taxable_reimbursement'
    )),
  constraint payroll_adjustments_amount_check
    check (amount > 0)
);

alter table public.payroll_adjustments enable row level security;

grant select on table public.payroll_adjustments to authenticated;
grant all privileges on table public.payroll_adjustments to service_role;

create index if not exists idx_payroll_adjustments_run_employee
on public.payroll_adjustments(payroll_run_id, employee_id);

create index if not exists idx_payroll_adjustments_org_created
on public.payroll_adjustments(organization_id, created_at desc);

create index if not exists idx_payroll_adjustments_created_by
on public.payroll_adjustments(created_by)
where created_by is not null;

create policy "payroll_adjustments_select_payroll_team_or_self"
on public.payroll_adjustments
for select
to authenticated
using (
  exists (
    select 1
    from public.employees
    where employees.id = payroll_adjustments.employee_id
      and employees.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.organization_id = payroll_adjustments.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role
      )
  )
);

create or replace function public.prevent_finalized_payroll_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_status public.payroll_run_status;
begin
  if TG_TABLE_NAME = 'payroll_runs' then
    if TG_OP in ('UPDATE', 'DELETE') and OLD.status = 'finalized' then
      raise exception 'Finalized payroll runs cannot be changed';
    end if;

    if TG_OP = 'DELETE' then
      return OLD;
    end if;

    return NEW;
  end if;

  if TG_OP in ('UPDATE', 'DELETE') then
    select status into parent_status
    from public.payroll_runs
    where id = OLD.payroll_run_id;

    if parent_status = 'finalized' then
      raise exception 'Finalized payroll run payroll detail cannot be changed';
    end if;
  end if;

  if TG_OP in ('INSERT', 'UPDATE') then
    select status into parent_status
    from public.payroll_runs
    where id = NEW.payroll_run_id;

    if parent_status = 'finalized' then
      raise exception 'Finalized payroll run payroll detail cannot be changed';
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

revoke execute on function public.prevent_finalized_payroll_changes() from public;
revoke execute on function public.prevent_finalized_payroll_changes() from anon;
revoke execute on function public.prevent_finalized_payroll_changes() from authenticated;

drop trigger if exists payroll_adjustments_prevent_finalized_changes on public.payroll_adjustments;
create trigger payroll_adjustments_prevent_finalized_changes
before insert or update or delete on public.payroll_adjustments
for each row execute function public.prevent_finalized_payroll_changes();
