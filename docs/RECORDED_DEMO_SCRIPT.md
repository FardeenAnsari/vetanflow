# Recorded Demo Script

Use this when recording a 6 to 8 minute product walkthrough. Keep the pace calm. Show the app, then name the backend and database control behind each important action.

## Setup

- Browser 1: owner account signed in.
- Browser 2: employee account signed in.
- Terminal: keep `npm run verify` output ready, but do not show env files.
- Terminal: run `npm run demo:check` before recording and fix any failed checks.
- Screenshots folder: keep `docs/screenshots/` open if you want to show captured proof.
- Demo data: use the previous month as the current close and the month before it as the variance baseline.
- Run `npm run demo:bootstrap` before recording; the periods move with the calendar.
- Signed-in screenshots should use `DEMO_SCREENSHOT_EXPECT_TEXT` so login-state mistakes fail before images are saved.

## 0:00 to 0:45, Opening

Say:

> This is VetanFlow, a configurable payroll operations system built with React, Express, and Supabase. It covers the month-end flow from employee setup to attendance locking, payroll approval, payslips, and exports.

Show:

- Public landing and animated `/tour`.
- Sign-in/account-switch screen at `/login`.
- Mention invited work accounts.
- Do not mention secrets or internal env values.

Proof point:

- The app uses Supabase Auth, but payroll writes and exports go through the Express backend.

## 0:45 to 1:45, HR Master Data

Say:

> The HR workspace owns employee data, department and location setup, salary history, bank readiness, photos, and audit history. The frontend shows the workflow, while the backend enforces role checks.

Show:

- Employee directory.
- Selected employee profile.
- Digital ID card.
- Owner download of a selected employee's two-sided ID PDF and the print/ribbon animation.
- Salary history.
- Bank readiness panel.
- Organization country, currency, locale, and timezone selectors with live workflow previews.
- Audit trail.

Proof point:

- Employee photos live in a private Supabase Storage bucket and render through signed URLs.

## 1:45 to 2:45, Leave And Attendance

Say:

> Payroll depends on clean time data. Employees can request leave, managers or HR can review it, and attendance summaries calculate payable days, holidays, half-days, overtime, and loss of pay.

Show:

- Leave request or approval queue.
- Attendance control.
- Payroll-impact summary.
- Locked month state.

Proof point:

- Locked attendance months reject later attendance and holiday edits through backend checks and database triggers.

## 2:45 to 4:15, Payroll Run

Say:

> Payroll runs are generated only from locked attendance. Each line stores a calculation snapshot, so finalized payroll remains explainable later.

Show:

- Payroll runs list.
- Period filter set to the previous calendar month.
- Latest finalized run detail, then the preceding run for variance context.
- Employee line table.
- Adjustment form.
- Variance warning, if present.

Proof point:

- Adjustments regenerate draft or reviewing runs, but approved and finalized runs are protected.

## 4:15 to 5:15, Approval Control

Say:

> The maker-checker rule prevents the person who prepared or submitted payroll from approving or finalizing that same run. A different authorized checker has to complete it.

Show:

- Submit, approve, and finalize controls.
- Disabled maker action, if using the maker account.
- Finalized status.

Proof point:

- The backend returns conflict responses for maker approval attempts, and database triggers protect finalized rows.

## 5:15 to 6:30, Payslips And Exports

Say:

> Once the run is finalized, the backend generates payslip PDFs, uploads them privately, and creates signed download links only after checking the signed-in user's access.

Show:

- Generate payslips action.
- Employee payslip archive.
- Payslip download.
- Bank CSV, Deductions CSV, Department Cost CSV actions.

Proof point:

- Bank exports check required bank fields before creating a payout file.

## 6:30 to 7:15, Engineering Close

Say:

> The main design choice is simple: the browser does not own payroll authority. React handles the workflow, Express validates and performs sensitive operations, and Supabase stores the data with RLS, Auth, audit logs, and private Storage.

Show:

- `npm run verify` result.
- `docs/ARCHITECTURE.md`.
- `supabase/migrations/`.
- `backend/src/modules/payroll/`.

Proof point:

- The repo has tests for payroll calculations, maker-checker logic, payslip generation, and CSV exports.

## Short Version

For a 3 minute walkthrough:

1. Show sign-in and role-controlled access.
2. Show employee profile, downloadable ID card, bank readiness, and audit trail.
3. Show attendance lock feeding payroll.
4. Show payroll run, maker-checker approval, and finalization.
5. Show payslip download and CSV exports.
6. End with the architecture: React for workflow, Express for authority, Supabase for Auth/RLS/Storage.

## Things To Avoid On Recording

- Do not open `.env` files.
- Do not show Supabase service role keys, dashboard secrets, or database passwords.
- Do not use real employee data.
- Do not spend time explaining every table. Show the workflow first, then name the controls that protect it.
