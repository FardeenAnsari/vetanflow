revoke select on table public.employees from anon, authenticated;

grant select (
  id,
  organization_id,
  department_id,
  work_location_id,
  profile_id,
  manager_employee_id,
  manager_profile_id,
  employee_code,
  full_name,
  work_email,
  designation,
  location,
  joining_date,
  status,
  photo_path,
  created_at,
  updated_at
) on table public.employees to authenticated;

comment on column public.employees.annual_ctc is
  'Protected compensation data. Read through authorized backend payroll endpoints.';

comment on column public.employees.bank_account_holder_name is
  'Protected payment data. Read through authorized backend payroll endpoints.';

comment on column public.employees.bank_account_number is
  'Protected payment data. Read through authorized backend payroll endpoints.';

comment on column public.employees.bank_ifsc is
  'Protected routing data. Read through authorized backend payroll endpoints.';

comment on column public.employees.bank_name is
  'Protected payment data. Read through authorized backend payroll endpoints.';
