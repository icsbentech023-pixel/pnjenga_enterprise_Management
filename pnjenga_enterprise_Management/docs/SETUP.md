# Setup Guide

## Requirements
A Google account. Staff need a phone or tablet with a browser.

## 1. Create the Apps Script project
1. Go to script.google.com and create a **New project**.
2. Replace `Code.gs` with `apps-script/Code.gs`.
3. Add two HTML files named exactly `DataEntry` and `Index`, and paste in the matching files.
4. In **Project Settings** tick **Show "appsscript.json" manifest file** and paste in `apps-script/appsscript.json`.

## 2. Create the Google Sheet

**Option A: let the script create it.** Run `setup()` from the editor and authorise the script. It creates a spreadsheet called **Gathaiti & Kanjuku Data** with five tabs (Items, Sales, Stock, Expenses, MPesa) and a starter price list. The log shows the sheet's link, and its ID is stored in Script Properties.

**Option B: use the ready-made template.** Upload `templates/Gathaiti_Kanjuku_Data_Template.xlsx` to Google Drive, open it and choose **File → Save as Google Sheets** (the app cannot read a file that is still in Excel format). Copy the sheet ID from the address bar (the text between `/d/` and `/edit`), paste it into `connectSheet()` in `Code.gs` and run `connectSheet` once. It checks the tabs and headers and adds anything missing.

## 3. Set your price list
Open the **Items** tab and edit it (blue cells; the sample prices are placeholders): one row per item with Category (`Gas` or `Agrovet`), Item, Unit cost, Unit price and **Reorder level**. The reorder level is the stock number at or below which you want an alert (leave it blank for no alert). One level is used for both businesses. You can also add and edit items from the **Items** tab of the data entry page (see the user guide). Staff see these items in the data entry page, with cost and price filled in automatically. M-Pesa is not a price-list item: it has its own tab in the data entry page. If your Items tab has an old M-Pesa row, delete it.

**Updating an existing install:** paste in the new files, run `setup()` again (it only adds missing tabs and columns, such as MPesa and Reorder level, and leaves your data alone), then create a new deployment version.

## 4. Set the PINs
1. In `setPins()`, replace `CHANGE_ENTRY_PIN` (staff) and `CHANGE_OWNER_PIN` (owner).
2. Run `setPins` once, then **delete the PIN text from the code** and never commit it.

The staff PIN opens data entry only. The owner PIN opens the dashboard and data entry.

## 5. Deploy
1. **Deploy → New deployment → Web app**. Execute as **Me**.
2. Who has access:
   - **Anyone** (Google sign-in) or **Anyone, even anonymous** so staff can open it without a Google account. This is safe only with PINs set.
   - **Only myself** if only you will use it.
3. Share the URL with staff. The dashboard is the same URL with `?page=dashboard` on the end (the "Open dashboard" link on the data entry page adds it).

After any code change use **Deploy → Manage deployments → Edit → New version**. The URL stays the same.

## 6. First-time data
- Test the sales, stock and expense tabs, then delete the test rows in the sheet.
- Enter current stock once as a **Stock received** entry, otherwise balances start at zero.

## Updating the price list
Edit the **Items** tab at any time. New prices apply to new entries only. Old entries keep the price they were saved with.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Run setup() once first" | `setup()` has not been run |
| "Wrong PIN" | PIN does not match; the owner PIN is required for the dashboard |
| Item list is empty | The Items tab has no rows, or the category is spelled differently from Gas, Agrovet, M-Pesa |
| Dashboard shows zeros | No entries yet, or dates are outside the selected period |
| Negative stock | A delivery was not entered, or an item name was changed after entries were made |
| Browser shows an old version | Create a **New version** in Manage deployments |
