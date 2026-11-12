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
5. Run `setup()` from the editor and authorize access. It creates the Google Sheet database and starter item catalogue. Copy the spreadsheet URL from the execution log.
6. In Apps Script Project Settings → Script Properties, add:
   - `ENTRY_PIN`: a strong staff PIN
   - `OWNER_PIN`: a different strong owner PIN
   - `SHEET_ID`: the spreadsheet ID created by setup (set automatically)
7. Never commit real PINs, spreadsheet credentials, or private data to GitHub.
8. Deploy → New deployment → Web app. Execute as **Me**. Choose access appropriate to your Google account/Workspace policy. Share the deployed URL only with authorized staff.
9. Open the deployment URL for staff entry. The owner dashboard is at the same URL with `?page=dashboard`.

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
- M-Pesa variance is calculated as: closing float + closing cash − opening float − opening cash − deposits + withdrawals − commission − capital added. Confirm this convention matches your agent's cash/float movement before operational use.
- “Net before other costs” is a management estimate: gross trading profit + M-Pesa commission − recorded expenses. It is not a formal financial statement.
- PINs are lightweight shared-device controls, not individual staff identity or high-assurance authentication. Restrict web-app access and spreadsheet sharing permissions.
- Back up the spreadsheet regularly. There is currently no automated backup, per-user audit trail, or edit workflow. Protect deletion operations operationally.

## Deploying updates
These files are the Apps Script source. After changing them, copy the updated files into the Apps Script project and create a new deployment version (Manage deployments → Edit → New version). GitHub Pages does not execute Apps Script server functions; the Apps Script deployment URL is the live application for this architecture.

## Legacy GitHub Pages prototype
The original static PWA files remain in the repository for reference. They are not connected to the shared Sheets database.
