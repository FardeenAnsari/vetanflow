create or replace function public.prevent_locked_attendance_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_organization_id uuid;
  target_work_date date;
begin
  if tg_table_name = 'attendance_entries' then
    if tg_op = 'DELETE' then
      target_organization_id := old.organization_id;
      target_work_date := old.work_date;
    else
      target_organization_id := new.organization_id;
      target_work_date := new.work_date;
    end if;
  elsif tg_table_name = 'holidays' then
    if tg_op = 'DELETE' then
      target_organization_id := old.organization_id;
      target_work_date := old.holiday_date;
    else
      target_organization_id := new.organization_id;
      target_work_date := new.holiday_date;
    end if;
  else
    return new;
  end if;

  if exists (
    select 1
    from public.attendance_month_locks
    where attendance_month_locks.organization_id = target_organization_id
      and attendance_month_locks.period_month = date_trunc('month', target_work_date)::date
  ) then
    raise exception 'Attendance period % is locked', date_trunc('month', target_work_date)::date
      using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_locked_attendance_changes() from public;
revoke execute on function public.prevent_locked_attendance_changes() from anon;
revoke execute on function public.prevent_locked_attendance_changes() from authenticated;
