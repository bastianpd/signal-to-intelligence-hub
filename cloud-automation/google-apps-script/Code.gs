/**
 * ESP32 alert receiver. Deploy: Deploy > New deployment > Web app;
 * Execute as: Me; Who has access: Anyone. Set script properties
 * SHARED_SECRET and ALERT_EMAIL under Project Settings.
 * UPDATE (optional): add script property SHEET_ID to also log each alert to a Google Sheet.
 */
function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty("SHARED_SECRET"), to = props.getProperty("ALERT_EMAIL");
    if (!secret || !to) return json_({ ok: false, error: "Server not configured" });
    if (!e || !e.postData || !e.postData.contents) return json_({ ok: false, error: "Empty body" });
    const d = JSON.parse(e.postData.contents);
    if (d.token !== secret) return json_({ ok: false, error: "Unauthorized" });
    for (const k of ["device", "temp_c", "temp_adc", "temp_bin"]) if (d[k] === undefined) return json_({ ok: false, error: "Missing field: " + k });
    const ts = d.ts || new Date().toISOString();
    const body = [
      "Device: " + String(d.device).slice(0, 40), "Time: " + ts,
      "Temperature: " + d.temp_c + " °C", "Temperature ADC: " + d.temp_adc + " (" + d.temp_bin + ")",
      "Light ADC: " + d.light_adc + " (" + d.light_bin + ")", "Switch: " + d.switch, "Alarm: " + d.alarm
    ].join("\n");
    MailApp.sendEmail(to, "[ESP32 ALERT] " + d.device + ": " + d.temp_c + " °C", body);
    const logged = logRow_(props.getProperty("SHEET_ID"), d, ts);
    return json_({ ok: true, sent: true, logged: logged });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
}
function doGet() { return json_({ ok: true, service: "esp32-alerts" }); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Appends one row to the first sheet of the spreadsheet identified by SHEET_ID. Returns false if disabled or failed.
function logRow_(sheetId, d, ts) {
  if (!sheetId) return false;
  try {
    const sh = SpreadsheetApp.openById(sheetId).getSheets()[0];
    if (sh.getLastRow() === 0) sh.appendRow(["timestamp", "device", "temp_c", "temp_adc", "temp_bin", "light_adc", "light_bin", "switch", "alarm"]);
    sh.appendRow([ts, d.device, d.temp_c, d.temp_adc, d.temp_bin, d.light_adc, d.light_bin, d.switch, d.alarm]);
    return true;
  } catch (err) { return false; }
}
