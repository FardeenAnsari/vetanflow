# AI Development Takeover

This is the authoritative resume document for an AI model or engineer taking over VetanFlow. Read it before changing code. It connects product intent, architecture, security boundaries, live data, verification, and the exact continuation point without exposing secrets.

## Resume Point

- Phases 0 through 9 are complete.
- The current product is a working React, Express, and Supabase payroll operations system, not the discarded prototype that preceded this repository.
- The live Supabase showcase contains 12 role accounts, 10 employees, and six finalized payroll months with published payslips.
- Account switching is explicit at `/login`; a stored Supabase session no longer silently forces every login attempt into the owner workspace.
- Owner is the highest organization role and can export any visible employee ID card. Employees can export only their own.
- Organization country, currency, locale, and timezone are validated selections that drive formatting and reporting behavior.
- The frontend and API can run together with `npm run dev` and can deploy together through the Vercel function adapter in `api/[...path].ts`.
- No feature phase is currently active. The next meaningful milestone is a real hosted production deployment and operational hardening.

## Read In This Order

1. `README.md`: product story, complete workflow, setup, showcase, and study path.
2. `docs/AI_TAKEOVER.md`: current resume context and non-negotiable rules.
3. `docs/ARCHITECTURE.md`: runtime, trust boundaries, domains, and data flow.
4. `docs/PHASES.md`: historical delivery record and phase definitions of done.
5. `docs/HANDOFF.md`: concise current status, verification evidence, and next work.
6. `docs/DEPLOYMENT.md`: current Vercel, Render, Supabase, and Sentry deployment paths.
7. `supabase/migrations/`: executable database history and the final authority for schema/security.
8. `backend/src/modules/`: domain rules, repositories, PDF/CSV generation, and authorization.
9. `frontend/src/App.tsx`: authenticated application composition and role workflows.
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

The system is deliberately region-neutral. Country-specific statutory compliance packs, tax filing, banking integrations, and government submissions are outside the current product contract.

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

The authenticated workspace uses hash sections for `overview`, `employees`, `leave`, `attendance`, `payroll`, `organization`, `access`, and `audit`.

## Role Model

Application roles are `owner`, `admin`, `hr`, `finance`, `manager`, and `employee`.

| Role | Intended scope |
| --- | --- |
| Owner | entire organization, settings, access, HR, payroll, exports, audit, every employee ID card |
| Admin | broad organization operations and permitted member administration |
| HR | employee lifecycle, compensation history, leave, attendance, organization setup, payroll preparation |
| Finance | payroll-wide operations, payment readiness, approval/finalization, exports, audit |
| Manager | self plus direct reports, team attendance, leave decisions and escalation |
| Employee | own employee record, digital ID, leave, compensation history, and payslips |

Role priority is owner, admin, HR, finance, manager, employee. The frontend matrix lives in `frontend/src/components/workspace-navigation-model.ts`. Backend route permissions and repository scoping remain authoritative.

## Authentication And Account Switching

- The browser client is created in `frontend/src/lib/supabase.ts`.
- `/login` checks the persisted Supabase session.
- When a session exists, the user sees the current email and chooses either `Continue` or `Use another account`.
- `Use another account` performs a local-scope sign-out and returns to a clean sign-in form.
- Successful sign-in redirects to `/app`.
- Workspace sign-out also clears only the local browser session and returns to `/login`.
- The backend verifies Bearer tokens and resolves organization/profile/roles before domain work.
- Users never choose their own role during signup.

## API Map

| Module | Main responsibility |
| --- | --- |
| `backend/src/routes/health.ts` | service health |
| `backend/src/routes/hr.ts` | master data, organization settings, employees, photos, ID PDFs, salary revisions |
| `backend/src/routes/invitations.ts` | organization members and hierarchy-safe invitations |
| `backend/src/routes/leave.ts` | leave dashboard, request, review, escalation, cancellation |
| `backend/src/routes/attendance.ts` | entries, holidays, summaries, month lock/unlock |
| `backend/src/routes/payroll.ts` | preview, runs, adjustments, transitions, payslips, downloads, exports |

`backend/src/app.ts` applies Helmet, explicit CORS, a 100 KB JSON body cap, API rate limiting, Sentry error handling, and a generic final error response. Production configuration fails fast when Supabase or trusted CORS values are missing.

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
| Employees | 10 |
| Salary revisions | 12 |
| Attendance entries | 216 |
| Leave requests | 5 |
| Payroll runs | 6 |
| Payroll run lines | 54 |
| Payroll adjustments | 18 |
| Published payslips | 54 |
| Audit logs at final verification | 51 |

Account distribution:

- 1 owner
- 2 admins
- 2 HR users
- 2 finance users
- 2 managers
- 3 employees

Each role shares one role-specific showcase password. The owner uses the user-supplied owner password. All credentials are stored only in ignored `.tmp/demo-credentials.json` with local owner-only permissions. Never paste that file into source, documentation, screenshots, issues, or commits.

`scripts/bootstrap-showcase.mjs` seeds six previous calendar months using offsets `-6` through `-1`, then runs readiness and all-account authorization checks.

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
npm run verify              # lint, typecheck, 62 tests, frontend/backend builds
npm run deploy:check        # deployment-file and env-shape preflight
npm run demo:bootstrap      # idempotent 12-account, six-month showcase build
npm run demo:check          # 15 live readiness assertions
npm run demo:check-logins   # all 12 accounts plus record visibility and ID authorization
npm run demo:reset          # destructive showcase-only rebuild; use deliberately
npm run supabase:push       # apply linked migrations
npm run supabase:types      # regenerate backend database types
npm run handoff:update      # regenerate handoff snapshot
npm run graphify:update     # refresh the phase-level knowledge graph
```

When Vite moves off `5173`, add the selected frontend origin to backend `CORS_ORIGIN` before testing authenticated requests.

## Verification Baseline

At Phase 9 closeout:

- `npm run verify`: 7 test files and 62 tests passed; lint, typecheck, frontend build, and backend build passed.
- `npm run deploy:check`: passed.
- `npm run demo:check`: 15 passed, 0 warnings, 0 failures.
- `npm run demo:check-logins`: 12 of 12 accounts passed.
- Owner ID authorization: multiple employee cards returned `200`.
- Employee ID authorization: own card returned `200`; cross-record card returned `404`.
- `npm audit --audit-level=moderate`: 0 vulnerabilities.
- Supabase database lint: no schema errors.
- Responsive browser checks passed on desktop and compact mobile widths without page-level horizontal overflow.

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
- Never bypass finalized-payroll or attendance-lock triggers.
- Never let users self-assign roles.
- Never run `demo:reset` against an unrelated or shared organization.
- Preserve unrelated user changes in a dirty worktree.
- Use `apply_patch` for manual edits.
- Update `docs/HANDOFF.md`, `docs/PHASES.md`, and Graphify only at phase completion or by explicit request.
- Run `npm run verify` before committing.
- Keep secrets and generated credential files out of Git.

## Known External Work

The codebase is feature-complete for its current scope, but production operation still requires external decisions and services:

1. Deploy and connect real domains.
2. Configure Sentry DSNs and alert routing.
3. Enable Supabase leaked-password protection in the Auth dashboard.
4. Configure a monitored transactional email provider and branded Auth templates.
5. Define backups, restore tests, log retention, incident response, and secret rotation.
6. Replace evaluation legal copy with counsel-reviewed commercial terms and privacy documents.
7. Commission an independent penetration test before handling real payroll data.
8. Add country-specific compliance modules only as separate, tested policy packs.

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

The recommended next phase is **Hosted Production Operations**. Its first deliverable should be a real staging deployment using the preferred Vercel plus Supabase shape, followed by Sentry activation, Auth email delivery, backup/restore evidence, and an end-to-end staging smoke test. Do not start another broad UI redesign before that operational baseline exists.
