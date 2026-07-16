alter table public.payroll_runs
add column if not exists submitted_by uuid references auth.users(id) on delete set null,
add column if not exists submitted_at timestamptz,
add column if not exists approved_at timestamptz,
add column if not exists finalized_by uuid references auth.users(id) on delete set null;

create index if not exists idx_payroll_runs_submitted_by
on public.payroll_runs(submitted_by);

create index if not exists idx_payroll_runs_finalized_by
on public.payroll_runs(finalized_by);

create or replace function public.prevent_finalized_payroll_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_status public.payroll_run_status;
begin
  if TG_TABLE_NAME = 'payroll_runs' then
    if TG_OP in ('UPDATE', 'DELETE') and OLD.status = 'finalized' then
      raise exception 'Finalized payroll runs cannot be changed';
    end if;

    if TG_OP = 'DELETE' then
      return OLD;
    end if;

    return NEW;
  end if;

  if TG_OP in ('UPDATE', 'DELETE') then
    select status into parent_status
    from public.payroll_runs
    where id = OLD.payroll_run_id;

    if parent_status = 'finalized' then
      raise exception 'Finalized payroll run lines cannot be changed';
    end if;
  end if;

  if TG_OP in ('INSERT', 'UPDATE') then
    select status into parent_status
    from public.payroll_runs
    where id = NEW.payroll_run_id;

    if parent_status = 'finalized' then
      raise exception 'Finalized payroll run lines cannot be changed';
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

revoke execute on function public.prevent_finalized_payroll_changes() from public;
revoke execute on function public.prevent_finalized_payroll_changes() from anon;
revoke execute on function public.prevent_finalized_payroll_changes() from authenticated;

drop trigger if exists payroll_runs_prevent_finalized_changes on public.payroll_runs;
create trigger payroll_runs_prevent_finalized_changes
before update or delete on public.payroll_runs
for each row execute function public.prevent_finalized_payroll_changes();

drop trigger if exists payroll_run_lines_prevent_finalized_changes on public.payroll_run_lines;
create trigger payroll_run_lines_prevent_finalized_changes
before insert or update or delete on public.payroll_run_lines
for each row execute function public.prevent_finalized_payroll_changes();
