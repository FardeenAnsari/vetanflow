-- Local/fresh-project master-data seed. Auth users and role assignments are
-- provisioned separately by `npm run demo:seed-showcase` so passwords never
-- enter migration history or source control.

insert into public.organizations (
  id,
  name,
  legal_name,
  country_code,
  currency_code,
  locale,
  timezone
)
values (
  '00000000-0000-0000-0000-000000000001',
  'VetanFlow Labs',
  'VetanFlow Labs Incorporated',
  'US',
  'USD',
  'en-US',
  'America/New_York'
)
on conflict (id) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  country_code = excluded.country_code,
  currency_code = excluded.currency_code,
  locale = excluded.locale,
  timezone = excluded.timezone;

insert into public.departments (id, organization_id, name, is_active)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Engineering', true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Finance', true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Operations', true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'People', true),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Customer Success', true)
on conflict (id) do update set
  name = excluded.name,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.work_locations (id, organization_id, name, city, state, country_code, is_active)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'New York HQ', 'New York', 'New York', 'US', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Austin Office', 'Austin', 'Texas', 'US', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Seattle Hub', 'Seattle', 'Washington', 'US', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Toronto Studio', 'Toronto', 'Ontario', 'CA', true)
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  state = excluded.state,
  country_code = excluded.country_code,
  is_active = excluded.is_active,
  updated_at = now();

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
  annual_compensation,
  bank_account_holder_name,
  bank_account_number,
  bank_routing_code,
  bank_name
)
values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'VF-001', 'Fardeen Ansari', 'developer.fardeenansari@gmail.com', 'Founder & Owner', 'New York', '2023-01-15', 'active', 192000, 'Fardeen Ansari', '900000000001', '21000021', 'VetanFlow Demo Bank'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'VF-002', 'Maya Chen', 'admin.demo@vetanflow.example.com', 'Platform Administrator', 'New York', '2024-02-15', 'active', 138000, 'Maya Chen', '900000000002', '21000022', 'Northstar Demo Credit Union'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'VF-003', 'Olivia Bennett', 'hr.demo@vetanflow.example.com', 'People Operations Lead', 'Toronto', '2025-03-15', 'active', 124000, 'Olivia Bennett', '900000000003', '21000023', 'VetanFlow Demo Bank'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'VF-004', 'Ethan Brooks', 'finance.demo@vetanflow.example.com', 'Payroll Controller', 'Austin', '2023-04-15', 'active', 132000, 'Ethan Brooks', '900000000004', '21000024', 'Northstar Demo Credit Union'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'VF-005', 'Sofia Ramirez', 'manager.demo@vetanflow.example.com', 'Engineering Manager', 'Seattle', '2024-05-15', 'active', 146000, 'Sofia Ramirez', '900000000005', '21000025', 'VetanFlow Demo Bank'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'VF-006', 'Noah Williams', 'employee.demo@vetanflow.example.com', 'Product Engineer', 'Seattle', '2025-06-15', 'active', 108000, 'Noah Williams', '900000000006', '21000026', 'Northstar Demo Credit Union'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', 'VF-007', 'Amina Yusuf', 'amina.yusuf@vetanflow.example.com', 'Customer Success Partner', 'Toronto', '2023-07-15', 'active', 96000, 'Amina Yusuf', '900000000007', '21000027', 'VetanFlow Demo Bank'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'VF-008', 'Lucas Martin', 'lucas.martin@vetanflow.example.com', 'Quality Engineer', 'Seattle', '2024-08-15', 'on_leave', 102000, 'Lucas Martin', '900000000008', '21000028', 'Northstar Demo Credit Union'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'VF-009', 'Priya Shah', 'priya.shah@vetanflow.example.com', 'Financial Analyst', 'Austin', '2025-09-15', 'exit_pending', 118000, 'Priya Shah', '900000000009', '21000029', 'VetanFlow Demo Bank'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'VF-010', 'Henry Walker', 'henry.walker@vetanflow.example.com', 'People Coordinator', 'New York', '2023-01-15', 'draft', 84000, 'Henry Walker', '900000000010', '21000030', 'Northstar Demo Credit Union')
on conflict (organization_id, employee_code) do update set
  department_id = excluded.department_id,
  work_location_id = excluded.work_location_id,
  full_name = excluded.full_name,
  work_email = excluded.work_email,
  designation = excluded.designation,
  location = excluded.location,
  joining_date = excluded.joining_date,
  status = excluded.status,
  annual_compensation = excluded.annual_compensation,
  bank_account_holder_name = excluded.bank_account_holder_name,
  bank_account_number = excluded.bank_account_number,
  bank_routing_code = excluded.bank_routing_code,
  bank_name = excluded.bank_name,
  updated_at = now();

update public.employees as employee
set manager_employee_id = manager.id
from public.employees as manager
where employee.organization_id = '00000000-0000-0000-0000-000000000001'
  and manager.organization_id = employee.organization_id
  and manager.employee_code = 'VF-001'
  and employee.employee_code in ('VF-002', 'VF-003', 'VF-004', 'VF-005');

update public.employees as employee
set manager_employee_id = manager.id
from public.employees as manager
where employee.organization_id = '00000000-0000-0000-0000-000000000001'
  and manager.organization_id = employee.organization_id
  and manager.employee_code = 'VF-005'
  and employee.employee_code in ('VF-006', 'VF-007', 'VF-008');

insert into public.salary_revisions (
  organization_id,
  employee_id,
  effective_from,
  annual_compensation,
  currency_code,
  reason
)
select
  employee.organization_id,
  employee.id,
  employee.joining_date,
  employee.annual_compensation,
  'USD',
  'Showcase compensation baseline'
from public.employees as employee
where employee.organization_id = '00000000-0000-0000-0000-000000000001'
on conflict (employee_id, effective_from) do update set
  annual_compensation = excluded.annual_compensation,
  currency_code = excluded.currency_code,
  reason = excluded.reason;

insert into public.salary_revisions (
  organization_id,
  employee_id,
  effective_from,
  annual_compensation,
  currency_code,
  reason
)
select
  employee.organization_id,
  employee.id,
  date '2026-01-01',
  employee.annual_compensation,
  'USD',
  'Annual compensation review'
from public.employees as employee
where employee.organization_id = '00000000-0000-0000-0000-000000000001'
  and employee.employee_code in ('VF-005', 'VF-006')
on conflict (employee_id, effective_from) do update set
  annual_compensation = excluded.annual_compensation,
  currency_code = excluded.currency_code,
  reason = excluded.reason;

insert into public.leave_requests (
  id,
  organization_id,
  employee_id,
  start_date,
  end_date,
  leave_type,
  status,
  reason,
  approval_stage,
  decision_note,
  reviewed_at
)
select
  request.id,
  '00000000-0000-0000-0000-000000000001',
  employee.id,
  current_date + request.start_offset,
  current_date + request.end_offset,
  request.leave_type,
  request.status::public.leave_status,
  request.reason,
  request.approval_stage,
  request.decision_note,
  case when request.status in ('approved', 'rejected', 'cancelled') then now() else null end
from (
  values
    ('31000000-0000-0000-0000-000000000001'::uuid, 'VF-006', 5, 6, 'vacation', 'pending', 'Planned personal time', 'manager', null),
    ('31000000-0000-0000-0000-000000000002'::uuid, 'VF-007', 9, 11, 'personal', 'pending', 'Family commitment', 'hr', 'Escalated for coverage review'),
    ('31000000-0000-0000-0000-000000000003'::uuid, 'VF-008', -9, -8, 'medical', 'approved', 'Recovery time', 'closed', 'Approved with team coverage confirmed'),
    ('31000000-0000-0000-0000-000000000004'::uuid, 'VF-006', -3, -3, 'personal', 'rejected', 'Personal appointment', 'closed', 'Critical release coverage required'),
    ('31000000-0000-0000-0000-000000000005'::uuid, 'VF-006', -15, -15, 'vacation', 'cancelled', 'Travel plans changed', 'closed', 'Request withdrawn by employee')
) as request(id, employee_code, start_offset, end_offset, leave_type, status, reason, approval_stage, decision_note)
join public.employees as employee
  on employee.organization_id = '00000000-0000-0000-0000-000000000001'
 and employee.employee_code = request.employee_code
on conflict (id) do update set
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  leave_type = excluded.leave_type,
  status = excluded.status,
  reason = excluded.reason,
  approval_stage = excluded.approval_stage,
  decision_note = excluded.decision_note,
  reviewed_at = excluded.reviewed_at,
  updated_at = now();

insert into public.holidays (organization_id, holiday_date, name, region)
values (
  '00000000-0000-0000-0000-000000000001',
  date_trunc('month', current_date)::date + 9,
  'Company wellness day',
  'GLOBAL'
)
on conflict (organization_id, holiday_date) do update set
  name = excluded.name,
  region = excluded.region;
