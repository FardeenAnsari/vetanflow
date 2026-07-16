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

## UX Rules

- Tables must work on mobile through horizontal scroll or compact cards.
- Payroll run screens need obvious states: draft, reviewing, approved, finalized.
- Destructive/pay-impacting actions require confirmation.
- Async actions need loading and disabled states.
- Keyboard focus must be visible.
- No emoji as structural icons.
- Avoid decorative one-note pages. The first screen should be the working product, not marketing copy.
