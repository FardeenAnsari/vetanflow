# Plan

VetanFlow is a configurable payroll operations product with a React frontend, Express authority layer, Supabase security/data platform, role-shaped workspaces, and a repeatable live showcase.

## Delivered Scope

- [x] React, Express, Supabase, TypeScript, tests, CI, and documentation foundation.
- [x] Supabase Auth, profiles, organization roles, RLS, explicit grants, and server-controlled invitations.
- [x] Employee, department, location, manager, compensation, photo, payment, and audit workflows.
- [x] Employee digital ID plus authorized two-sided PDF download.
- [x] Leave request, manager/HR decision, escalation, cancellation, and history.
- [x] Attendance, holidays, overtime, loss of pay, source-month lock, and database protection.
- [x] Payroll run generation, snapshots, adjustments, variance, maker-checker, and finalization.
- [x] Private payslips, signed delivery, payout CSV, deductions CSV, and department-cost CSV.
- [x] Distinct owner, admin, HR, finance, manager, and employee experiences.
- [x] Validated organization country, currency, locale, and timezone controls.
- [x] Public landing, animated tour, How It Works, journal, Terms, Privacy, and licenses.
- [x] Twelve role accounts, ten employees, six payroll months, 54 lines, and 54 payslips.
- [x] Account switching that prevents persisted owner sessions from hijacking other logins.
- [x] Owner-wide employee ID authority and employee self-only ID authority.
- [x] ID-card print/ribbon animation and complete SVG/transparent PNG brand pack.
- [x] Unified local development, Vercel Express function adapter, and Render alternative.
- [x] Optional frontend/backend Sentry integration.
- [x] Zod input/environment validation, HTTP hardening, least-privilege Data API grants, and live role checks.
- [x] Complete README, Handoff, AI Takeover, architecture, deployment, demo, automation, and phase documentation.

## Current Quality Baseline

- 7 test files and 62 tests passing.
- Frontend/backend lint, typecheck, and production builds passing.
- Deployment preflight passing.
- 15 of 15 live readiness checks passing.
- 12 of 12 account login and authorization checks passing.
- npm audit reports zero vulnerabilities.
- Supabase database lint reports no schema errors.
- Desktop and compact mobile UI checks pass without page-level horizontal overflow.

## Phase 10: Hosted Production Operations

Status: Not started

Goal: prove the current product in a controlled staging environment before adding more product surface.

Planned work:

- [ ] Deploy the Vercel frontend/API shape and connect the intended Supabase project.
- [ ] Add staging and production environment separation.
- [ ] Configure Sentry DSNs, source maps, releases, alerts, and low-volume tracing.
- [ ] Enable Supabase leaked-password protection.
- [ ] Configure branded Auth emails and monitored transactional delivery.
- [ ] Define secret rotation, backup retention, restore tests, log retention, and incident response.
- [ ] Run all 12 role accounts and the employee-to-payslip flow against staging.
- [ ] Add production branch protection and deployment approval policy.
- [ ] Replace evaluation legal text with counsel-reviewed terms before real customer use.
- [ ] Complete independent penetration testing before real payroll data.

Definition of done:

- Staging deploys from GitHub with passing CI.
- Every public route and protected workflow passes end-to-end.
- Monitoring and alerting receive controlled test events.
- Backup restore is documented and proven.
- Auth email delivery and account switching work on the hosted domain.
- No development credentials or showcase secrets remain in production.

## Deliberately Out Of Scope

- Docker-based local or production workflows.
- User-selected roles.
- Hidden global superadmin behavior.
- Country-specific statutory filing or tax-engine claims.
- Real bank transfer execution.
- Production use of showcase credentials or data.
- A broad frontend rewrite before hosted operational proof.

## Decision Queue

1. Confirm the staging and final production domains.
2. Decide whether Vercel serverless limits suit PDF generation or whether Render should host the API.
3. Select transactional email and Sentry alert recipients.
4. Define the first country-specific compliance pack only after the region-neutral core is hosted and stable.
