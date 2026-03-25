# v2 Queue Revamp - Manual Testing Checklist

## Pre-check
1. Start with a clean day state (optional): use Admin to trigger daily flush if available.
2. Log in as a staff user.
3. Open both v2 screens:
   - Staff v2 controls: `public/staff/dashboard_v2.html`
   - Display v2: `public/patient/display_v2.html`

## v2 semantics (per-department)
Pick one department card (e.g., the first one on the grid).

1. Press `Reset`
   - Expected: that department shows queue `0`.
2. Press `Next` (when showing `0`)
   - Expected: it becomes `1`.
3. Press `Skip` (when showing `1`)
   - Expected:
     - The display moves immediately to `2`.
4. Press `Next` (when showing `2`)
   - Expected: it goes back to `1` (the skipped number returns after the next number).
5. Press `Next` (when showing `1`)
   - Expected: it becomes `3`.

## Rapid interaction sanity
1. Press `Skip` twice quickly while on a known number (e.g., `3`).
   - Expected: the sequence still follows “skip schedules current to return after the next number”.
2. Repeat with `Next` in between.

## Permissions check (finance staff)
1. Log in as a finance staff user (their own department is `is_finance=1`).
2. Verify:
   - Buttons (`Next/Skip/Reset`) are disabled on all other departments.
   - Buttons are enabled only on the finance staff’s own department card.

## Legacy smoke checks (to avoid regressions)
Open the existing pages in addition to the v2 screens and confirm they still load and update:
1. Old staff dashboard: `public/staff/dashboard.html`
2. Old queue display: `public/patient/display.html`

Expected: legacy pages still operate with the existing `queueing` table (polling + Next/Skip actions should work as before).

## If something is off
- If v2 numbers do not change when pressing buttons:
  - Check browser console for fetch errors.
- If legacy pages break after daily rollover:
  - Verify `api/daily_flush.php` still returns JSON and does not throw errors.

