# VetanFlow Frontend

React 19, Vite, TypeScript, Tailwind CSS, Motion, Supabase Auth, and optional Sentry power the public VetanFlow site and role-shaped payroll workspace.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | public landing page |
| `/tour` | animated employee-to-payslip walkthrough |
| `/how-it-works` | product workflow and controls |
| `/blog` | journal |
| `/terms`, `/privacy`, `/licenses` | legal and license information |
| `/login` | sign-in and existing-session account switching |
| `/app` | authenticated workspace |

## Commands

Run from the repository root:

```sh
npm run dev
npm run lint --workspace frontend
npm run typecheck --workspace frontend
npm run build --workspace frontend
```

## Environment

Only browser-safe values belong in `frontend/.env`:

```text
VITE_API_BASE_URL
VITE_DEFAULT_CURRENCY
VITE_DEFAULT_LOCALE
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SENTRY_DSN
VITE_SENTRY_ENVIRONMENT
VITE_SENTRY_TRACES_SAMPLE_RATE
```

Never expose a Supabase service-role key through a `VITE_*` variable.

## Structure

- `src/App.tsx`: route selection, Auth entry, account switching, and authenticated product composition.
- `src/public-site/`: landing, tour, articles, and legal surfaces.
- `src/components/workspace-navigation-model.ts`: role-to-section matrix.
- `src/components/EmployeeIdCard.tsx`: digital ID presentation.
- `src/components/IdCardPrintAnimation.tsx`: print and ribbon feedback before PDF download.
- `src/lib/organization-options.ts`: supported organization selectors and defaults.
- `src/instrument.ts`: optional Sentry initialization.
- `public/brand/`: VetanFlow SVG and transparent PNG brand assets.

## UI Rules

- Authenticated pages are dense operational tools, not landing-page compositions.
- Navigation, priorities, data scope, and actions change by role.
- Server authorization and Supabase RLS remain authoritative.
- Use semantic status colors, accessible focus, reduced motion, stable dimensions, and contained mobile overflow.
- Use Lucide icons instead of emoji or hand-drawn controls.
