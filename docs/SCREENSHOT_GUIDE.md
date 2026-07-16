# Screenshot Guide

Use screenshots to show the product as a working payroll system, not a static mockup.

## Quick Capture

Start the app:

```sh
npm run dev
```

Capture the public sign-in screen at `/login`:

```sh
npm run screenshots:capture
```

The script writes:

```txt
docs/screenshots/sign-in-desktop.png
docs/screenshots/sign-in-mobile.png
```

It uses Google Chrome, Microsoft Edge, or Chromium. Set `CHROME_PATH` if the browser lives somewhere custom. The compact capture uses a 500px-wide viewport because Chrome's command-line screenshot mode can crop smaller widths while keeping a wider layout viewport.

## Authenticated Screens

Authenticated screenshots can be captured without manual browser work:

```sh
npm run screenshots:capture-authenticated
```

The script reads the existing owner and employee credentials from the ignored `.tmp/demo-credentials.json` file, validates their expected roles and payslip access without mutating Auth or role assignments, signs them in with the publishable key, injects the sessions into a temporary headless Chrome profile, and writes:

```txt
docs/screenshots/owner-desktop.png
docs/screenshots/owner-mobile.png
docs/screenshots/employee-desktop.png
docs/screenshots/employee-mobile.png
```

Run `npm run demo:bootstrap` first. `DEMO_OWNER_EMAIL`, `DEMO_OWNER_PASSWORD`, `DEMO_EMPLOYEE_EMAIL`, and `DEMO_EMPLOYEE_PASSWORD` can override the local credential file for a temporary capture. Do not commit those values.

### Manual Fallback

Manual authenticated screenshots need a browser profile that is already signed in.

1. Open temporary Chrome profiles for owner/admin and employee:

   ```sh
   npm run screenshots:open-profiles
   ```

2. Sign in with the owner/admin demo account in the owner window.
3. Sign in with the employee demo account in the employee window.
4. Close both Chrome windows so headless Chrome can reuse those profiles.
5. Capture the signed-in `/app` screens:

   ```sh
   CHROME_USER_DATA_DIR="$PWD/.tmp/chrome-owner" DEMO_SCREENSHOT_PREFIX=owner DEMO_SCREENSHOT_EXPECT_TEXT="Payroll runs" npm run screenshots:capture
   CHROME_USER_DATA_DIR="$PWD/.tmp/chrome-employee" DEMO_SCREENSHOT_PREFIX=employee DEMO_SCREENSHOT_EXPECT_TEXT="My payroll workspace" npm run screenshots:capture
   ```

`DEMO_SCREENSHOT_EXPECT_TEXT` makes the capture fail before saving if the profile is still on the sign-in screen.

## Recommended Shot List

Track progress in `docs/SCREENSHOT_MANIFEST.md`.

- `sign-in-desktop.png`: clean login surface.
- `owner-desktop.png`: HR/payroll workspace after owner/admin login.
- `owner-mobile.png`: mobile responsive admin workspace.
- `employee-desktop.png`: employee self-service page with digital ID card.
- `employee-mobile.png`: mobile employee self-service page.
- `payroll-run-detail.png`: finalized run with payslip/export controls.
- `attendance-lock.png`: Attendance control showing locked month state.
- `payslip-archive.png`: employee payslip archive with download action.
- `employee-id-print.png`: owner-triggered ID-card print/ribbon animation.
- `organization-preferences.png`: constrained country/currency/locale/timezone selectors and live previews.

## Capture Notes

- Keep real secrets and private employee data out of screenshots.
- Use demo records with believable names, departments, bank readiness, attendance, and payslip state.
- Re-capture screenshots after UI changes that affect layout, role routing, or payroll output controls.
- Do not capture service role keys, Supabase dashboard secrets, terminal env output, or database passwords.
