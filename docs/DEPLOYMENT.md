# Deployment

VetanFlow supports a compact same-origin Vercel deployment and a split Vercel/Render deployment. Supabase Cloud remains the managed data, identity, and file platform in both shapes.

## Preflight

Use Node 24 and run:

```sh
npm ci
npm run deploy:check
npm run verify
npm run security:check -- --history
npm audit --audit-level=moderate
npm run demo:check
npm run demo:check-logins
```

Do not deploy showcase credentials or local `.env` files.

Read `docs/RELEASE_READINESS.md` for the latest verified release candidate and remaining launch warnings. CI is a quality gate, not a deployment authorization. No push or deployment was made during the October 20 preparation.

## Option A: Vercel Frontend And API

This is the recommended compact deployment.

The repository already contains:

- `vercel.json` for install/build/output and rewrites
- `api/[...path].ts` as the Express serverless adapter
- a same-origin frontend API fallback in production

Request flow:

```text
https://your-domain.example/*      -> frontend/dist/index.html
https://your-domain.example/api/*  -> api/[...path].ts -> Express app
```

Connect `FardeenAnsari/vetanflow` to Vercel and use the repository root. `vercel.json` supplies:

```text
Install: npm ci
Build: npm run build --workspace frontend
Output: frontend/dist
```

Set these server/runtime variables in Vercel:

```text
NODE_ENV=production
CORS_ORIGIN=https://your-domain.example
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
PAYROLL_CURRENCY=INR
PAYROLL_LOCALE=en-IN
SENTRY_DSN=<backend-project-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.05
```

Set these frontend build variables:

```text
VITE_API_BASE_URL=
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_DEFAULT_CURRENCY=INR
VITE_DEFAULT_LOCALE=en-IN
VITE_SENTRY_DSN=<frontend-project-dsn>
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
```

An empty `VITE_API_BASE_URL` uses same-origin `/api` in production. Never create a frontend service-role variable.

Leave `DEMO_ACCESS_ENABLED` unset in hosted environments. The session shortcut also refuses production mode regardless of this variable. `/demo` uses normal password sign-in when hosted. Shared role passwords are presentation-only; rotate them and remove synthetic accounts before real use.

## Option B: Vercel Frontend And Render API

Use this when a standalone Node service is preferred.

### Render

`render.yaml` defines the API service:

```text
Build: npm ci && npm run build --workspace backend
Start: npm run start --workspace backend
Health: /health
Node: 24
```

Set:

```text
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.example
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SENTRY_DSN=<backend-project-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.05
```

Render supplies `PORT`.

### Vercel Frontend

Set:

```text
VITE_API_BASE_URL=https://your-api.example
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SENTRY_DSN=<frontend-project-dsn>
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
```

Update API `CORS_ORIGIN` whenever the frontend production or preview origins change. Do not use `*` in production.

## Supabase Production Setup

1. Link the intended project.
2. Push every local migration.
3. Regenerate database types.
4. Confirm both private buckets exist.
5. Run database lint and review security/performance advisors.
6. Enable Auth leaked-password protection in the Supabase dashboard.
7. Configure branded email templates and a monitored SMTP provider.
8. Define backups, point-in-time recovery needs, and restore-test cadence.

```sh
npm run supabase:link -- --project-ref <project-ref>
npm run supabase:push
npm run supabase:types
npx supabase db lint --linked --schema public --level warning --fail-on error
```

The current showcase project reference is documented in `docs/AI_TAKEOVER.md`; database passwords and keys are not.

## Sentry

Frontend and backend Sentry SDKs are already integrated but remain inactive without DSNs.

Recommended setup:

1. Create separate browser and server projects/environments.
2. Set DSNs only in the deployment secret manager.
3. Keep `sendDefaultPii` disabled.
4. Start with a low trace sample rate.
5. Configure release/source-map upload in CI before relying on minified stack traces.
6. Route high-severity server errors and payroll endpoint failures to a monitored channel.
7. Never send payroll payloads, bank details, credentials, or generated documents as custom event context.

## Production Smoke Test

After deployment:

1. `GET /api/health` returns `200` and `ok: true` on the same-origin Vercel deployment. The standalone Render service also exposes `/health`.
2. `/`, `/tour`, `/how-it-works`, `/blog`, `/terms`, `/privacy`, and `/licenses` load directly and after refresh.
3. `/login` supports both Continue and Use another account when a session exists.
4. Owner reaches the owner workspace and sees all employees.
5. Employee reaches self-service and sees exactly one employee record.
6. Owner can download two different employee ID PDFs.
7. Employee can download their own ID and receives `404` for another employee ID.
8. Organization preferences persist and change currency/date/time previews.
9. Leave, attendance, payroll, payslips, and exports load without CORS errors.
10. Sentry receives a controlled non-sensitive test event from both runtimes.

Run the automated live checks against the deployed API by setting `DEMO_API_BASE_URL`:

```sh
DEMO_API_BASE_URL=https://your-domain.example npm run demo:check-logins
```

## Operational Launch Checklist

- Rotate all development and showcase secrets.
- Replace demo accounts and data before real use.
- Restrict deployment and Supabase administrator access.
- Protect the production branch and require CI.
- Define backup retention and prove a restore.
- Add uptime, latency, error-rate, and failed-payroll alerts.
- Document incident response and customer notification ownership.
- Review data retention, privacy, employment, tax, and payroll obligations with qualified counsel.
- Complete independent penetration testing.

The repository can prove layered engineering controls. It cannot by itself certify legal compliance or guarantee the absence of vulnerabilities.
