create index idx_salary_revisions_created_by
on public.salary_revisions(created_by)
where created_by is not null;
