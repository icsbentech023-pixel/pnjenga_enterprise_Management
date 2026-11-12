# Data Dictionary

All data lives in the Google Sheet created by `setup()`. Do not rename tabs or reorder columns: the code reads them by position. Dates are stored as text `yyyy-mm-dd`.

## Items (price list, edited by the owner)
| Column | Meaning |
|---|---|
| Category | `Gas`, `Agrovet` or `M-Pesa` |
| Item | Name shown in the data entry page |
| Unit cost | Buying cost (KES) |
| Unit price | Selling price (KES) |
| Reorder level | Alert when the stock balance is at or below this number. Blank means no alert. Used for both businesses |

## Sales
`ID` (S-0001…), `Date`, `Business` (GATHAITI / KANJUKU), `Category`, `Item`, `Qty`, `Unit cost`, `Unit price`, `Total` (Qty × Unit price), `Profit` (Qty × (Unit price − Unit cost)), `Created`

## Stock
`ID` (R-0001…), `Date`, `Business`, `Category` (Gas or Agrovet), `Item`, `Qty`, `Unit cost`, `Total cost` (Qty × Unit cost), `Supplier`, `Created`

## Expenses
`ID` (E-0001…), `Date`, `Business`, `Type`, `Description`, `Amount`, `Created`

## MPesa (one row per business per day)
`ID` (M-0001…), `Date`, `Business`, `Opening float`, `Opening cash`, `Deposits`, `Withdrawals`, `Commission`, `Capital added` (owner top-up +, withdrawal −), `Closing float`, `Closing cash`, `Variance`, `Notes`, `Created`

**Variance** = (Closing float + Closing cash) − (Opening float + Opening cash) − Commission − Capital added. It should be 0. Deposits and withdrawals move money between float and cash, so they do not change the total and are recorded for information.

Opening balances are pre-filled from the previous closing for the same business.

## Calculations (dashboard)
| Measure | Formula |
|---|---|
| Gas / agrovet revenue | Σ Total |
| Gas / agrovet gross profit | Σ Profit |
| M-Pesa revenue and gross profit | Σ Commission from the MPesa tab (the amount transacted is not income) |
| M-Pesa variance (net profit card) | Σ of the absolute daily variances, so a +200 day and a −200 day do not cancel out |
| Total revenue | Gas + agrovet + M-Pesa commission |
| Net profit | Gross profit − expenses |
| Stock balance | Σ Stock Qty − Σ Sales Qty, per business and item, all time |
| Margin | Net profit ÷ revenue |

## Items tab rules
- The app can add items, change cost, price and reorder level, and delete items. It cannot rename an item or change its category.
- Item names are unique within a category (not case sensitive).

## Reorder alerts
- **In stock** = Σ Stock Qty − Σ Sales Qty for that business and item.
- **LOW**: in stock is at or below the item's Reorder level. **OUT**: in stock is 0 or less.
- After a sale is saved, the data entry page shows an amber warning if that item is now LOW or OUT.
- Items are matched by name. An item that has a reorder level but was never recorded in Stock received shows as OUT after its first sale, so enter opening stock first.

## Notes
- Totals and profit are recalculated by the server from quantity, cost and price. Values from the browser are not trusted.
- Stock matches items by **name**, so do not rename an item in the Items tab after entries exist.
- The dashboard works in days. "Previous period" is the range of the same length that ends the day before the selected range starts.
- Not tracked in this version: physical gas cylinder counts (full and empty) and cylinder exchange versus new sale. The earlier Kobo forms in `archive/kobo-forms/` covered these.
- Sales rows with category M-Pesa (from the first version) are ignored by the dashboard so commission is not counted twice.
