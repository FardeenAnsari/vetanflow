# Demo Walkthrough

Use this script to show VetanFlow as a working payroll operations product. Keep demo credentials outside the repo.

## Before You Start

1. Run the backend and frontend:

   ```sh
   npm run dev:backend
   npm run dev:frontend
   ```

2. Open `http://127.0.0.1:5173/`.
3. Sign in with an owner/admin test account.
4. Keep an employee test account ready in a second browser profile or private window.
5. For a clean repeatable demo state, run:

   ```sh
   npm run demo:reset
   npm run demo:check
   ```

## Owner/Admin Flow

1. Open the HR workspace and show the employee directory, selected profile panel, salary history, digital ID card, and private photo-backed profile image.
2. Edit an employee's non-salary details, then point out the audit trail.
3. Open setup controls and show department/location edit or archive behavior.
4. Create or review a leave request from the approval queue.
5. Open Attendance control and show that the September 2026 payroll month is already locked for the prepared run.
6. Open Payroll runs, select the September 2026 finalized run, and inspect run lines.
7. Show the finalized-state controls, payslip generation state, and immutable run behavior.
8. Download Bank CSV, Statutory CSV, and Department Cost CSV.
9. Mention that draft/review/approval can be shown with temporary records when needed, then reset with `npm run demo:reset`.

## Employee Flow

1. Sign in as an employee test user.
2. Show the self-service page and digital ID card.
3. Create a leave request and show leave history.
4. Open the payslip archive.
5. Download a generated payslip through the signed download flow.

## Talking Points

- The frontend never receives the service role key.
- Sensitive payroll writes go through the backend, not direct browser table writes.
- Supabase RLS limits what each signed-in user can read.
- Payroll cannot be generated until attendance is locked.
- Finalized payroll data is protected by database triggers.
- Maker-checker rules prevent the payroll maker from approving or finalizing the same run.
- Payslip Storage objects remain private and are served through short-lived signed URLs.

## Cleanup

Use temporary records for walkthrough edits when possible. Run `npm run demo:reset` after a live demo to restore the clean September 2026 walkthrough data.
