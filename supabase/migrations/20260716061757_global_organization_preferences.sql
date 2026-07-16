alter table public.organizations
add column if not exists country_code char(2) not null default 'US',
add column if not exists currency_code char(3) not null default 'USD',
add column if not exists locale text not null default 'en-US',
add column if not exists timezone text not null default 'UTC';

alter table public.organizations
drop constraint if exists organizations_country_code_format,
add constraint organizations_country_code_format check (country_code ~ '^[A-Z]{2}$'),
drop constraint if exists organizations_currency_code_format,
add constraint organizations_currency_code_format check (currency_code ~ '^[A-Z]{3}$'),
drop constraint if exists organizations_locale_not_blank,
add constraint organizations_locale_not_blank check (length(trim(locale)) >= 2),
drop constraint if exists organizations_timezone_not_blank,
add constraint organizations_timezone_not_blank check (length(trim(timezone)) >= 2);

comment on column public.organizations.country_code is 'ISO 3166-1 alpha-2 country code used for organization defaults.';
comment on column public.organizations.currency_code is 'ISO 4217 currency used for payroll display and documents.';
comment on column public.organizations.locale is 'BCP 47 locale used for dates and number formatting.';
comment on column public.organizations.timezone is 'IANA timezone used for organization reporting and cutoffs.';

update public.organizations
set
  name = 'VetanFlow Labs',
  legal_name = 'VetanFlow Labs Incorporated',
  country_code = 'US',
  currency_code = 'USD',
  locale = 'en-US',
  timezone = 'America/New_York'
where id = '00000000-0000-0000-0000-000000000001'::uuid;

update public.work_locations
set name = 'New York HQ', city = 'New York', state = 'New York', country_code = 'US'
where id = '20000000-0000-0000-0000-000000000001'::uuid;

update public.work_locations
set name = 'Austin Finance Office', city = 'Austin', state = 'Texas', country_code = 'US'
where id = '20000000-0000-0000-0000-000000000002'::uuid;

update public.work_locations
set name = 'Seattle Operations Hub', city = 'Seattle', state = 'Washington', country_code = 'US'
where id = '20000000-0000-0000-0000-000000000003'::uuid;

update public.employees
set employee_code = 'VF-001', location = 'New York', annual_ctc = 120000
where organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  and employee_code = 'IND-001';

update public.employees
set employee_code = 'VF-002', location = 'Austin', annual_ctc = 90000
where organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  and employee_code = 'IND-002';

update public.employees
set employee_code = 'VF-003', location = 'Seattle', annual_ctc = 150000
where organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  and employee_code = 'IND-003';

do $$
begin
  if to_regclass('public.salary_components') is not null then
    update public.salary_components
    set currency_code = 'USD'
    where organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
  end if;
end
$$;

delete from public.holidays
where organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  and name in ('Republic Day', 'Independence Day', 'Gandhi Jayanti');
