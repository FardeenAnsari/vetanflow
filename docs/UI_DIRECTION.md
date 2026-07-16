# UI Direction

## Product Feel

Data-dense HR/payroll operations dashboard. The app should feel like a tool finance and HR teams use every month: calm, scannable, serious, and efficient.

## Visual System

- Primary navy: `#0A2947`.
- Warm surface: `#F3E4C9`.
- Muted sage: `#D3D4C0`.
- Brown accent: `#8B5E3C`.
- Status colors: amber for review, red for blockers, green for completed payroll, and navy/sage for neutral data.
- Typography: precise sans-serif with tabular figures for money and counts.
- Components: shadcn/Radix-style primitives adapted locally with Tailwind.
- Brand assets: `frontend/public/brand/` contains static, inverse, wordmark, animated SVG, and transparent PNG variants.

## UX Rules

- Tables must work on mobile through horizontal scroll or compact cards.
- Payroll run screens need obvious states: draft, reviewing, approved, finalized.
- Destructive/pay-impacting actions require confirmation.
- Async actions need loading and disabled states.
- Keyboard focus must be visible.
- No emoji as structural icons.
- Avoid decorative one-note pages. The first screen should be the working product, not marketing copy.
- Keep role surfaces materially different in navigation, priority, data visibility, and actions.
- Use selects for constrained organization settings; do not accept free text for country, currency, locale, or timezone.
- Status colors must preserve meaning: green success, amber review, red blocker, blue information, neutral slate for ordinary data.
- ID-card download feedback may be expressive, but it must remain brief, reduced-motion aware, and must not delay authorization checks.
- Keep page-level content inside the viewport on compact widths; wide tables may scroll inside their own section.
