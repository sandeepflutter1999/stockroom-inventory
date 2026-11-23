# Stockroom

Stockroom is a sample inventory workspace for a small office-supply retailer. It includes a dashboard, sales orders, purchase orders, stock history, and downloadable reports.

## Run locally

Use Node.js 20.9 or later.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run check` for type checking and `npm run build` for a production build.

## Try the workflow

1. Open **Purchases** and receive **PO-1045**. The A4 document tray gains 24 units and clears its low-stock alert.
2. Open **Sales** and record a sale for 21 A4 document trays. Its quantity drops to 11 and its low-stock alert returns.
3. Open **Stock → Stock history** to see both movements. Search by item name or filter by movement type.
4. Open **Reports** to review stock, sales, or purchases. **Export CSV** downloads the currently filtered rows.

Purchase orders start pending. Receiving the same order twice does not change stock twice. Sales are completed when recorded and require enough stock on hand. The sample data and subsequent changes are stored in the current browser, with no account or external database.

## Deploy to Vercel

Import this repository as a Next.js project. The default build settings work without environment variables. If the app is kept inside another repository, set Vercel's root directory to `stockroom`.
