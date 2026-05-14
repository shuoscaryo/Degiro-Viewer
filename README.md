# Degiro Viewer

A small static starter app for inspecting Degiro CSV exports in the browser.

## Use

Open `index.html` directly in a browser and upload a Degiro CSV file. No server,
build step, or dependency install is required.

The current parser handles quoted CSV fields, comma or semicolon delimiters, and
common Degiro-style English and Dutch column names. It summarizes:

- total rows
- deposits and withdrawals
- fees and commissions
- dividends
- buy and sell activity
- simple product positions from quantity rows
- recent CSV rows

## Files

- `index.html` - page structure
- `styles.css` - responsive styling
- `app.js` - CSV parsing, analysis, and rendering

## Notes

This is a local viewer, so the CSV file never leaves the browser. The financial
summary is a practical first pass and should be checked against Degiro statements
before treating it as accounting-grade data.
