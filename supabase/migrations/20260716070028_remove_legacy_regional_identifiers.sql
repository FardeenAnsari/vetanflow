alter table public.organizations
drop column if exists pan,
drop column if exists tan,
drop column if exists gstin;
