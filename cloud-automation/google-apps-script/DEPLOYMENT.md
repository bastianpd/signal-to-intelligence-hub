# Deploying the Google Apps Script webhook

1. Open script.google.com → **New project**. Replace the contents of `Code.gs` with this folder's `Code.gs`.
2. **Project Settings → Script properties**, add:
   - `SHARED_SECRET`: a long random string. **UPDATE** the same value in the firmware (`TOKEN`) and the simulator.
   - `ALERT_EMAIL`: the address that receives alerts.
   - `SHEET_ID` (optional): the ID from a Google Sheet URL, to log every alert as a row.
3. **Deploy → New deployment → Web app**. Execute as **Me**; who has access: **Anyone**.
4. Authorize the requested permissions (mail, and Sheets if you use `SHEET_ID`).
5. Copy the Web App URL ending in `/exec`.
6. Test: open the URL in a browser. You should see `{"ok":true,"service":"esp32-alerts"}`. Then use "Send test payload" in the Automation Studio.
7. **After every code edit: Deploy → Manage deployments → Edit → New version.** The old URL keeps running the old code otherwise.

Troubleshooting: `Unauthorized` means the token differs; `Server not configured` means a script property is missing; Gmail quota limits MailApp to roughly 100 recipients per day on free accounts.
