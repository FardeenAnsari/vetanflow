# Supabase Cloud Setup

This project uses Supabase Cloud only.

## Create A Fresh Project

Use the Supabase dashboard, or log in to the CLI and create a project:

```sh
npx supabase login
npx supabase projects create vetanflow --org-id <org-id> --db-password <strong-password> --region ap-south-1 --size nano
```

Use a fresh VetanFlow project for this codebase so migration history, RLS checks, Storage buckets, and generated types all match the repo.

## Link And Push

```sh
npm run supabase:link -- --project-ref <project-ref>
npm run supabase:push
npm run supabase:types
```

## Backend Environment

Create `backend/.env` locally:

```sh
PORT=4000
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.05
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

## Frontend Environment

Create `frontend/.env` locally:

```sh
VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
```

## Verification

After linking and pushing migrations:

```sh
npm run verify
npm run demo:check
npm run demo:check-logins
npx supabase db lint --linked --schema public --level warning --fail-on error
```

Start with `npm run dev`, then sign in through `/login`. Protected API routes require a valid Bearer token.

Before real use, enable Auth leaked-password protection, configure monitored email delivery, review database advisors, and prove backup/restore behavior. Never use the showcase credential file as a production identity source.
