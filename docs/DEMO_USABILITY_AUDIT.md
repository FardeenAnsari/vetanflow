# VetanFlow Usability And Demo Audit

Date: 2026-10-17. Scope: repository structure, public entry, authentication, six workspaces, HR records, leave, attendance, payroll, downloads, sample-data automation, dependencies, and verification.

## Findings and changes

| Finding | User impact | Outcome |
| --- | --- | --- |
| No single entry point for the existing 12 accounts | Presentations start with credential and role confusion | Added `/demo`, named role choices, `npm run demo`, and `demo:users`. Hosted builds retain ordinary password sign-in. |
| Operational users had no personal self-service destination | Managers and finance staff could not easily find their own ID or payslips | Added My profile & pay, backed by a server-resolved `currentEmployeeId`, with an explicit return to operations. |
| Employee navigation only scrolled through a long mixed page | Profile, pay history, and leave competed for attention | Split the self-service view into distinct navigable sections with overview actions and active navigation. |
| Directory combined an oversized table and an always-visible editor | Basic browsing required scanning irrelevant fields and scrolling past forms | Extracted `PeopleDirectory`, added filters, sort, pagination, empty results, and explicit Add/Edit entry. |
| Historical run status was used in the current-month overview | An old finalized run made the current month look completed | Current-month status now comes only from that month's run. History remains independently selectable. |
| Payroll showed a summary but initially no loaded employee lines | A populated system looked empty until a second click | Automatically loads the selected/default run's detail with cancellation on selection or session change. |
| Historical selection obscured current draft creation | A completed prior run left a disabled recalculation action where the new-month action belonged | Current-month creation/recalculation is separate from historical detail. |
| Finalized runs displayed disabled adjustment forms and irrelevant transition buttons | Reviewers saw controls they could not use | Show transition controls for the applicable run state and hide the adjustment editor after approval/finalization. |
| Payslip download navigated away from VetanFlow | The user lost their place during a presentation | Fetches the authorized signed PDF and downloads it as a file; PDF/CSV download mechanics share one helper. |
| Local login checks used global sign-out | Running checks could end a presentation session elsewhere | Verification signs out only its own session. |
| Requests could wait without a clear timeout or recovery | Sign-in and data-loading failures felt stuck | Shared request timeout handling, session recovery, explicit data errors, retry actions, and role-less workspace rejection. |
| Invalid or oversized JSON returned generic server failures | Client mistakes looked like broken backend features | Returns 400 for malformed JSON and 413 for oversized bodies. |
| Public entry loaded the large workspace module | Visitors paid the cost of operational features before entering them | Split the route entry, public site, demo selection, and workspace into lazy-loaded modules. |
| Missing employee records for two secondary accounts; stale sample calendar | Some roles lacked personal history, and current-month attendance looked empty | Applied 24 Indian employee records, 12 account links, manager reporting lines, 24 leave examples, current attendance, and July-September payroll history. |
| Invitations and employee creation did not connect the same person | A valid login could lack a personal record | Added same-organization normalized-email linking in either creation order, duplicate/ambiguous-match rejection, conditional linking, and protection against cross-organization profile assignment. |
| Currency preferences could relabel historical pay | Existing money values could appear in a different currency without conversion | Blocked currency changes after payroll creation; snapshots retain currency/locale and PDFs honor the snapshot. Rebuilt the six old synthetic periods in INR after explicit approval and a records/PDF backup. |
| Sample attendance snapshots differed from their daily records | Present/payable day totals disagreed with the live attendance engine | Corrected the sample generator and reconciled stored attendance metadata without changing earnings, deductions, or net pay. |
| Invalid currency codes passed basic length validation | Malformed organization preferences could break client formatting | Validate supported ISO currency codes and country format alongside locale/timezone validation. |
| Unpaid leave could exceed the period | Preview deductions could be calculated from impossible day counts | Added a Zod cross-field constraint and regression test. |
| Dependency advisories in the installed tree | Known issues affected HTTP proxy parsing, uploads, and tooling | Applied compatible patches through the lockfile. npm reported zero vulnerabilities afterward. |

## Evidence

- `npm run verify`: passed under Node 24.19.0, including lint, frontend/backend type checks, 87 tests across ten files, and both builds.
- `npm run demo:check-logins`: all 12 existing accounts passed role, visibility, and authorized ID-card checks. Missing/invalid authentication is rejected; employee cross-record ID and bank-export access is rejected.
- `npm run demo:check-ui`: six role workspaces passed in Chrome, including personal-record ownership, navigation, account switching, 375px mobile layout checks, and actual PDF/CSV downloads. A manual employee email/password login after leaving an administrator session reached the correct employee workspace. No browser runtime exceptions or server 5xx responses were recorded.
- The browser downloaded a two-sided employee ID PDF, a payslip PDF, and a bank CSV. PDF files were checked for `%PDF` headers. Payslip download retained `/app`.
- `npm audit fix --ignore-scripts`: reviewed compatible updates applied; final npm audit reported zero vulnerabilities across 317 packages. This is a dependency advisory result, not proof that every application behavior is vulnerability-free.
- `npm run demo:bootstrap`: applied to the saved VetanFlow project, with 15/15 readiness checks and 12/12 role checks. No unrelated project was modified.
- `npx tsx scripts/check-live-onboarding.ts --write-sample`: live API/Auth/database checks passed for account-first and employee-first setup, self-only access, duplicate email HTTP 409, and historical currency protection HTTP 409. Temporary records and Auth users were removed. Email delivery itself was not exercised.
- `scripts/sql/verify-inr-history.sql`: nine finalized periods and 198 lines passed currency, employee identity, earnings/deductions/net arithmetic, daily coverage, attendance-summary, maker/checker, publication, RLS, and enabled-trigger assertions.
- Direct database guard probes rejected finalized run/line/adjustment and locked attendance writes. All 16 public tables have RLS; anonymous users have no accessible public tables; both file buckets are private.
- `git diff --check`: passed.

Browser screenshots, downloaded sample files, and the machine-readable browser result are in `.tmp/demo-ui-proof/`. This directory is ignored by Git.

## Cloud state and remaining decisions

The saved project `indlpqjabkkdwsrxeokq` is reachable using the configured backend and direct database connections. The refresh has 24 employees, 12 profiles/role assignments, 72 salary revisions, 6,270 attendance entries, 24 leave requests, nine finalized runs, 27 adjustments, and 198 payslips. Each period has 22 payroll lines and daily attendance. Organization settings are IN/INR/en-IN/Asia/Kolkata. Sample bank accounts are fictitious, with India-format routing examples.

At the October 17 closeout the management connector initially listed an unrelated project, then returned an unavailable-tool error after reconnect. Application access worked through the saved backend connection. Access recovered on October 20: fresh security/performance results are recorded in `docs/RELEASE_READINESS.md`, including the disabled leaked-password-protection warning.

The user approved rebuilding the six old synthetic USD-tagged periods. Original application records remain in `.tmp/before-india-refresh-*.json`; the targeted records and all 54 old PDFs were additionally saved under `.tmp/legacy-history-backup-*/`. The guarded maintenance transaction verified sample provenance, replaced only January-June history/attendance, restored protection triggers before commit, and recorded the authorization in audit history. July-September monetary amounts, users, employee IDs, current attendance, and leave requests were preserved. All nine periods now reconcile in INR; this is synthetic replacement, not foreign-exchange conversion or real payroll correction.

All current PDFs were regenerated after attendance-summary reconciliation. Sample PDF proof is under `.tmp/inr-document-proof/`. The 54 obsolete cloud PDFs were not deleted during the rebuild, but were subsequently deleted after separate user approval on October 17. The local backup and cleanup receipt remain; all 198 current PDFs were retained.

Further hardening should add database-level uniqueness for organization/profile and normalized employee emails after auditing existing duplicates. Application checks and conditional updates now reject ordinary conflicts, but they are not a substitute for database constraints under concurrent employee creation.

## Review boundaries

This pass verifies the seeded accounts and exercised real workflows; it does not certify all production behavior. Cloud advisors were obtained in the October 20 follow-up. Invitation email delivery, large-scale concurrency, backup restoration, actual bank transfers, and Indian statutory payroll compliance remain unverified. Selecting INR does not implement PF/ESI/TDS rules or filing integrations.

`WorkspaceApp.tsx` still contains substantial legacy workflow state. Moving the route entry and extracting directory/workflow components reduces loading and reading friction, but it does not complete a domain-by-domain frontend refactor. Continue that work with behavior coverage rather than replacing the operational app in one large rewrite.

No commit, push, or deployment was performed for this usability pass. Phase 10 closes the usability/onboarding/INR sample-integrity batch; Handoff and AI Takeover describe the new resume point. The phase-level code Graphify update is structural, not a fresh semantic extraction of every document. Completion of this batch does not certify commercial production readiness.

## Starting point

Use [DEMO_GUIDE.md](DEMO_GUIDE.md) for setup, accounts, a five-minute presentation sequence, and a concise source map. The public README links directly to it.

## October 20 Follow-Up

Resolved candidate-login replacement and stale workspace response races. Unassigned legacy `.test` accounts now produce an explicit 403; normal sign-in and role switching use verified workspace context. Password failures preserve the previous valid session. Browser checks passed repeated role changes, valid/invalid password retry, and cross-tab identity propagation.

Current release checks include 103 tests, no-store API headers, source/build/history secret scanning, zero npm advisories, 15 readiness checks, 12 live account checks, and fresh Supabase metadata/advisor checks. See `docs/RELEASE_READINESS.md` for the exact boundaries and remaining launch requirements. The historical Phase 10 test counts above are retained as dated evidence.
