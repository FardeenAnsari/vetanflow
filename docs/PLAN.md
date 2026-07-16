# Plan

Build VetanFlow as an India-first payroll operations product with a real backend, real Supabase security boundaries, and a clean demo path. Phases 0-6 are complete for local review/demo; live production deployment remains an optional follow-up after choosing hosts.

## Scope

- In: React/Vite frontend, Express API, Supabase migrations, India payroll workflows, RBAC, audit trail, payslips, reports, CI, deployment notes, walkthrough material.
- Out: Multi-country support, containerized deployment, client-selected roles, unrelated Supabase projects, production payment or banking integrations.

## Completed

[x] Create the monorepo foundation with `frontend`, `backend`, `supabase`, and `docs`.
[x] Add the React dashboard shell and Express API skeleton.
[x] Add India-first payroll calculation and tests.
[x] Add Supabase schema, RLS, grants, seed data, and cloud setup notes.
[x] Add Supabase Auth login, backend token verification, and server-controlled role assignment groundwork.
[x] Verify owner/admin and employee RLS with real Supabase Auth users.
[x] Build HR master data, employee photos, digital ID cards, and setup audit controls.
[x] Build leave requests, attendance entries, holidays, payroll-impact summaries, and locked months.
[x] Build payroll runs, adjustments, variance warnings, approval/finalization, and maker-checker rules.
[x] Build payslip PDF generation, signed downloads, employee payslip archive, and CSV exports.
[x] Push Phase 5 migrations to Supabase Cloud, regenerate types, and run live export/payslip smoke checks.

## Phase 6 Action Items

[x] Refresh public README with the current feature set and run path.
[x] Add demo walkthrough material.
[x] Add deployment notes for frontend, backend, and Supabase Cloud.
[x] Harden CI install behavior with `npm ci`, read-only permissions, concurrency, and timeout.
[x] Add screenshot capture guide and Chrome-headless helper.
[x] Add demo data reset checklist.
[x] Add a recorded demo script and screenshot manifest.
[x] Add Supabase-backed demo readiness checker and readiness output notes.
[x] Add idempotent demo data preparation script.
[x] Capture screenshots for the main owner/admin and employee flows.
[x] Add authenticated screenshot automation for owner/admin and employee flows.
[x] Add linked Supabase demo reset automation and rebuild the clean September 2026 demo month.
[x] Fix employee payslip portal loading for RLS-visible payslips with hidden nested payroll run metadata.
[x] Complete final handoff, phase tracker, Graphify update, and full verification at Phase 6 close.

## Open Questions

- Which host should be used for the live backend: Render, Railway, Fly.io, or another Node service?
- Which static host should be used for the frontend: Vercel, Netlify, Cloudflare Pages, or another provider?
