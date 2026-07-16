# Screenshot Manifest

Use this file to track the demo images that should appear in `docs/screenshots/`.

## Captured

| File | Status | Notes |
| --- | --- | --- |
| `sign-in-desktop.png` | Captured | Public sign-in screen at 1440 x 1000. |
| `sign-in-mobile.png` | Captured | Compact sign-in screen at 500 x 844. |
| `owner-desktop.png` | Captured | Owner workspace with live organization data and payroll controls. |
| `owner-mobile.png` | Captured | Compact owner/admin payroll review view. |
| `employee-desktop.png` | Captured | Employee self-service page with digital ID card and six-month payslip archive. |
| `employee-mobile.png` | Captured | Compact employee self-service page with digital ID card. |

## Capture Command

Public sign-in:

```sh
npm run screenshots:capture
```

Signed-in owner/admin profile:

```sh
npm run screenshots:capture-authenticated
```

Manual signed-in profile fallback:

```sh
npm run screenshots:open-profiles
```

Use `docs/SCREENSHOT_GUIDE.md` for the full setup.
