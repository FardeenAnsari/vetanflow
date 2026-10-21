# VetanFlow Demo Guide

VetanFlow connects people records, leave and attendance, payroll approval, and private payslips. Present that journey through the people responsible for each step.

## Open the demo

Use the repository's Node version (`.nvmrc`), install dependencies with `npm ci` when needed, then run:

```sh
npm run demo
```

Open [Demo workspaces](http://localhost:5173/demo). Choose a named account under a role. This uses a real Supabase session and the real API, including database permissions. It does not change the role of an existing account or pretend to be another role in the frontend.

The local shortcut requires `.tmp/demo-credentials.json`, which the cloud seed creates. It is disabled during regular `npm run dev` and cannot be enabled in production. On a hosted build, role cards lead to normal password sign-in with the selected account's email prefilled.

For manual sign-in, run:

```sh
npm run demo:users
```

This displays the local account credentials. Credentials are kept in the ignored `.tmp/` directory, outside the public site and repository history.

Use the current `@vetanflow.example.com` demo identities, not the old `@vetanflow.test` accounts. The old identities have no application profile/role and correctly receive a workspace-assignment error. Password sign-in validates the new workspace before replacing an existing session. A failed attempt does not log the current account out. A successful switch updates all tabs sharing that browser session; use separate browser profiles for independent simultaneous accounts.

## The six roles

| Role | Primary demo account | Show first |
| --- | --- | --- |
| Owner | Fardeen Ansari | Overview, organization preferences, access, audit |
| Admin | Meera Sharma | People directory and organization administration |
| HR | Ananya Iyer | Employee records, leave queue, attendance |
| Finance | Rohan Verma | Payroll history, calculations, PDFs, CSV exports |
| Manager | Sneha Rao | Direct-report leave requests and attendance |
| Employee | Aarav Mehta | Personal ID, leave, salary history, payslips |

Additional accounts include Aditya Nair (admin), Kavya Joshi (HR), Priya Shah (finance), Vikram Desai (manager), and Amina Yusuf and Arjun Patel (employees). Each account has exactly one application role. Arjun's login is `arjun.patel@vetanflow.example.com`; his existing Auth identity was retained during the rename.

Operational users also have **My profile & pay**, which uses their authenticated employee link. It does not reuse the person currently selected in the directory. Managers' direct reports do not gain access to their manager's compensation, and employees receive only their own record and documents.

## A five-minute presentation

1. **HR: people.** Open People, filter by Engineering, select Aarav, and show his ID and compensation history. Open Add employee to show that record entry is separate from browsing; cancel without saving.
2. **Employee: self-service.** Switch through `/demo` to Aarav. Show Overview, Profile & documents, Pay history, and Leave requests. Download an existing payslip; the workspace stays open.
3. **Manager: decisions.** Open Sneha's Leave page. Explain pending, approved, rejected, cancelled, and escalated requests. Approval changes real demo records, so use a disposable pending request when demonstrating a decision.
4. **Finance: payroll.** Open Payroll. The latest available history is selected automatically. Show gross pay, adjustments, deductions, net pay, and the stored calculation. Download a bank CSV or payslip.
5. **Owner: controls.** Show the current month's workflow, access management, and audit history. Explain that a payroll maker cannot approve their own run. Finish by returning to the employee's private document archive.

The current-month overview and historical payroll are intentionally separate. A finalized historical run does not mean this month's attendance is locked or payroll is complete. Finalized payroll also does not prove a bank transfer occurred; the system produces payment instructions and records payroll outputs.

## Populate or refresh sample data

Only run cloud provisioning against the intended VetanFlow sample project, after confirming its connection:

```sh
npm run demo:bootstrap
```

The applied expansion includes 24 Indian employees, 12 accounts across six roles, five departments, offices in Mumbai/Pune/Bengaluru/Hyderabad, 24 leave examples, compensation history, current attendance, and the six previous payroll months. Organization defaults are INR, en-IN, and Asia/Kolkata. Previous finalized payroll is preserved. Newly prepared unlocked historical periods receive daily attendance, payroll lines, adjustments, PDFs, and audit events.

`demo:bootstrap` runs the foundation seed, prepares six calendar-relative periods, and checks readiness and logins. Current attendance remains open so HR can demonstrate input and locking. Use `demo:prepare` with `DEMO_PERIOD_MONTH=YYYY-MM-01` only when intentionally preparing and finalizing a particular sample period.

Do not use `demo:reset` to refresh a presentation casually: that is an explicit destructive reset of sample operational history. Regular bootstrap upserts the managed examples without requiring a reset.

The October 17 refresh contains nine finalized INR periods (January-September 2026), 198 payslips, and 6,270 attendance entries. The user explicitly approved replacing the six old synthetic periods; they were backed up with their 54 PDFs before being rebuilt. All periods now have currency/locale snapshots, current Indian employee names, reconciled financial totals, and daily attendance. This was sample replacement, not currency conversion of real payroll. The 54 obsolete cloud PDFs were subsequently deleted after separate user approval; local private backups and the cleanup receipt remain. All 198 current cloud PDFs were retained.

## Verification

With `npm run demo` running in a separate terminal:

```sh
npm run verify
npm run demo:check-logins
npm run demo:check-ui
npm run demo:check
```

The login check validates all local demo accounts, rejects missing or invalid authentication, and tests employee access boundaries. The browser check switches through six roles, verifies personal identity, checks mobile layouts, downloads actual PDFs and CSV, and checks account switching and runtime errors. Browser proof is saved under `.tmp/demo-ui-proof/`.

`demo:check` expects a finalized run for the previous calendar month and currently passes all 15 checks. Chrome is required for `demo:check-ui`; set `CHROME_PATH` on systems where its executable is elsewhere.

For an explicitly authorized live onboarding smoke test, run `npx tsx scripts/check-live-onboarding.ts --write-sample`. It creates two temporary accounts/employee records, verifies both creation orders, duplicate email protection, self-only access, and currency locking, then removes them. It does not send invitation emails.

## Explain the code in one minute

| Responsibility | Entry point |
| --- | --- |
| Page selection and lazy loading | `frontend/src/App.tsx` |
| Authenticated workspace and workflow state | `frontend/src/WorkspaceApp.tsx` |
| Demo account selection | `frontend/src/demo/DemoAccessPage.tsx` |
| Directory search, filters, and pagination | `frontend/src/components/PeopleDirectory.tsx` |
| Role-to-navigation rules | `frontend/src/components/workspace-navigation-model.ts` |
| HTTP timeout handling | `frontend/src/lib/api-client.ts` |
| Local demo session guard | `backend/src/modules/demo/demo-router.ts` |
| Identity verification | `backend/src/modules/auth/auth-middleware.ts` |
| Payroll calculations | `backend/src/modules/payroll/calculate-payroll.ts` |
| Authorization, snapshots, transitions | `backend/src/modules/payroll/payroll-run-repository.ts` |
| RLS, grants, and immutability | `supabase/migrations/` |

The browser presents the workflow. Express verifies identity, validates inputs, and enforces operational rules. Supabase owns identities, organization data, database policies, and private files. The local demo shortcut creates an ordinary session; it does not bypass those API or database rules.
