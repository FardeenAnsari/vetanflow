create extension if not exists "pgcrypto";

create type public.app_role as enum ('owner', 'admin', 'hr', 'finance', 'manager', 'employee');
create type public.employee_status as enum ('draft', 'active', 'on_leave', 'exit_pending', 'inactive');
create type public.payroll_run_status as enum ('draft', 'reviewing', 'approved', 'finalized', 'cancelled');
create type public.leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  pan text,
  tan text,
  gstin text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id, role)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  employee_code text not null,
  full_name text not null,
  work_email text,
  designation text not null,
  location text not null,
  joining_date date not null,
  status public.employee_status not null default 'draft',
  annual_ctc numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, employee_code)
);

create table public.attendance_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date date not null,
  payable_hours numeric(5, 2) not null default 0,
  overtime_hours numeric(5, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null,
  status public.leave_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  holiday_date date not null,
  name text not null,
  region text not null default 'IN',
  created_at timestamptz not null default now(),
  unique (organization_id, holiday_date)
);

create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status public.payroll_run_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (organization_id, period_start, period_end)
);

create table public.payroll_run_lines (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  gross_pay numeric(12, 2) not null default 0,
  total_earnings numeric(12, 2) not null default 0,
  total_deductions numeric(12, 2) not null default 0,
  net_pay numeric(12, 2) not null default 0,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (payroll_run_id, employee_id)
);

create table public.payslips (
  id uuid primary key default gen_random_uuid(),
  payroll_run_line_id uuid not null references public.payroll_run_lines(id) on delete cascade,
  storage_path text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.attendance_entries enable row level security;
alter table public.leave_requests enable row level security;
alter table public.holidays enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_run_lines enable row level security;
alter table public.payslips enable row level security;
alter table public.audit_logs enable row level security;

create index idx_profiles_organization_id on public.profiles(organization_id);
create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_employees_organization_id on public.employees(organization_id);
create index idx_attendance_employee_date on public.attendance_entries(employee_id, work_date);
create index idx_leave_employee_dates on public.leave_requests(employee_id, start_date, end_date);
create index idx_payroll_runs_org_period on public.payroll_runs(organization_id, period_start, period_end);
create index idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);
