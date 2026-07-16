insert into public.organizations (id, name, legal_name, pan, tan)
values (
  '00000000-0000-0000-0000-000000000001',
  'VetanFlow Demo India',
  'VetanFlow Demo India Private Limited',
  'ABCDE1234F',
  'KOLP12345B'
);

insert into public.departments (id, organization_id, name)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Engineering'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Finance'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Operations');

insert into public.work_locations (id, organization_id, name, city, state, country_code)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Kolkata HQ', 'Kolkata', 'West Bengal', 'IN'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Mumbai Finance Office', 'Mumbai', 'Maharashtra', 'IN'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Bengaluru Operations Hub', 'Bengaluru', 'Karnataka', 'IN');

insert into public.employees (
  organization_id,
  department_id,
  work_location_id,
  employee_code,
  full_name,
  work_email,
  designation,
  location,
  joining_date,
  status,
  annual_ctc
)
values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'IND-001', 'Aarav Mehta', 'aarav@example.com', 'Frontend Engineer', 'Kolkata', '2025-04-01', 'active', 1200000),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'IND-002', 'Naina Kapoor', 'naina@example.com', 'Payroll Specialist', 'Mumbai', '2024-10-15', 'active', 900000),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'IND-003', 'Ritwik Sen', 'ritwik@example.com', 'Operations Manager', 'Bengaluru', '2026-01-10', 'draft', 1500000);

insert into public.salary_revisions (
  organization_id,
  employee_id,
  effective_from,
  annual_ctc,
  reason
)
select
  employees.organization_id,
  employees.id,
  employees.joining_date,
  employees.annual_ctc,
  'Initial setup'
from public.employees
where employees.organization_id = '00000000-0000-0000-0000-000000000001'
on conflict (employee_id, effective_from) do nothing;
