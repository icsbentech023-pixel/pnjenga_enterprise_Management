# Pnjenga Enterprise Management

A data-entry app and live dashboard for two businesses with the same owner, **Gathaiti** and **Kanjuku**. Each business sells **gas cylinders**, runs an **M-Pesa shop** and sells **agrovet products**.

Staff record sales, stock received and expenses in the **Data entry** page. Everything is saved to one Google Sheet, and the **Dashboard** reads the same sheet, so figures update as soon as an entry is saved.

## What it does

- **Data entry** (phone friendly): daily sales, stock received, expenses and a daily **M-Pesa float and cash** record, with a price list that fills in unit cost and price automatically
- **Items tab** (owner): add, edit and delete price-list items and reorder levels from the app, no sheet editing needed
- **Dashboard**: revenue, gross profit, expenses and net profit per business and combined, split by Gas, M-Pesa and Agrovet
- **M-Pesa reconciliation**: opening and closing float and cash, deposits, withdrawals, commission, owner top-ups and a daily variance check that should be 0
- Daily chart (revenue, gross or net profit per day, split by business, with trend line), day-by-day table, comparison with the previous period
- **Reorder alerts**: set a reorder level per item; staff are warned when a sale takes an item to its level, and the dashboard lists every item that is low or out
- Stock balance per item (received minus sold), filters by business, category and date range, print to PDF
- **PIN protection**: a staff PIN for data entry and a separate owner PIN for the dashboard

## How it works

```
Staff phone/tablet           Google Apps Script web app           Google Sheet
Data entry page      -->     Code.gs (validates, calculates) -->  Items | Sales | Stock | Expenses | MPesa
Owner browser        <--     Dashboard page (Index.html)     <--  (read live)
```

One Apps Script web app serves both pages. The data entry page is the default; add `?page=dashboard` for the dashboard.

## Repository structure

```
pnjenga_enterprise_Management/
├── README.md
├── CHANGELOG.md
├── .gitignore
├── apps-script/
│   ├── Code.gs            # Server: Sheet storage, validation, PINs, dashboard data
│   ├── DataEntry.html     # Data entry page
│   ├── Index.html         # Dashboard page
│   └── appsscript.json    # Manifest
├── templates/
│   └── Gathaiti_Kanjuku_Data_Template.xlsx   # Ready-made sheet (import to Google Sheets)
├── archive/kobo-forms/    # Earlier Kobo XLSForm approach (not used by the app)
└── docs/
    ├── SETUP.md
    ├── USER_GUIDE.md
    ├── DATA_DICTIONARY.md
    └── SECURITY.md
```

## Quick start

1. Create an Apps Script project and add the four files in `apps-script/`.
2. Run `setup()` once. It creates the Google Sheet and a starter price list. (Or import `templates/Gathaiti_Kanjuku_Data_Template.xlsx` and run `connectSheet()`.)
3. Set the PINs with `setPins()`, then deploy as a web app.

Full steps: [docs/SETUP.md](docs/SETUP.md).

## Documentation

| Document | Audience |
|---|---|
| [SETUP.md](docs/SETUP.md) | Whoever installs and maintains the system |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Staff (data entry) and the owner (dashboard) |
| [DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md) | Sheet columns and every calculation |
| [SECURITY.md](docs/SECURITY.md) | PINs, access and data handling |

## Tech

Google Apps Script (V8), Google Sheets, Chart.js 4.4.1, plain HTML/CSS/JavaScript.
