# Attendence-Managemet

A small client-side web app to manage classroom attendance.

Features
- Import students from Excel (.xlsx, .xls) or CSV (.csv)
- Add students manually
- Take attendance with checkboxes
- Generate a printable attendance report and copy present roll numbers to clipboard
- Data persisted in localStorage

Quick start
1. Open `index.html` in your browser (or serve the folder and visit `http://localhost:8000`).
   - To serve with Python: `python -m http.server 8000` and open `http://localhost:8000`.
   - Or use VS Code Live Server extension.
2. Use the **Students** tab to import an Excel/CSV file or add students manually.
3. Switch to **Attendance** to mark students present and generate the report.

Files
- `index.html` — main UI and markup
- `styles.css` — basic styling
- `script.js` — application logic (moved from inline script)

Notes & tips
- The app uses the `xlsx` library via CDN (included in `index.html`) to parse spreadsheets.
- If you notice any tab-switching quirks, change `showTab` to accept the `event` parameter instead of relying on the global `event` object.

Contributing
Contributions and improvements are welcome — open an issue or submit a pull request.