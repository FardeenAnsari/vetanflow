# Demo Reset Checklist

Use this before and after live demos so the project stays clean.

## Before A Demo

- Confirm `backend/.env` and `frontend/.env` point to the intended Supabase project.
- Run `npm run verify`.
- Run `npm run demo:bootstrap` to idempotently seed 12 role users, master data, and the previous six payroll months.
- Run `npm run demo:reset` only when the showcase organization's transactional records and payslip files should be deleted and rebuilt.
- Run `npm run demo:check` and `npm run demo:check-logins`.
- Confirm all 12 role accounts can sign in.
- Confirm the employee account links to one employee profile.
- Confirm at least one active employee has complete bank details.
- Confirm the current month has open attendance examples and both historical demo months are locked.
- Confirm the previous six payroll runs are finalized with published payslips.
- Confirm owner can download at least two different employee ID PDFs.
- Confirm an employee can download their own ID and receives `404` for another employee ID.
- Confirm Bank CSV, Deductions CSV, Department Cost CSV, and payslip download all work.
- In Payroll, use the previous calendar month as the current close and the month before it for variance comparison.

## During A Demo

- Use clearly temporary records for edits, such as names or notes prefixed with `Demo`.
- Avoid changing the main seeded employee records unless you plan to keep those changes.
- Use the app flow for creates, approvals, finalization, and downloads so audit logs stay meaningful.

## After A Demo

- Run `npm run demo:bootstrap` to repair missing showcase records without deleting history.
- Run `npm run demo:reset` only when a complete destructive rebuild is intended.
- Confirm the employee demo account still sees only its own self-service page.
- Run `npm run verify`.

## Remote Database Safety

Do cleanup from a trusted machine. `npm run demo:reset` removes the showcase organization's payslip objects, uses the linked Supabase project and project-local SQL reset file, then runs the full bootstrap. Both cleanup steps verify the fixed organization ID belongs to `VetanFlow Labs`. Never run it against a shared production database.

If you create throwaway records manually, keep their IDs in a scratch note during the demo. That makes cleanup boring, which is exactly what you want.

## Readiness Check Output

`npm run demo:check` exits with a non-zero status when a required demo condition is missing. By default, `demo:prepare` and `demo:check` use the previous calendar month; override `DEMO_PERIOD_MONTH=YYYY-MM-01` for another month. Treat failures as setup work, not script failures. Typical required conditions:

- At least one organization exists.
- Owner, admin, HR, finance, manager, and employee roles exist.
- At least one active employee links to an auth profile.
- At least one active employee has complete bank details.
- Attendance entries exist for the demo month.
- A payroll month is locked.
- A finalized payroll run exists.
- The private `payslips` bucket exists.

Warnings point to a weaker demo, such as missing generated payslips for the latest finalized run. Fix warnings before recording the final walkthrough.

`npm run demo:check-logins` signs in all 12 accounts from the ignored `.tmp/demo-credentials.json` file and verifies that HR, leave, payroll-run, payslip, and employee-ID visibility matches each role.
