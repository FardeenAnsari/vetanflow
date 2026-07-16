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
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

## Frontend Environment

Create `frontend/.env` locally:

```sh
VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

## Verification

After linking and pushing migrations:

```sh
npm run verify
curl http://localhost:4000/api/employees
```

With Supabase configured, `/api/employees` requires a valid Bearer token. Sign in through the frontend first, then use the browser app for the main verification path.
