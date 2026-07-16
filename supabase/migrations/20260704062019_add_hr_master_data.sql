create table public.work_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  city text not null,
  state text not null,
  country_code char(2) not null default 'IN',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

alter table public.employees
add column if not exists work_location_id uuid references public.work_locations(id) on delete set null;

create table public.salary_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  effective_from date not null,
  annual_ctc numeric(12, 2) not null check (annual_ctc >= 0),
  currency_code char(3) not null default 'INR',
  reason text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (employee_id, effective_from)
);

alter table public.work_locations enable row level security;
alter table public.salary_revisions enable row level security;

create index idx_work_locations_organization_id
on public.work_locations(organization_id);

create index idx_employees_work_location_id
on public.employees(work_location_id)
where work_location_id is not null;

create index idx_salary_revisions_organization_id
on public.salary_revisions(organization_id);

create index idx_salary_revisions_employee_effective
on public.salary_revisions(employee_id, effective_from desc);

grant select on table
  public.work_locations,
  public.salary_revisions
to authenticated;

grant all privileges on table
  public.work_locations,
  public.salary_revisions
to service_role;

create policy "work_locations_select_member"
on public.work_locations
for select
to authenticated
using (
  organization_id in (
    select profiles.organization_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "salary_revisions_select_payroll_team_or_self"
on public.salary_revisions
for select
to authenticated
using (
  exists (
    select 1
    from public.employees
    where employees.id = salary_revisions.employee_id
      and employees.profile_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.organization_id = salary_revisions.organization_id
      and user_roles.user_id = (select auth.uid())
      and user_roles.role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'hr'::public.app_role,
        'finance'::public.app_role
      )
  )
);

create or replace function public.record_salary_revision(
  p_employee_id uuid,
  p_effective_from date,
  p_annual_ctc numeric,
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
  if p_annual_ctc < 0 then
    raise exception 'annual_ctc_must_be_non_negative';
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
    annual_ctc,
    reason,
    created_by
  )
  values (
    v_employee.organization_id,
    p_employee_id,
    p_effective_from,
    p_annual_ctc,
    p_reason,
    p_actor_id
  )
  on conflict (employee_id, effective_from)
  do update set
    annual_ctc = excluded.annual_ctc,
    reason = excluded.reason,
    created_by = excluded.created_by
  returning * into v_revision;

  update public.employees
  set
    annual_ctc = p_annual_ctc,
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
    'salary_revision_recorded',
    'employee',
    p_employee_id,
    jsonb_build_object(
      'effective_from', p_effective_from,
      'annual_ctc', p_annual_ctc,
      'reason', p_reason
    )
  );

  return v_revision;
end;
$$;

revoke execute on function public.record_salary_revision(uuid, date, numeric, text, uuid)
from public, anon, authenticated;

grant execute on function public.record_salary_revision(uuid, date, numeric, text, uuid)
to service_role;
