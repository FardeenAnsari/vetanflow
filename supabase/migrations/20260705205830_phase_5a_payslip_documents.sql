insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'payslips',
  'payslips',
  false,
  5242880,
  array['application/pdf']
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create unique index if not exists idx_payslips_payroll_run_line_unique
on public.payslips(payroll_run_line_id);

create index if not exists idx_payslips_published_at
on public.payslips(published_at desc)
where published_at is not null;
