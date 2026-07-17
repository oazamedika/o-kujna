# Кујна Дневник — Kitchen Logging PWA

A tablet-friendly PWA for logging kitchen meals (5 meal types), ingredients used (with smart unit dropdowns), and portions served. Backend is a Google Sheet via Apps Script. Frontend is plain HTML/CSS/JS, hostable on GitHub Pages.

## 1. Set up the Google Sheet backend

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet. Name it e.g. "Кујна Дневник".
2. Open **Extensions > Apps Script**.
3. Delete any starter code in `Code.gs`, then paste in the full contents of `apps-script/Code.gs` from this project.
4. Click the **Run** button once on the `setup` function (select it from the function dropdown first) to create the sheet tabs (`Users`, `Groceries`, `Entries`, `EntryItems`) and seed default data. You'll be asked to authorize — accept it (it's your own script on your own sheet).
5. Check the spreadsheet — you should now see 4 tabs. `Users` has one row: PIN `1234`, Name `Admin`. `Groceries` has ~24 starter Macedonian grocery items with allowed units.
6. **Edit the `Users` tab** to add your 5 real staff members: one row per person with their PIN and name. You can remove or keep the Admin row.
7. **Edit the `Groceries` tab** to add/remove items. Format for the `Units` column is comma-separated, e.g. `кг,г,пакување`. The app reads this list to build the unit dropdown for each ingredient — so whichever units you list per item is what shows up (that's the "smart" per-item restriction you asked for).

## 2. Deploy the Apps Script as a Web App

1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, authorize again if asked.
5. Copy the **Web app URL** (ends in `/exec`).

## 3. Connect the frontend to your backend

1. Open `js/config.js` in this project.
2. Replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the URL you copied.

```js
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

## 4. Host on GitHub Pages

1. Create a new GitHub repo, push the whole `kitchen-pwa` folder to it.
2. In the repo, go to **Settings > Pages**.
3. Under "Build and deployment", set **Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Save. GitHub will give you a URL like `https://yourusername.github.io/kitchen-pwa/`.

## 5. Install on the Android tablet

1. Open the GitHub Pages URL in Chrome on the tablet.
2. Chrome will show an "Install app" prompt (or use the ⋮ menu > "Add to Home screen" / "Install app").
3. Once installed, it opens full-screen like a native app, with the kitchen stamp icon.

## Notes on how it works

- **Login:** PIN pad (4 digits) checked against the `Users` sheet. No passwords, just PINs, per your spec.
- **New entry:** pick one of 5 meal types, add any number of ingredient rows (grocery + quantity + unit — units are filtered to only what's allowed for that grocery), write a short description, enter two portion counts (Корисници / Вработени), save. Saved rows go into `Entries` + `EntryItems`, linked by an EntryID.
- **View old entries:** read-only list, filterable by date range and meal type. No edit/delete, as requested.
- **Offline:** not supported by design (per your answer) — the app always needs a live connection to reach the Google Sheet. The service worker only caches the app shell (HTML/CSS/JS) so it loads instantly on repeat visits, not the data.
- **Adding more users/groceries later:** just edit the `Users` / `Groceries` tabs directly in the Google Sheet — no redeploy needed, changes take effect instantly.

## Changing the 5 meal types or portion labels

Meal type buttons are in `entry.html` (`#mealPicker`) and the filter dropdown in `view.html` (`#mealFilter`) — keep both lists identical. Portion labels ("Корисници" / "Вработени") are in `entry.html` and `js/view.js`.
