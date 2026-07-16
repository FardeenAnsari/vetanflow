# VetanFlow

India-first payroll operations system built with React, Express, and Supabase. The project models the kind of month-end workflow an HR or finance team would actually need: employee setup, leave, attendance locks, payroll runs, maker-checker approval, payslips, and payroll exports.

## What Works

- Supabase Auth login with backend Bearer-token verification.
- Role-aware access for owner, admin, HR, finance, manager, and employee users.
- HR master data for employees, departments, work locations, salary history, employee photos, and bank readiness.
- Digital employee ID cards with private Supabase Storage-backed photos.
- Leave requests, manager/admin review, cancellation, escalation metadata, and audit logs.
- Attendance entries, holidays, payroll-impact summaries, and locked payroll months.
- Payroll runs generated from locked attendance, with immutable finalized runs.
- Earnings, deductions, reimbursements, overtime, statutory-ready fields, and variance warnings.
- Maker-checker controls so the preparer cannot approve or finalize the same run.
- Generated payslip PDFs, signed payslip downloads, employee payslip archive, and CSV exports for bank payout, statutory summary, and department cost.

## Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS, Motion for React.
- Backend: Express 5, TypeScript, Zod, Helmet, Multer, Vitest, Supertest.
- Platform: Supabase Postgres, Auth, Row Level Security, and private Storage buckets.
- Automation: GitHub Actions, Husky, lint-staged, Supabase CLI, Graphify.

## Project Layout

```txt
frontend/      React application
backend/       Express API and payroll domain logic
supabase/      SQL migrations and seed data
docs/          product, architecture, deployment, and study notes
scripts/       local automation helpers
graphify-out/  generated local code knowledge graph
```

## Run Locally

Use Node 22 or newer. With `nvm`, run `nvm use` from the repo root.

```sh
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev:backend
npm run dev:frontend
```

The frontend runs at `http://127.0.0.1:5173/`. The backend health endpoint is `http://localhost:4000/health`.

Fill the Supabase values in both env files before using authenticated flows. Keep the service role key only in `backend/.env`.

## Verify

```sh
npm run verify
```

This runs frontend lint, backend typecheck-as-lint, frontend typecheck, backend typecheck, backend tests, frontend build, and backend build.

## Study Path

1. Read [Phase tracker](docs/PHASES.md) for current progress.
2. Read [Architecture](docs/ARCHITECTURE.md) for the runtime and security model.
3. Follow [Demo walkthrough](docs/DEMO_WALKTHROUGH.md) to exercise the product.
4. Use [Recorded demo script](docs/RECORDED_DEMO_SCRIPT.md) when filming a walkthrough.
5. Use [Screenshot guide](docs/SCREENSHOT_GUIDE.md) and [Screenshot manifest](docs/SCREENSHOT_MANIFEST.md) when capturing demo images.
6. Use [Demo reset checklist](docs/DEMO_RESET_CHECKLIST.md) before and after live demos.
7. Use [Supabase cloud setup](docs/SUPABASE_CLOUD_SETUP.md) when linking a fresh project.
8. Use [Deployment](docs/DEPLOYMENT.md) when publishing the frontend and backend.
9. Read [Living handoff](docs/HANDOFF.md) for the detailed implementation map.

## Key Commands

```sh
npm run verify
npm run deploy:check
npm run demo:reset
npm run demo:prepare
npm run demo:check
npm run screenshots:capture
npm run screenshots:capture-authenticated
npm run handoff:update
npm run supabase:link -- --project-ref <project-ref>
npm run supabase:push
npm run supabase:types
npm run graphify:update
```

## Current Status

Phases 0-6 are complete for local review/demo. The next optional step is live deployment after choosing and connecting production hosts.
