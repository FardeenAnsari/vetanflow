# AI Development Takeover

This is the authoritative resume document for an AI model or engineer taking over VetanFlow. Read it before changing code. It connects product intent, architecture, security boundaries, live data, verification, and the exact continuation point without exposing secrets.

## Resume Point

- Phases 0 through 10 are complete; Phase 10 closed on October 17, 2026. Login/security maintenance and documentation were refreshed on October 20; Phase 11 is not complete.
- The current product is a working React, Express, and Supabase payroll operations system, not the discarded prototype that preceded this repository.
- The live Supabase sample contains 12 role accounts, 24 Indian employees, and nine finalized INR payroll months with 198 published payslips. Organization defaults are IN/INR/en-IN/Asia/Kolkata.
- Account switching is explicit at `/login`; a stored Supabase session no longer silently forces every login attempt into the owner workspace.
- Owner is the highest organization role and can export any visible employee ID card. Employees can export only their own.
- Organization country, currency, locale, and timezone are validated selections that drive formatting and reporting behavior.
- The frontend and API can run together with `npm run dev` and can deploy together through the Vercel function adapter in `api/[...path].ts`.
- Phase 10 changes are uncommitted and have not been pushed or redeployed. Phase 11 should stage these changes against the existing hosted configuration and address operational hardening. Do not assume an older hosted deployment matches this working tree.
- Read `docs/DEMO_USABILITY_AUDIT.md` and `docs/DEMO_GUIDE.md` for current evidence, account names, known risks, and presentation steps.
- Read `docs/RELEASE_READINESS.md` before committing or deploying. It records the current security findings, release gates, unrelated untracked material, and launch limitations.

## Read In This Order

1. `README.md`: product story, complete workflow, setup, showcase, and study path.
2. `docs/AI_TAKEOVER.md`: current resume context and non-negotiable rules.
3. `docs/ARCHITECTURE.md`: runtime, trust boundaries, domains, and data flow.
4. `docs/PHASES.md`: historical delivery record and phase definitions of done.
5. `docs/HANDOFF.md`: concise current status, verification evidence, and next work.
6. `docs/DEPLOYMENT.md`: current Vercel, Render, Supabase, and Sentry deployment paths.
7. `supabase/migrations/`: executable database history and the final authority for schema/security.
8. `backend/src/modules/`: domain rules, repositories, PDF/CSV generation, and authorization.
9. `frontend/src/App.tsx` for lazy routing, then `frontend/src/WorkspaceApp.tsx` for authenticated workflows.
10. `scripts/`: repeatable showcase provisioning, checks, screenshots, and handoff automation.

## Product Contract

VetanFlow owns the operational path from employee setup to private payroll documents:

1. An authorized operator creates or invites an organization member.
2. HR creates the employee record, reporting line, compensation history, photo, and payment profile.
3. Employees request leave; managers and HR review or escalate it.
4. HR records attendance and holidays, then locks the source month.
5. Payroll creates a run from the locked month and stores calculation snapshots.
6. Adjustments and variance warnings are reviewed.
7. A different authorized checker approves and finalizes the run.
8. The finalized run becomes immutable.
9. The backend generates private payslips and finance CSV exports.
10. Employees access only their own published documents.

The engine remains configurable, but the sample people, offices, preferences, and history are Indian/INR. Country-specific statutory compliance, tax filing, banking integrations, and government submissions are outside the current product contract. INR formatting does not implement PF, ESI, TDS, or filings.

## Stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS | public site, role workspaces, forms, tables, responsive UX |
| Motion | Motion for React | tour, loading, feedback, and ID-card print/ribbon animation |
| API | Express 5, TypeScript, Zod | Auth context, authorization, validation, business rules, PDFs, CSVs |
| Data | Supabase Postgres | tenant data, RLS, grants, indexes, triggers, immutable payroll records |
| Identity | Supabase Auth | email/password identities and browser sessions |
| Files | Supabase Storage | private employee photos and private payslip PDFs |
| Monitoring | Sentry SDKs | optional frontend/backend tracing and error capture when DSNs are set |
| Tests | Vitest, Supertest | payroll, API, Auth context, documents, and exports |
| Automation | npm scripts, GitHub Actions, Husky, Supabase CLI | checks, cloud migrations, seed, screenshots, handoff |
| Knowledge | Graphify | generated code/document relationship graph in `graphify-out/` |

Use Node.js 22 or newer. `.nvmrc` and CI target Node 24.

## Runtime And Trust Boundary

```text
Browser
  -> Supabase Auth with publishable key
  -> Express API with Bearer token
       -> resolves profile, organization, and roles
       -> validates input with Zod
       -> uses user-scoped Supabase client for RLS reads
       -> uses service client only after explicit role and tenant checks
       -> writes audit events and immutable snapshots
  -> Supabase Postgres and private Storage
```

Never move payroll authority into the browser. UI hiding is for usability; API authorization, RLS, grants, and database triggers are the security controls.

## Public And Authenticated Routes

| Route | Surface |
| --- | --- |
| `/` | landing page with current product imagery |
| `/tour` | pausable employee-to-payslip walkthrough |
| `/how-it-works` | workflow and control model |
| `/blog` and `/blog/:slug` | product journal |
| `/terms` | evaluation terms |
| `/privacy` | privacy summary |
| `/licenses` | product evaluation and third-party licenses |
| `/login` | sign-in and stored-session account switcher |
| `/app` | authenticated role workspace |
| `/demo` | named role/account entry; local shortcut only when explicitly enabled, normal sign-in on hosted builds |

The authenticated workspace uses hash sections including `overview`, `self`, `employees`, `leave`, `attendance`, `payroll`, `organization`, `access`, and `audit`. Every operational role has My profile & pay, resolved through the authenticated `currentEmployeeId`, never the directory selection. Employee self-service has separate overview/profile/pay/leave views.

## Role Model

Application roles are `owner`, `admin`, `hr`, `finance`, `manager`, and `employee`.

| Role | Intended scope |
| --- | --- |
| Owner | entire organization, settings, access, HR, payroll, exports, audit, every employee ID card |
| Admin | broad organization operations and permitted member administration |
| HR | employee lifecycle, compensation history, leave, attendance, organization setup, payroll preparation |
| Finance | personal record, payroll-wide operations, payment readiness, approval/finalization, exports; no access/organization/audit navigation |
| Manager | self plus direct reports, team attendance, leave decisions and escalation |
| Employee | own employee record, digital ID, leave, compensation history, and payslips |

Role priority is owner, admin, HR, finance, manager, employee. The frontend matrix lives in `frontend/src/components/workspace-navigation-model.ts`. Backend route permissions and repository scoping remain authoritative.

## Authentication And Account Switching

- The browser client is created in `frontend/src/lib/supabase.ts`.
- `/login` checks the persisted Supabase session.
- When a session exists, the user sees the current email and chooses either `Continue` or `Use another account`.
- `Use another account` performs a local-scope sign-out and returns to a clean sign-in form.
- Password sign-in uses an isolated nonpersistent client with its own storage key. `frontend/src/lib/workspace-auth.ts` validates `/api/auth/workspace` before installing the shared browser session, then redirects to `/app`. Failed attempts preserve an existing valid session.
- `backend/src/modules/auth/workspace-access.ts` resolves only the verified user's profile, organization, and roles. Old `.test` Auth identities have no workspace assignment and must not receive guessed roles.
- `WorkspaceApp.tsx` ignores stale per-domain results and gates master data on the current token. Auth events supersede initial session restoration. Switching in one tab updates other tabs sharing that session.
- Workspace sign-out also clears only the local browser session and returns to `/login`.
- The backend verifies Bearer tokens and resolves organization/profile/roles before domain work.
- Users never choose their own role during signup.
- `backend/src/modules/auth/employee-account-link.ts` links employee records and profiles by normalized exact email within one organization, in either creation order. Duplicate/ambiguous matches fail closed. Linked work emails cannot be changed independently of their login account.
- `backend/src/modules/demo/demo-router.ts` is an explicitly enabled localhost-only developer convenience. It reads ignored local credentials, creates real sessions, verifies stored roles, and refuses production mode. Never expose its credentials/session shortcut publicly.
- Request timeouts live in `frontend/src/lib/api-client.ts`; sign-out removes only the current project's local session keys.

## API Map

| Module | Main responsibility |
| --- | --- |
| `backend/src/routes/health.ts` | service health |
| `backend/src/routes/auth.ts` | verified candidate workspace context before session installation |
| `backend/src/routes/hr.ts` | master data, organization settings, employees, photos, ID PDFs, salary revisions |
| `backend/src/routes/invitations.ts` | organization members and hierarchy-safe invitations |
| `backend/src/routes/leave.ts` | leave dashboard, request, review, escalation, cancellation |
| `backend/src/routes/attendance.ts` | entries, holidays, summaries, month lock/unlock |
| `backend/src/routes/payroll.ts` | preview, runs, adjustments, transitions, payslips, downloads, exports |

`backend/src/app.ts` applies Helmet, explicit CORS, a 100 KB JSON body cap, no-store API response headers, API rate limiting, Sentry error handling, and a generic final error response. Production configuration fails fast when Supabase or trusted CORS values are missing. In-memory rate limits remain per process, not globally durable across serverless instances.

## Database Map

The public schema currently centers on:

- `organizations`
- `profiles`
- `user_roles`
- `departments`
- `work_locations`
- `employees`
- `salary_revisions`
- `leave_requests`
- `attendance_entries`
- `attendance_month_locks`
- `holidays`
- `payroll_runs`
- `payroll_run_lines`
- `payroll_adjustments`
- `payslips`
- `audit_logs`

Private Storage buckets:

- `employee-photos`
- `payslips`

Important invariants:

- Public tables use RLS.
- `anon` has no public-table privileges.
- `authenticated` has read privileges only where intended; sensitive employee fields use restricted grants.
- Service-role writes happen only in backend/scripts after tenant and role checks.
- Locked attendance periods reject attendance/holiday mutation.
- Finalized runs, lines, and adjustments reject mutation at the database layer.
- The payroll maker/submitter cannot approve or finalize the same run.
- Employee cross-record ID-card access is concealed with `404`.

## Live Showcase State

Supabase project reference: `indlpqjabkkdwsrxeokq`.

The current seeded state is:

| Data | Count |
| --- | ---: |
| Auth-linked profiles | 12 |
| Role assignments | 12 |
| Employees | 24 |
| Salary revisions | 72 |
| Attendance entries | 6,270 |
| Leave requests | 24 |
| Payroll runs | 9 |
| Payroll run lines | 198 |
| Payroll adjustments | 27 |
| Published payslips | 198 |

Account distribution:

- 1 owner
- 2 admins
- 2 HR users
- 2 finance users
- 2 managers
- 3 employees

Each role shares one role-specific showcase password. The owner uses the user-supplied owner password. All credentials are stored only in ignored `.tmp/demo-credentials.json` with local owner-only permissions. Never paste that file into source, documentation, screenshots, issues, or commits.

`scripts/bootstrap-showcase.mjs` seeds six previous calendar months using offsets `-6` through `-1`, then runs readiness and all-account authorization checks.

On October 17 the user explicitly approved rebuilding the six legacy synthetic periods in INR. Original records remain in `.tmp/before-india-refresh-*.json`; targeted records and 54 old PDFs remain in `.tmp/legacy-history-backup-*/`. The guarded one-time reset was limited to January-June 2026. July-September monetary amounts, identities, current attendance, and leave records were retained. Attendance summary metadata was reconciled to daily records, and all 198 current PDFs were refreshed. The user subsequently approved deleting the 54 obsolete cloud PDFs; that deletion completed with a private cleanup receipt and all 198 current PDFs retained. Local backups were not removed.

`scripts/sql/verify-inr-history.sql` currently asserts the nine-period/198-line snapshot. It is sample-specific, not a generic production validator. `scripts/backup-legacy-inr-history.ts`, `scripts/sql/rebuild-legacy-inr-history.sql`, and `scripts/sql/repair-sample-attendance-snapshots.sql` document completed maintenance, not ordinary runtime behavior. Do not rerun the reset against reconciled history or real payroll.

## ID Card And Brand System

- `frontend/src/components/EmployeeIdCard.tsx` renders the digital card.
- `backend/src/modules/hr/employee-id-card-service.ts` generates the two-sided PDF.
- `frontend/src/components/IdCardPrintAnimation.tsx` stages secure queue, printing, ribbon attachment, and completion before download.
- Owner can request any employee card visible in the organization.
- Employees can request only their own card.
- Brand assets live in `frontend/public/brand/` and include static, inverse, wordmark, animated SVG, and transparent PNG variants.
- `frontend/src/components/BrandLogo.tsx` is the application logo component.

## Organization Preferences

`frontend/src/lib/organization-options.ts` provides supported country, currency, locale, and timezone lists. Country selection applies sensible defaults. The backend validates:

- organization name
- ISO country code
- three-letter currency code
- locale
- IANA timezone

Saved values drive currency rendering, localized document dates, organization labels, and reporting-cutoff previews. Do not replace these controls with free-text inputs.

The API rejects currency changes after the first payroll run. New line snapshots include `money.currencyCode`/`money.locale`; PDFs use those values instead of later organization defaults. Currency codes must be supported ISO values, not merely three characters.

## Environment Variables

Backend-only:

```text
PORT
CORS_ORIGIN
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
PAYROLL_CURRENCY
PAYROLL_LOCALE
SENTRY_DSN
SENTRY_ENVIRONMENT
SENTRY_TRACES_SAMPLE_RATE
```

Frontend-safe:

```text
VITE_API_BASE_URL
VITE_DEFAULT_CURRENCY
VITE_DEFAULT_LOCALE
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SENTRY_DSN
VITE_SENTRY_ENVIRONMENT
VITE_SENTRY_TRACES_SAMPLE_RATE
```

Never create a `VITE_*` service-role variable. Local `.env` files are ignored; `.env.example` files are tracked.

## Commands

```sh
npm install                 # install all workspaces
npm run dev                 # API on 4000 and Vite on 5173 or next free port
npm run verify              # secret checks, lint, typecheck, scanner/API/UI tests, builds
npm run security:check -- --history # current source/build and reachable history scan
npm run deploy:check        # deployment-file and env-shape preflight
npm run demo:bootstrap      # idempotent 12-account, six-month showcase build
npm run demo:check          # 15 live readiness assertions
npm run demo:check-logins   # all 12 accounts plus record visibility and ID authorization
npm run demo:reset          # destructive showcase-only rebuild; use deliberately
npm run supabase:push       # apply linked migrations
npm run supabase:types      # regenerate backend database types
npm run handoff:update      # regenerate handoff snapshot
npm run graphify:update     # refresh the phase-level knowledge graph
npm run demo                # explicitly enabled local role entry and both dev servers
npm run demo:users          # print local ignored credentials; do not publish the output
npm run demo:check-ui       # Chrome role/navigation/mobile/download proof
```

When Vite moves off `5173`, add the selected frontend origin to backend `CORS_ORIGIN` before testing authenticated requests.

## Verification Baseline

Current October 20 baseline (earlier Phase 10 browser/data evidence remains in the audit):

- `npm run verify`: 103 tests passed (94 backend, 5 frontend, 4 scanner regressions); lint, typecheck, frontend build, and backend build passed.
- `npm run deploy:check`: passed.
- `npm run demo:check`: 15 passed, 0 warnings, 0 failures.
- `npm run demo:check-logins`: 12 of 12 accounts passed.
- Owner ID authorization: multiple employee cards returned `200`.
- Employee ID authorization: own card returned `200`; cross-record card returned `404`.
- `npm audit --audit-level=moderate`: 0 vulnerabilities.
- Fresh management SQL confirmed RLS on all 16 public tables, no anonymous public-table access or direct authenticated writes, both private buckets, and no public execution of the security-definer function. The security advisor reports only disabled leaked-password protection; performance advice contains 26 informational unused-index findings. Earlier Phase 10 guard probes rejected finalized payroll/locked attendance writes.
- Nine periods and 198 lines passed currency, identity, monetary, attendance, maker/checker, and publication reconciliation. All PDFs refreshed, with one downloaded/inspected per month.
- `scripts/check-live-onboarding.ts --write-sample` passed both creation orders and cleanup, self-only visibility, duplicate-email 409, and currency-change 409. This does not verify invitation email delivery.
- Responsive browser checks passed on desktop and compact mobile widths without page-level horizontal overflow.
- October 20 browser checks passed repeated account switching, failed-password preservation, valid-password retry, and cross-tab identity changes. Current credentials and build/history scans produced no findings; no commit/push/deployment occurred.

The local machine may print a Supabase SDK deprecation warning under Node 20. Use the required Node 22+ runtime; do not add code to preserve Node 20 as a production target.

## Deployment

Preferred compact deployment:

- one Vercel project serves `frontend/dist`
- `/api/*` rewrites to `api/[...path].ts`, which exports the Express app
- Supabase Cloud provides Auth, Postgres, RLS, and Storage
- Sentry activates when frontend/backend DSNs are configured

Alternative deployment:

- Vercel serves the frontend
- Render runs `backend/dist/server.js` using `render.yaml`
- `VITE_API_BASE_URL` points at Render
- Render CORS explicitly trusts the frontend origin

See `docs/DEPLOYMENT.md` before hosting.

## Design Rules

- This is a dense operational product, not a marketing dashboard inside the authenticated area.
- Keep role workspaces materially different in navigation, priority, data scope, and actions.
- Use semantic green, amber, red, and neutral states for success, review, blockers, and information.
- Preserve visible focus, keyboard access, reduced-motion behavior, stable dimensions, and mobile containment.
- Use the existing navy, cream, sage, brown, blue, and semantic status palette without turning the UI into a one-color theme.
- Avoid nested cards, decorative blobs, oversized panel headings, emoji icons, and explanatory UI copy that belongs in documentation.
- Use Lucide icons where an icon exists.

## Working Agreements

- Do not use Docker for this project.
- Use migration-first database changes.
- Use Zod at every external input boundary.
- Never trust organization, employee, payroll-run, or role identifiers supplied by the browser without server-side scope checks.
- Never expose the service-role key.
- Never bypass finalized-payroll or attendance-lock triggers in normal workflows. The only exception in this batch was explicitly approved, backed-up synthetic maintenance in a guarded transaction with protections restored before commit.
- Never let users self-assign roles.
- Never run `demo:reset` against an unrelated or shared organization.
- Preserve unrelated user changes in a dirty worktree.
- Use `apply_patch` for manual edits.
- Update `docs/HANDOFF.md`, `docs/PHASES.md`, and Graphify only at phase completion or by explicit request.
- Run `npm run verify` before committing.
- Keep secrets and generated credential files out of Git.

## Known External Work

The current workflow batch is implemented and tested, but commercial production operation still requires additional work:

1. Deploy and connect real domains.
2. Configure Sentry DSNs and alert routing.
3. Enable Supabase leaked-password protection in the Auth dashboard.
4. Configure a monitored transactional email provider and branded Auth templates.
5. Define backups, restore tests, log retention, incident response, and secret rotation.
6. Replace evaluation legal copy with counsel-reviewed commercial terms and privacy documents.
7. Commission an independent penetration test before handling real payroll data.
8. Add country-specific compliance modules only as separate, tested policy packs.
9. Add database uniqueness for organization/profile and normalized employee emails. Current application checks do not eliminate concurrent-create races.
10. Recheck cloud advisors after deployment/configuration changes. Connector access recovered on October 20; the current security warning is disabled leaked-password protection. Never expose backend/database credentials in documentation or committed commands.
11. Use shared rate-limit storage for serverless/multi-instance enforcement. Current in-memory limits reset per process and are not a global quota.

## Safe Takeover Procedure

1. Run `git status --short` and do not discard existing changes.
2. Run `nvm use` and confirm Node 22+.
3. Read this file and `docs/HANDOFF.md`.
4. Run `npm install` only when dependencies are missing.
5. Run `npm run verify` before changing behavior.
6. For live work, confirm the linked Supabase project and environment files without printing secrets.
7. Start with `npm run dev`.
8. Make the smallest change consistent with current module boundaries.
9. Add focused tests for authorization, payroll math, documents, or shared behavior.
10. Re-run the relevant live and local checks.
11. At a full phase close, update Phase Tracker, Handoff, Graphify, README, and this document.

## Where To Continue

The recommended next phase is **Phase 11: Hosted Operations And Remaining Hardening**. Inspect the existing deployment first, stage the uncommitted changes using the Vercel plus Supabase shape, add database concurrency constraints, then verify Sentry, Auth email delivery, backups/restores, and the complete staging workflow. Do not start another broad UI redesign before that operational baseline exists.
