alter table public.departments
add column if not exists is_active boolean not null default true,
add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_departments_organization_active
on public.departments(organization_id, is_active);

create index if not exists idx_audit_logs_entity_lookup
on public.audit_logs(organization_id, entity_type, entity_id, created_at desc);
