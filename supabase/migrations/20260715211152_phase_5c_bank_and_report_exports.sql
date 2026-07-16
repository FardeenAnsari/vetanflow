alter table public.employees
add column if not exists bank_account_holder_name text,
add column if not exists bank_account_number text,
add column if not exists bank_ifsc text,
add column if not exists bank_name text;

alter table public.employees
drop constraint if exists employees_bank_account_number_format,
add constraint employees_bank_account_number_format
check (
  bank_account_number is null
  or bank_account_number ~ '^[0-9]{6,20}$'
);

alter table public.employees
drop constraint if exists employees_bank_ifsc_format,
add constraint employees_bank_ifsc_format
check (
  bank_ifsc is null
  or bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
);
