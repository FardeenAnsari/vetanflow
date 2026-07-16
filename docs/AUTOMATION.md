# Automation

VetanFlow automation keeps local development, the live Supabase showcase, documentation, and delivery reproducible.

## Command Map

| Command | Purpose |
| --- | --- |
| `npm run dev` | start Express and Vite together |
| `npm run verify` | lint, typecheck, 62 backend tests, frontend build, backend build |
| `npm run deploy:check` | validate deployment files, scripts, and environment examples |
| `npm run demo:seed-showcase` | create/update 12 Auth accounts and operational foundation |
| `npm run demo:prepare` | prepare one payroll month, previous month by default |
| `npm run demo:bootstrap` | seed six historical months, then run readiness and role checks |
| `npm run demo:check` | run 15 live showcase readiness assertions |
| `npm run demo:check-logins` | verify all 12 accounts, data scopes, and ID-card authorization |
| `npm run demo:reset` | destructively rebuild only the protected showcase organization |
| `npm run screenshots:capture` | capture public/sign-in screenshots |
| `npm run screenshots:capture-authenticated` | capture owner and employee workspaces |
| `npm run supabase:push` | apply pending migrations to the linked project |
| `npm run supabase:types` | regenerate backend TypeScript database types |
| `npm run handoff:update` | refresh the generated Handoff snapshot |
| `npm run graphify:update` | refresh the phase-level knowledge graph |

## Verification Gate

`npm run verify` executes, in order:

1. frontend Oxlint
2. backend TypeScript lint check
3. frontend strict typecheck
4. backend strict typecheck
5. Vitest backend suite
6. Vite production build
7. backend TypeScript production build

Run `npm run deploy:check` after deployment configuration changes. Run `npm audit --audit-level=moderate` and Supabase database lint at security or release milestones.

## Showcase Provisioning

`scripts/bootstrap-showcase.mjs` is the main idempotent showcase orchestrator:

1. `demo:seed-showcase` creates or updates the 12 accounts and ten-employee foundation.
2. It invokes `demo:prepare` for calendar offsets `-6` through `-1`.
3. Each month gets attendance, a lock, adjustments, finalized payroll lines, and payslips.
4. `demo:check` validates required live data.
5. `demo:check-logins` signs in every account and validates role visibility.

Use `DEMO_PERIOD_MONTH=YYYY-MM-01 npm run demo:prepare` to prepare a specific month.

Credentials are written only to ignored `.tmp/demo-credentials.json` with local owner-only permissions. The script reuses one password per role and never writes passwords to tracked documentation.

## Reset Safety

`npm run demo:reset` is intentionally destructive. It:

1. verifies the fixed showcase organization identity
2. removes that organization's private payslip objects
3. runs the linked-project cleanup SQL
4. rebuilds the complete six-month showcase

Use `demo:bootstrap` for ordinary repair. Use `demo:reset` only when deleting showcase transactional history is intended. Never point it at an unrelated or shared production organization.

## GitHub Actions And Hooks

`.github/workflows/ci.yml` runs `npm ci` and `npm run verify` on pushes to `main` and pull requests. It uses read-only contents permission, cancels superseded branch runs, and runs on Node 24.

The Husky pre-commit hook refreshes the Handoff snapshot and runs lint-staged. The project-level verification remains intentionally strict because payroll, authorization, and generated documents share cross-module contracts.

## Supabase Workflow

Database changes are migration-first:

1. add SQL to `supabase/migrations/`
2. review grants, RLS, indexes, triggers, and rollback implications
3. run `npm run supabase:push`
4. run `npm run supabase:types`
5. run Supabase database lint
6. run `npm run verify`
7. run relevant live role/data checks

Do not edit the cloud schema manually and then leave the repository behind.

## Documentation Closeout

Small feature slices require focused tests but no documentation regeneration. At a full phase close, or when explicitly requested:

```sh
npm run handoff:update
npm run graphify:update
npm run verify
```

Then update:

- `README.md`
- `docs/PHASES.md`
- `docs/HANDOFF.md`
- `docs/AI_TAKEOVER.md`
- any domain guide changed by the phase

Commit generated Graphify output only after the graph update completes successfully.
