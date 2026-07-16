# Demo Walkthrough

Use this script to show VetanFlow as a working payroll operations product. Keep demo credentials outside the repo.

## Before You Start

1. Run the backend and frontend together:

   ```sh
   npm run dev
   ```

2. Open `http://127.0.0.1:5173/`, then use `/tour` to introduce the workflow.
3. Open `/login` and sign in with the owner account. When another session exists, use `Use another account` before entering credentials.
4. Keep an employee test account ready in a second browser profile or private window.
5. For a clean repeatable demo state, run:

   ```sh
   npm run demo:bootstrap
   ```

## Owner Flow

1. Show the organization overview, operating priorities, and access controls available to the highest organization role.
2. Open the people workspace and show the employee directory, salary history, digital ID card, private photo, payout readiness, and per-employee ID PDF action.
3. Open setup controls and show departments, work locations, validated organization preference selectors, live formatting previews, and the audit trail.
4. Open Leave and compare the pending manager request, escalated HR request, and closed decisions.
5. Open Attendance and show current-month examples plus locked historical source months.
6. Open Payroll, compare the six historical runs, and inspect variance and calculation snapshots.
7. Show finalized controls, generated payslips, and the immutable run state.
8. Download Bank CSV, Deductions CSV, and Department Cost CSV.

## Role Contrast

1. Sign in as HR and show the people-focused navigation without owner access controls.
2. Sign in as finance and show payroll operations without organization administration.
3. Sign in as manager and show only direct reports, team leave, and personal payroll data.

## Employee Flow

1. Sign in as an employee test user.
2. Show the self-service page and digital ID card.
3. Download the employee's own ID PDF and explain that cross-record requests are concealed.
4. Create a leave request and show leave history.
5. Open the payslip archive.
6. Download a generated payslip through the signed download flow.

## Talking Points

- The frontend never receives the service role key.
- Sensitive payroll writes go through the backend, not direct browser table writes.
- Supabase RLS limits what each signed-in user can read.
- Payroll cannot be generated until attendance is locked.
- Finalized payroll data is protected by database triggers.
- Maker-checker rules prevent the payroll maker from approving or finalizing the same run.
- Payslip Storage objects remain private and are served through short-lived signed URLs.
- UI role differences improve usability; API checks, RLS, grants, and triggers enforce the actual boundary.

## Cleanup

Use temporary records for walkthrough edits when possible. Run `npm run demo:reset` only when you intentionally want to delete and rebuild all showcase transactional data and private payslip objects. For ordinary repair, `npm run demo:bootstrap` is idempotent and preserves the historical showcase cycles.
