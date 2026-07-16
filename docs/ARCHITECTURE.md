# Architecture

## Runtime Shape

```txt
React/Vite frontend
  -> Express API
    -> Supabase Postgres/Auth/Storage
```

The browser uses Supabase only for safe client auth flows with a publishable key. Payroll mutations, role management, exports, and sensitive calculations go through the Express API.

## Why Express

Express is recognizable, simple to explain, and strong enough for this project when paired with TypeScript, Zod validation, clear routes, and tests.

## Core Domains

- Identity: auth users, profiles, organization membership, roles.
- HR master data: departments, locations, employees, employment status.
- Time: attendance entries, leave policies, leave requests, holidays.
- Payroll setup: salary structures, pay components, statutory settings.
- Payroll processing: payroll runs, employee run lines, deductions, net pay, approval status.
- Documents: payslips, tax summaries, employee uploads.
- Controls: audit logs, locked periods, maker-checker approvals.

## Implemented Time Flow

Phase 3 stores leave requests and attendance changes as auditable backend-controlled writes. Employees can request leave, direct managers can review relevant requests, HR/admin can approve or reject, and approved leave feeds attendance summaries. HR/admin can record attendance entries and holidays for a payroll month, then lock that month. Locked months reject attendance and holiday edits at both the API layer and the database trigger layer. The attendance dashboard merges entries, approved leave, holidays, and half-day loss of pay into payroll preview inputs.

## Implemented Payroll Flow

Phase 4A creates draft payroll runs from locked attendance months. The backend refuses payroll creation until attendance is locked, calculates active employee lines with the same attendance summary logic used by the Attendance control UI, stores monetary totals and calculation snapshots in `payroll_run_lines`, and keeps the frontend as a review surface rather than the source of payroll math.

Phase 4B moves runs through `draft -> reviewing -> approved -> finalized`. HR/payroll roles can prepare and submit runs; owner/admin/finance roles can approve and finalize. Finalized payroll runs and finalized run lines are protected by database triggers, so later service-role writes cannot quietly mutate finalized payroll data.

Phase 4C adds run-level payroll adjustments. Payroll teams can add or remove draft/reviewing employee earnings, deductions, and reimbursements; each change regenerates payroll lines with automatic overtime pay from locked attendance, richer India-first statutory fields, adjustment snapshots, and previous-run net-pay variance warnings.

Phase 4D adds maker-checker separation. The user who creates or submits a payroll run cannot approve or finalize that same run, even when they otherwise have an owner/admin/finance role. A different authorized checker must complete approval/finalization, and the frontend mirrors that rule by disabling the blocked actions and explaining that a different checker is required.

## Implemented Output Flow

Phase 5 turns finalized payroll into distributable outputs. The backend generates payslip PDFs only for finalized runs, uploads them to a private Supabase Storage bucket, stores payslip records in Postgres, and creates short-lived signed URLs only after checking the request through the user's RLS-scoped client. Employees can see their own payslip archive, while payroll-facing roles can generate and export outputs from the run detail view.

The same finalized-run boundary protects reports. Bank payout, statutory summary, and department cost exports are generated server-side from payroll snapshots and employee master data. Bank exports validate required bank fields before producing a file, so missing payout data is visible before money movement.

## Deployment Shape

The app deploys as two services plus Supabase:

- Static frontend hosting serves the Vite build from `frontend/dist`.
- A Node web service runs the compiled Express API from `backend/dist/server.js`.
- Supabase Cloud hosts Postgres, Auth, RLS policies, and private Storage buckets.

The frontend receives only publishable Supabase and API URL values. The backend receives the publishable key and service role key, and CORS must allow the deployed frontend origin.

## Security Principles

- No service-role key in the frontend.
- No role selection during signup.
- RLS enabled on exposed Supabase tables.
- Backend validates every request with Zod.
- Payroll runs become immutable once finalized.
- Every pay-impacting change writes an audit log entry.
- Payslip downloads use RLS-checked access before creating signed Storage URLs.
- Payroll export generation stays on the backend.
