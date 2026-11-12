# Pnjenga Enterprise Management — Gathaiti & Kanjuku

This repository now includes a Google Apps Script + Google Sheets implementation. Google Sheets is the shared database; Apps Script runs the web application and enforces server-side PIN checks. The previous GitHub Pages/localStorage prototype is retained on the main branch and is not the production backend.

## Apps Script source
- `apps-script/Code.gs`: backend, sheet setup, staff operations, owner dashboard aggregation.
- `apps-script/Index.html`: owner dashboard.
- `apps-script/DataEntry.html`: staff data-entry interface.
- `apps-script/appsscript.json`: Apps Script runtime configuration.

## One-time setup
1. Open [script.google.com](https://script.google.com) and create a standalone Apps Script project.
2. Copy `apps-script/Code.gs` into the script's `Code.gs` file.
3. Create two HTML files named exactly `Index` and `DataEntry`; paste the matching repository HTML files (omit the .html suffix in the Apps Script editor's file name).
4. In Project Settings, set the script time zone to `Africa/Nairobi`.
5. For the existing Pnjenga workbook, use the spreadsheet ID supplied by the owner in `EXISTING_SHEET_ID` in `Code.gs`. Run `connectExistingSheet()` and authorize access. It stores the existing ID in Script Properties and returns the workbook's tab names, row counts and header rows for review.
6. **Do not run `setup()` until the existing workbook's tabs and column layouts have been reviewed and mapped.** Setup adds missing application tabs and headers; it is not a data-migration tool. Existing tabs are not deleted and starter items are seeded only if setup creates a brand-new `Items` tab.
7. In Apps Script Project Settings → Script Properties, add:
   - `ENTRY_PIN`: a strong staff PIN
   - `OWNER_PIN`: a different strong owner PIN
   - `SHEET_ID`: set automatically by `connectExistingSheet()`
8. Never commit real PINs, spreadsheet credentials, or private data to GitHub.
9. Deploy → New deployment → Web app. Execute as **Me**. Choose access appropriate to your Google account/Workspace policy. Share the deployed URL only with authorized staff.
10. Open the deployment URL for staff entry. The owner dashboard is at the same URL with `?page=dashboard`.

## Sheets and functionality
- `Items`: Gas/Agrovet catalogue, unit cost, selling price and reorder threshold.
- `Sales`: quantity, cost, selling price, total and gross margin at time of sale.
- `Stock`: stock receipts and supplier.
- `Expenses`: dated operating expenses.
- `MPesa`: opening and closing float/cash, deposits, withdrawals, commission and variance.
- Owner dashboard: branch/date summaries, stock balances and reorder alerts, M-Pesa variance.
- A script lock protects writes from simultaneous users. Sales are rejected when available stock is insufficient. Duplicate M-Pesa closing entries for the same business/date are rejected.

## Accounting and security notes
- Gross profit uses the unit cost entered on each sale. Verify the cost basis entered by staff.
- M-Pesa variance is calculated as: closing float + closing cash − opening float − opening cash − commission − capital added. Customer deposits and withdrawals are transfers between float and cash, so they are tracked for activity reporting but excluded from the combined cash-plus-float reconciliation. This assumes commission and capital added are included in the closing float/cash totals.
- “Net before other costs” is a management estimate: gross trading profit + M-Pesa commission − recorded expenses. It is not a formal financial statement.
- PINs are lightweight shared-device controls, not individual staff identity or high-assurance authentication. Restrict web-app access and spreadsheet sharing permissions.
- Back up the spreadsheet regularly. There is currently no automated backup, per-user audit trail, or edit workflow. Protect deletion operations operationally.

## Deploying updates
These files are the Apps Script source. After changing them, copy the updated files into the Apps Script project and create a new deployment version (Manage deployments → Edit → New version). GitHub Pages does not execute Apps Script server functions; the Apps Script deployment URL is the live application for this architecture.

## Legacy GitHub Pages prototype
The original static PWA files remain in the repository for reference. They are not connected to the shared Sheets database.
