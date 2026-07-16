# Demo Reset Checklist

Use this before and after live demos so the project stays clean.

## Before A Demo

- Confirm `backend/.env` and `frontend/.env` point to the intended Supabase project.
- Run `npm run verify`.
- Run `npm run demo:reset` when the Supabase project should return to the clean September 2026 walkthrough state.
- Run `npm run demo:prepare` when the Supabase project only needs missing walkthrough data filled in.
- Run `npm run demo:check`.
- Confirm owner/admin and employee demo accounts can sign in.
- Confirm the employee account links to one employee profile.
- Confirm at least one active employee has complete bank details.
- Confirm the current demo month has attendance entries and a locked attendance month.
- Confirm one payroll run is finalized.
- Generate payslips for the finalized run.
- Confirm Bank CSV, Statutory CSV, Department Cost CSV, and payslip download all work.
- In the Payroll runs list, use the prepared `2026-09-01` to `2026-09-30` run for the walkthrough.

## During A Demo

- Use clearly temporary records for edits, such as names or notes prefixed with `Demo`.
- Avoid changing the main seeded employee records unless you plan to keep those changes.
- Use the app flow for creates, approvals, finalization, and downloads so audit logs stay meaningful.

## After A Demo

- Run `npm run demo:reset` when you want to remove temporary walkthrough records and rebuild the standard demo month.
- Confirm the employee demo account still sees only its own self-service page.
- Run `npm run verify`.

## Remote Database Safety

Do cleanup from a trusted machine. `npm run demo:reset` uses the linked Supabase project and project-local SQL reset file, then runs `npm run demo:prepare`. Do not run it against a shared production database.

If you create throwaway records manually, keep their IDs in a scratch note during the demo. That makes cleanup boring, which is exactly what you want.

## Readiness Check Output

`npm run demo:check` exits with a non-zero status when a required demo condition is missing. By default, `demo:prepare` and `demo:check` use `DEMO_PERIOD_MONTH=2026-09-01`; override that env var when you want another month. Treat failures as setup work, not script failures. Typical required conditions:

- At least one organization exists.
- Owner/admin, checker, and employee roles exist.
- At least one active employee links to an auth profile.
- At least one active employee has complete bank details.
- Attendance entries exist for the demo month.
- A payroll month is locked.
- A finalized payroll run exists.
- The private `payslips` bucket exists.

Warnings point to a weaker demo, such as missing generated payslips for the latest finalized run. Fix warnings before recording the final walkthrough.
