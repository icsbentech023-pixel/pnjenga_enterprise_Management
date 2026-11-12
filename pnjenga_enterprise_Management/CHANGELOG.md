# Changelog

## 1.5.0 - 2026-11-12
- New **Items** tab in data entry: add, edit (cost, price, reorder level) and delete price-list items
- Items tab needs the owner PIN when an owner PIN is set

## 1.4.0 - 2026-11-12
- Reorder alerts: new **Reorder level** column in the Items tab
- Data entry shows an amber warning after a sale that takes an item to or below its level
- Dashboard: Reorder alerts card, alert count in the header, and Reorder at / Status columns in the stock table
- `setup()` now adds the Reorder level column to an existing Items tab

## 1.3.0 - 2026-11-12
- Redesigned dashboard (graphite theme, amber for Gathaiti, blue for Kanjuku)
- Weekly chart, week filter and this/last week cards replaced by a daily chart, a date range, a Today panel and a day-by-day table
- Period-over-period change on the main tiles

## 1.2.1 - 2026-11-12
- Added `templates/Gathaiti_Kanjuku_Data_Template.xlsx` (Items, Sales, Stock, Expenses, MPesa) and `connectSheet()` to use it

## 1.2.0 - 2026-11-12
- New **M-Pesa** tab in data entry: daily opening and closing float and cash, deposits, withdrawals, commission, owner top-up or withdrawal, notes
- Float and cash reconciliation with an automatic variance (should be 0); opening balances pre-filled from the previous closing
- Dashboard: M-Pesa float and cash table per business and M-Pesa variance in the net profit card
- M-Pesa commission now comes from the MPesa tab. M-Pesa can no longer be entered as a sale; earlier M-Pesa rows in the Sales tab are ignored by the dashboard

## 1.1.0 - 2026-11-12
- Data entry page (Daily sales, Stock received, Expenses) saving to a Google Sheet
- Dashboard now reads the Google Sheet instead of Kobo
- Staff and owner PINs
- Server-side validation; totals and profit recalculated on the server
- Earlier Kobo forms moved to `archive/kobo-forms/`

## 1.0.0 - 2026-11-12
- Initial release: Kobo forms and a dashboard reading Kobo through the API
