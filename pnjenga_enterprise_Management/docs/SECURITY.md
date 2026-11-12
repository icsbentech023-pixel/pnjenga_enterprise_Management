# Security Notes

## PINs
- **ENTRY_PIN**: staff, data entry only
- **OWNER_PIN**: owner, dashboard, data entry and the Items tab (price list). Staff cannot change prices or costs when an owner PIN is set. If only the staff PIN is set, anyone with it can edit items, so set both PINs
- Stored in Apps Script Script Properties. Never commit real PINs. `setPins()` in the repo must keep the `CHANGE_...` placeholders.
- PINs are checked on the server for every request, not only in the browser.
- A PIN is basic protection. Use PINs that are not guessable, change them when a staff member leaves, and re-run `setPins()`.
- If no PIN is set, the app is open to anyone who has the link. Set both PINs before deploying.

## Web app access
The manifest starts at `access: MYSELF`. Staff without Google accounts need **Anyone, even anonymous**. With that setting the PINs are your only protection, so keep them private. The app runs as the deploying Google account, which owns the sheet.

## The Google Sheet
- Keep the sheet private to the owner. Staff reach data only through the app.
- Edit the sheet directly only for corrections. Keep the tab names and column order.
- Free-text fields are sanitised so that a value starting with `=`, `+`, `-` or `@` is not run as a formula.

## Repository hygiene
- Keep the repository **private**.
- `.gitignore` excludes `.env`, `*.token` and `.clasp.json`.
