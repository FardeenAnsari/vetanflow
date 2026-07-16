# Phase Tracker

This file is the source of truth for project progress. Keep one phase active at a time and update it after each meaningful development slice.

## Phase 0 — Foundation

Status: Complete

Goal: Create a clean portfolio-grade base instead of extending the old prototype.

Done:
- Monorepo created with `frontend`, `backend`, `supabase`, and `docs`.
- React + Vite + TypeScript dashboard shell added.
- Express + TypeScript API skeleton added.
- Payroll preview calculation and tests added.
- Supabase schema, seed draft, and cloud CLI workflow added.
- CI workflow added.
- Graphify installed project-locally.
- Handoff, hooks, and automation workflow added.

## Phase 1 — Supabase Project, Auth, And RLS

Status: Complete

Goal: Create/link the fresh Supabase project and make auth/authorization real.

Progress:
- Backend Supabase service client and environment validation added.
- Employees API reads through user-scoped Supabase clients when configured and falls back to fixtures locally.
- Employee create endpoint added for owner/admin/HR server-side writes.
- Email/password sign-in screen added; no signup role selector exists.
- Admin invitation endpoint added for server-controlled role assignment.
- React dashboard now loads employees through the backend API.
- Explicit Data API grants and role-aware read policies added in migrations.
- Fresh Supabase Cloud project `indlpqjabkkdwsrxeokq` created for VetanFlow.
- Migrations applied to the cloud project.
- Demo organization, departments, and employees seeded.
- Supabase security advisors are clean.
- Supabase generated database types added to the backend.
- Local backend/frontend env files added and masked key checks passed.
- Backend smoke test confirms unauthenticated employee access returns 401.
- Demo owner Auth user created and linked to `profiles` + `user_roles`.
- Demo employee Auth user created, linked to `profiles` + `user_roles`, and connected to seeded employee `IND-001`.
- Owner RLS verified: direct Supabase and backend API show all three seeded employees.
- Employee RLS verified: direct Supabase and backend API show only the linked employee row.
- Server-side employee create verified through the backend with owner token, then the temporary row was deleted.

Tasks:
- None.

Blocked:
- None.

Definition of done:
- Fresh Supabase DB is migrated from local SQL.
- Backend can read/write employees through Supabase.
- No role can be selected by the user at signup.
- RLS policies are verified with at least admin and employee scenarios.

## Phase 2 — HR Master Data

Status: Complete

Goal: Build the employee, department, location, and salary setup workflows.

Progress:
- Added `work_locations` and `salary_revisions` tables with RLS.
- Added service-role-only `record_salary_revision` database function for atomic salary revision + employee CTC update + audit log.
- Added advisor-driven index for `salary_revisions.created_by`.
- Seeded three work locations and three initial salary revisions.
- Added generated Supabase types for the new schema.
- Added `/api/hr/master-data`, `/api/hr/departments`, `/api/hr/locations`, and `/api/hr/salary-revisions`.
- Added server-side role checks for department, location, and salary writes.
- Replaced the first dashboard with a role-aware HR master data workspace.
- Added the requested VetanFlow color system: navy, cream, sage, and brown.
- Added a dedicated employee self-service page for employee-only users.
- Added reusable digital employee ID cards to current role surfaces.
- Added a local React Bits-style animated folder component for employee documents.
- Added a Motion-powered skeleton shimmer for initial HR workspace loading.
- Added a backend Supabase WebSocket transport so local Node 20 dev does not break authenticated API calls.
- Added HR employee create/update endpoints with validation, server-side role checks, audit logging, and initial salary revision creation.
- Added an owner/admin/HR employee create/edit form powered by departments and active work locations.
- Added a private Supabase Storage bucket for employee ID photos and `employees.photo_path`.
- Added storage-backed employee photo upload for admin/HR selected employee cards and employee self-service.
- Added department active/archive metadata and audit lookup indexing.
- Added backend department/location edit and archive endpoints with server-side role checks and audit logs.
- Added frontend department/location edit, archive, active-status controls, and inline conflict errors.
- Added hash-based employee profile links through `#employee/<employee-id>`.
- Added audit trail filtering by entity type and employee.
- Verified owner sees all HR records and employee sees only their employee/salary row.
- Verified employee write guard returns 403.
- Verified owner department create and salary revision write with cleanup.
- Verified owner employee create/edit through the browser, verified employee create guard returns 403, and cleaned up the temporary row.
- Verified owner employee photo upload through the browser, verified employee cross-record upload guard returns 403, and cleaned up the temporary row/object.
- Verified owner department/location create, edit, archive, audit visibility, and employee write guard through the live API with cleanup.
- Verified the HR workspace in Chrome with department/location edit/archive controls, audit filter controls, and employee hash route navigation.
- Verified the full repo with `npm run verify`.

Tasks:
- Completed for this phase. Manager/finance-specific workflow pages move to later payroll and approval phases because those workflows do not exist yet.

Definition of done:
- CRUD works through backend + Supabase.
- Forms use validation and clear error feedback.
- Employee data powers the dashboard instead of static arrays.

## Phase 3 — Attendance And Leave

Status: Complete

Goal: Make payable days, leave, holidays, and attendance auditable.

Progress:
- Added manager linkage on employees for leave approval routing.
- Added leave request workflow fields: reason, requested/reviewed/escalated actors, decision notes, approval stage, and timestamps.
- Added direct manager RLS support through `employees.manager_profile_id`.
- Added `/api/leave/dashboard`, `/api/leave/requests`, leave review, and leave cancel endpoints.
- Added employee self-service leave request form and leave history.
- Added owner/admin/HR/manager leave approval queue with approve, reject, and escalate actions.
- Verified employee leave request creation, employee approval guard, admin approval, employee cancellation, and cleanup through the live API.
- Verified the employee and admin leave UI in Chrome with a temporary pending request and cleanup.
- Added attendance status metadata, notes, recorded actor tracking, and updated timestamps to attendance entries.
- Added `attendance_month_locks` for payroll-period attendance locking.
- Added database trigger protection so locked attendance months block attendance and holiday edits.
- Added India-first fixed holiday seed data for Republic Day, Independence Day, and Gandhi Jayanti.
- Added manager-aware attendance RLS so employees see self, direct managers see reports, and payroll/HR roles see organization data.
- Added `/api/attendance/dashboard`, attendance entry upsert, holiday upsert, month lock, and month unlock endpoints.
- Added server-side attendance summary calculation across entries, holidays, approved leave, half-day loss of pay, and payroll preview impact.
- Added the Attendance control UI with period selector, lock status, payroll-impact summary cards, employee summary table, manual attendance form, and holiday calendar.
- Verified live API flow: half-day attendance updated loss-of-pay summary, holiday appeared in the dashboard, locked month rejected writes with `409`, unlock worked, and temporary rows were cleaned up.
- Verified the Attendance control UI in Chrome with live Supabase auth.
- Verified the full repo with `npm run verify`.

Tasks:
- Completed for this phase. Bulk imports and richer leave policy rules move to later payroll/polish phases.

Definition of done:
- A payroll period can calculate unpaid leave from approved/locked data.
- Managers/admins have clear pending approval views.

## Phase 4 — Payroll Engine

Status: Complete

Goal: Turn payroll preview into a real run workflow.

Progress:
- Added payroll run metadata for source attendance month lock and run/line update timestamps.
- Added payroll run indexes for attendance lock lookup and organization/status/period lists.
- Added reusable attendance summary calculation so payroll runs use the same payable-day and loss-of-pay logic as the Attendance control UI.
- Added `/api/payroll/runs`, `/api/payroll/runs/:id`, and `/api/payroll/runs/:id/recalculate`.
- Kept `/api/payroll/preview` intact for direct calculation testing.
- Added draft payroll generation from locked attendance months only.
- Added payroll line snapshots with employee, period, attendance, source lock, and payroll calculation data.
- Added the Payroll runs UI with locked-attendance guard, current-period run cards, run history, run detail loading, and line table.
- Verified live API flow: unlocked payroll creation returned `409`, locked attendance generated a draft run with two active employee lines, half-day loss of pay reduced net pay, list/detail worked, recalculation worked, and temporary rows were cleaned up.
- Verified the Payroll runs UI in Chrome with live Supabase auth.
- Verified the full repo with `npm run verify`.
- Added payroll run submission, approval, and finalization actions.
- Added submitted, approved, and finalized actor/timestamp metadata.
- Added database trigger protection so finalized payroll runs and finalized run lines reject future writes.
- Added Payroll runs UI action controls for Recalculate, Submit, Approve, and Finalize.
- Verified live API flow: draft run submitted to reviewing, approved, blocked recalculation after approval with `409`, finalized, blocked later submit with `409`, rejected direct finalized line update through the database trigger, and temporary rows were cleaned up.
- Verified the Payroll runs approval controls in Chrome with live Supabase auth.
- Verified the full repo with `npm run verify`.
- Added `payroll_adjustments` for run-level employee earnings, deductions, and reimbursements with RLS, explicit Data API grants, audit-friendly metadata, and finalized-run trigger protection.
- Extended payroll calculation snapshots with overtime amount, taxable adjustments, reimbursements, pre/post-tax deductions, ESI, PT, and TDS-ready fields.
- Added `/api/payroll/runs/:id/adjustments` create/delete actions that regenerate draft/reviewing run lines immediately.
- Added automatic overtime pay from locked attendance hours.
- Added previous-run net-pay variance warnings to line snapshots.
- Added Payroll runs UI adjustment form, saved adjustment chips, overtime/adjustment/variance columns, and variance flag metric.
- Verified live API flow: temporary org/user/employee generated a draft run, added an earning adjustment, net pay increased by `1234`, variance warning appeared, deletion restored net pay, and temporary rows were cleaned up.
- Verified the Payroll runs UI in Chrome with live Supabase auth; adjustment form, saved adjustment chip, overtime column, adjustment totals, and variance cell rendered correctly.
- Verified the full repo with `npm run verify`.
- Added maker-checker separation so the payroll creator or submitter cannot approve or finalize the same run.
- Added backend conflict detection for submitter/creator approval attempts with `409` responses.
- Added Payroll runs UI guardrails that disable Approve/Finalize for the maker and show a different-checker notice.
- Verified live API flow: maker submitted a run, maker approve returned `409`, a finance checker approved it, maker finalize returned `409`, and temporary rows/users were cleaned up.
- Verified the Payroll runs UI in the browser with live Supabase auth; the maker saw disabled Approve/Finalize controls and the maker-checker notice.
- Verified the full repo with `npm run verify`.

Tasks:
- Completed: earnings, deductions, reimbursements, automatic overtime amount, ESI, PT, and TDS-ready structure.
- Completed: variance warnings.
- Completed: maker-checker separation between payroll creator/submitter and approver/finalizer.

Definition of done:
- Finalized runs are immutable.
- Payroll lines keep calculation snapshots.
- Tests cover core India payroll scenarios.
- Maker and checker duties are separated for approval and finalization.

## Phase 5 — Payslips, Reports, And Exports

Status: Complete

Goal: Produce polished outputs that look like a real payroll product.

Progress:
- Added private Supabase Storage bucket support for generated payslip PDFs.
- Added finalized-run payslip generation with PDF rendering, storage upload, payslip records, and audit logs.
- Added signed payslip download endpoint protected by user-scoped RLS checks before the service role creates a URL.
- Added employee self-service payslip archive with period, gross/deduction/net pay, status, and download action.
- Added employee bank account fields with India IFSC/account-number validation.
- Added HR-maintained bank detail form fields and masked bank-readiness display.
- Added finalized payroll CSV exports for bank payout, statutory summary, and department cost reports.
- Added Payroll runs export controls for Bank CSV, Statutory CSV, and Cost CSV.
- Added focused backend tests for payslip PDFs and payroll CSV export builders.
- Pushed Phase 5 migrations to Supabase Cloud and regenerated Supabase database types.
- Verified live Supabase Phase 5 schema access for employee bank columns and payslip table access.
- Verified live temporary payroll export smoke for bank payout, statutory summary, and department cost CSVs with cleanup.
- Verified live temporary payslip generation, signed download, PDF fetch, and cleanup.
- Verified the full repo with `npm run verify`.

Tasks:
- Completed: Payslip PDF generation.
- Completed: Employee payslip portal.
- Completed: Bank payout export.
- Completed: PF/ESI/PT/TDS-ready report exports.
- Completed: Payroll cost reports by department.

Definition of done:
- Demo user can finalize a run and download a payslip/report.

## Phase 6 — Polish, Deployment, And Demo

Status: Complete for local review/demo

Goal: Make the project easy to review, run, and discuss in a walkthrough.

Progress:
- Refreshed the public README with current architecture, feature set, setup path, and study flow.
- Added deployment notes for Supabase Cloud, backend hosting, and frontend hosting.
- Hardened CI with `npm ci`, read-only permissions, concurrency, timeout, and Node 24 targeting.
- Added demo walkthrough, recorded demo script, screenshot guide, screenshot manifest, and reset checklist.
- Added `npm run demo:check` to verify Supabase demo readiness.
- Added `npm run demo:prepare` to idempotently prepare the September 2026 demo month.
- Added `npm run demo:reset` to clean the linked Supabase demo data and rebuild the September 2026 demo month.
- Added public and authenticated screenshot automation, including owner/admin and employee self-service flows.
- Captured refreshed screenshots in `docs/screenshots/` for sign-in, owner/admin payroll review, and employee self-service.
- Fixed employee payslip portal loading when employee RLS hides nested payroll run metadata.
- Cleaned remote demo data down to three seeded active employees, one September 2026 finalized run, three run lines, and three payslips.
- Updated payroll UI polish so selected-run metrics and header actions reflect the displayed run.
- Verified demo readiness and the full repo after cleanup.

Tasks:
- Optional follow-up: choose production hosts and perform a live deployment using `docs/DEPLOYMENT.md`.

Definition of done:
- A reviewer can run the local demo, inspect the repo, and understand the architecture in under 10 minutes.
