-- One-time, owner-approved maintenance for the January-June 2026 synthetic history.
-- Run backup-legacy-inr-history.ts first. This is not a production payroll correction procedure.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '60s';
lock table public.payroll_runs, public.payroll_run_lines, public.payroll_adjustments,
  public.attendance_entries, public.attendance_month_locks in access exclusive mode;

do $$
declare
  v_organization uuid := '00000000-0000-0000-0000-000000000001';
  v_runs uuid[];
  v_locks uuid[];
begin
  if not exists (select 1 from public.organizations where id = v_organization
    and name = 'VetanFlow Labs' and country_code = 'IN' and currency_code = 'INR') then
    raise exception 'Expected the VetanFlow Labs Indian sample organization';
  end if;
  select array_agg(id) into v_runs from public.payroll_runs
  where organization_id = v_organization and period_start >= '2026-01-01' and period_start < '2026-07-01'
    and status = 'finalized';
  if coalesce(cardinality(v_runs), 0) <> 6
    or (select count(*) from public.payroll_run_lines where payroll_run_id = any(v_runs)) <> 54
    or exists (select 1 from public.payroll_run_lines where payroll_run_id = any(v_runs)
      and (calculation_snapshot #>> '{source,version}' is distinct from 'demo_prepare_v1'
        or calculation_snapshot ? 'money')) then
    raise exception 'Legacy sample provenance does not match the approved six periods';
  end if;
  select array_agg(id) into v_locks from public.attendance_month_locks
  where organization_id = v_organization and period_month >= '2026-01-01' and period_month < '2026-07-01';
  if coalesce(cardinality(v_locks), 0) <> 6
    or exists (select 1 from public.attendance_month_locks where id = any(v_locks)
      and notes is distinct from 'Prepared by demo readiness script')
    or exists (select 1 from public.attendance_entries where organization_id = v_organization
      and work_date >= '2026-01-01' and work_date < '2026-07-01'
      and notes is distinct from 'Prepared by demo readiness script') then
    raise exception 'Non-sample attendance found; refusing to replace it';
  end if;
  if exists (select 1 from pg_trigger where tgname in (
    'payroll_runs_prevent_finalized_changes', 'payroll_run_lines_prevent_finalized_changes',
    'payroll_adjustments_prevent_finalized_changes', 'attendance_entries_prevent_locked_changes'
  ) and tgenabled <> 'O') then
    raise exception 'Protection triggers must be enabled before maintenance';
  end if;

  alter table public.payroll_runs disable trigger payroll_runs_prevent_finalized_changes;
  alter table public.payroll_run_lines disable trigger payroll_run_lines_prevent_finalized_changes;
  alter table public.payroll_adjustments disable trigger payroll_adjustments_prevent_finalized_changes;
  alter table public.attendance_entries disable trigger attendance_entries_prevent_locked_changes;

  delete from public.payroll_runs where id = any(v_runs) and organization_id = v_organization;
  delete from public.attendance_entries where organization_id = v_organization
    and work_date >= '2026-01-01' and work_date < '2026-07-01';
  delete from public.attendance_month_locks where id = any(v_locks) and organization_id = v_organization;

  alter table public.attendance_entries enable trigger attendance_entries_prevent_locked_changes;
  alter table public.payroll_adjustments enable trigger payroll_adjustments_prevent_finalized_changes;
  alter table public.payroll_run_lines enable trigger payroll_run_lines_prevent_finalized_changes;
  alter table public.payroll_runs enable trigger payroll_runs_prevent_finalized_changes;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_organization, (select user_id from public.user_roles where organization_id = v_organization and role = 'owner' limit 1),
    'sample_history_rebuild_authorized', 'organization', v_organization,
    jsonb_build_object('source', 'legacy_inr_rebuild', 'removed_run_ids', v_runs,
      'period_start', '2026-01-01', 'period_end', '2026-06-30', 'currency', 'INR', 'synthetic_data_only', true));
end $$;
commit;
