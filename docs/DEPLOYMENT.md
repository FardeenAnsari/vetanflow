# Deployment

VetanFlow deploys as a static frontend, a Node backend, and Supabase Cloud.

## 1. Supabase Cloud

Create or link the Supabase project, then apply migrations:

```sh
npm run supabase:link -- --project-ref <project-ref>
npm run supabase:push
npm run supabase:types
npm run verify
```

Keep database passwords and service role keys in your local shell or host secrets. Do not commit them.

## 2. Backend Service

Deploy the backend as a Node web service from the repo root.

The repo includes `render.yaml` as a Render blueprint for the API. Connect the GitHub repo in Render, create the web service from the blueprint, then add the environment variables below.

Recommended settings:

```txt
Install command: npm ci
Build command:   npm run build --workspace backend
Start command:   npm run start --workspace backend
Health check:    /health
Node version:    24
```

Required backend environment variables:

```txt
PORT=4000
CORS_ORIGIN=https://<frontend-domain>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

If the hosting platform injects its own `PORT`, use that value. Keep `SUPABASE_SERVICE_ROLE_KEY` backend-only.

## 3. Frontend Static App

Deploy the Vite app from the repo root.

The repo includes `vercel.json` for the static frontend build. Connect the GitHub repo in Vercel and set the environment variables below. Keep backend and frontend as separate projects/services.

Recommended settings:

```txt
Install command: npm ci
Build command:   npm run build --workspace frontend
Output folder:   frontend/dist
Node version:    24
```

Required frontend environment variables:

```txt
VITE_API_BASE_URL=https://<backend-domain>
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

After the frontend URL is known, update backend `CORS_ORIGIN` to include it.

## 4. Smoke Test

Before deploying, run:

```sh
npm run deploy:check
npm run verify
```

After deployment:

```sh
curl https://<backend-domain>/health
```

Then open the frontend and verify:

- Owner/admin sign-in loads HR master data.
- Employee sign-in loads only the self-service surface.
- Payroll run list loads without CORS errors.
- Payslip download returns a PDF from a signed URL.

## 5. CI/CD Notes

The current CI verifies code on GitHub. Database migrations should be pushed manually from a trusted machine until a dedicated migration deployment workflow is added with protected secrets and an approval gate.
