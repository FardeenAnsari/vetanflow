# Automation

Automation exists to keep the project easy to maintain and easy to explain.

## Main Commands

```sh
npm run verify
npm run handoff:update
npm run graphify:install
npm run graphify:extract
npm run graphify:update
npm run supabase:link
npm run supabase:push
npm run supabase:types
```

## Verification

`npm run verify` runs:

1. frontend lint
2. backend typecheck-as-lint
3. frontend typecheck
4. backend typecheck
5. backend tests
6. frontend production build
7. backend production build

## GitHub Actions

`.github/workflows/ci.yml` runs `npm ci` and `npm run verify` on pushes to `main` and pull requests. CI uses a read-only contents permission, cancels older duplicate branch runs, and runs on Node 24, which satisfies the project engine requirement of Node 22 or newer.

## Local Git Hooks

Husky is installed as a dev dependency. The pre-commit hook:

1. runs `npm run handoff:update`
2. stages the updated `docs/HANDOFF.md`
3. runs lint-staged

lint-staged currently runs the full verification command for staged project files. This is intentionally strict while the project is young.

## Handoff Automation

`scripts/update-handoff.mjs` refreshes the generated snapshot in `docs/HANDOFF.md` with:

- update timestamp
- current branch
- working tree state
- available npm scripts
- core run URLs

Manual sections of the handoff still need human updates for decisions, changed behavior, and next steps.

## Supabase Automation

Supabase work should stay migration-first:

1. edit SQL in `supabase/migrations`
2. review the migration before pushing
3. link/push to the cloud Supabase project when ready
4. generate types with `npm run supabase:types`
5. update `docs/HANDOFF.md`

Available scripts:

- `npm run supabase:link`: links this repo to a cloud Supabase project.
- `npm run supabase:push`: applies migrations to the linked cloud project.
- `npm run supabase:types`: generates TypeScript database types from the linked cloud project into `backend/src/lib/database.types.ts`.

This project uses the Supabase cloud project or Supabase MCP tools for database verification.

See `docs/SUPABASE_CLOUD_SETUP.md` for the exact cloud setup steps.

## Phase Close-Out Rule

During small feature slices, verify the code but do not refresh `docs/HANDOFF.md`, `docs/PHASES.md`, or Graphify unless explicitly requested. At full phase completion, update the phase tracker and handoff, then run:

```sh
npm run handoff:update
npm run graphify:update
npm run verify
```
