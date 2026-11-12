# PNJENGA ENTERPRISE — Gathaiti & Kanjuku

Starter dashboard prototype for a two-branch business management application.

## Included
- Combined dashboard with Gathaiti / Kanjuku branch filter
- Gas, M-Pesa and Agrovet sections
- Manual transaction entry
- M-Pesa transaction-code field
- Basic M-Pesa reconciliation variance calculator
- CSV export is planned for the next version
- Basic PWA manifest and service worker

## Upload to GitHub
Upload all files in this folder into your repository's `pnjenga-enterprise/` folder. Keep the existing repository files unchanged.

## Important prototype limitation
This version stores entries in the browser's local storage on one device. It does not yet provide secure user accounts, role-based access, shared database storage, multi-device synchronization, backups, audit logs, stock ledgers or real M-Pesa integration. Do not use it as the official financial record system until a secure backend and access controls are implemented.

## Next development stage
1. Secure Admin and Staff sign-in
2. Shared cloud database and branch-level permissions
3. Gas cylinder stock, purchases, refills and sales
4. Agrovet product inventory, purchases and sales
5. M-Pesa manual entries, duplicate transaction-code checks and reconciliation
6. Daily, weekly and branch reports
7. Audit trail, backups and deployment
