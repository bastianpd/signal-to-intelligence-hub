import React, { useRef, useState } from "react";
import { adc12, adcToVolts, toBin, hysteresis } from "../theory/index.js";
export default function Studio() {
  const [lux, setLux] = useState(300), [temp, setTemp] = useState(24), [sw, setSw] = useState(false);
  const [lo, setLo] = useState(28), [hi, setHi] = useState(30), [url, setUrl] = useState(""), [token, setToken] = useState("change-me");
  const [alarm, setAlarm] = useState(false), [log, setLog] = useState([]), [cool, setCool] = useState(60), last = useRef(0);
  // Sensor models: LDR divider (log response, 0-1000 lux) and TMP36-style sensor (500 mV + 10 mV/degC).
  const vLight = Math.min(3.3, (3.3 * Math.log10(1 + lux)) / Math.log10(1001));
  const vTemp = 0.5 + temp * 0.01, cL = adc12(vLight), cT = adc12(vTemp);
  const tempBack = (adcToVolts(cT) - 0.5) / 0.01, next = hysteresis(alarm, tempBack, lo, hi);
  const payload = { device: "esp32-lab-01", token, ts: new Date().toISOString(), temp_c: +tempBack.toFixed(2), temp_adc: cT, temp_bin: toBin(cT, 12),
    light_adc: cL, light_bin: toBin(cL, 12), switch: sw ? 1 : 0, alarm: next };
  const add = (m) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${m}`, ...l].slice(0, 12));
  async function send(p) {
    if (!url) { add("Simulated POST (no Web App URL configured)"); return; }
    try { // text/plain avoids a CORS preflight, which Apps Script cannot answer
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(p) });
      add(`Live POST: HTTP ${r.status} ${(await r.text()).slice(0, 100)}`);
    } catch (e) { add(`Live POST failed: ${e.message}`); }
  }
  async function evaluate() {
    if (next === alarm) { add("No state change; no email"); return; }
    setAlarm(next); add(next ? `ALARM ON (${tempBack.toFixed(1)} °C ≥ ${hi})` : `ALARM OFF (${tempBack.toFixed(1)} °C ≤ ${lo})`);
    if (!next) return;
    const now = Date.now();
    if (now - last.current < cool * 1000) { add(`Email suppressed by ${cool} s cooldown`); return; }
    last.current = now; await send(payload);
  }
  return (<section>
    <h2>ESP32 automation &amp; email alerts</h2>
    <div className="row">
      <label>Light {lux} lux<input type="range" min="0" max="1000" value={lux} onChange={(e) => setLux(+e.target.value)} /></label>
      <label>Temperature {temp} °C<input type="range" min="0" max="80" value={temp} onChange={(e) => setTemp(+e.target.value)} /></label>
      <label>Limit switch closed<input type="checkbox" checked={sw} onChange={(e) => setSw(e.target.checked)} /></label>
      <label>Release ≤ {lo} °C<input type="range" min="0" max={hi - 1} value={lo} onChange={(e) => setLo(+e.target.value)} /></label>
      <label>Trip ≥ {hi} °C<input type="range" min={lo + 1} max="80" value={hi} onChange={(e) => setHi(+e.target.value)} /></label>
    </div>
    <table><thead><tr><th>Sensor</th><th>Volts (0–3.3 V)</th><th>ADC (12-bit)</th><th>Binary</th></tr></thead><tbody>
      <tr><td>Light</td><td>{vLight.toFixed(3)}</td><td>{cL}</td><td>{toBin(cL, 12)}</td></tr>
      <tr><td>Temperature</td><td>{vTemp.toFixed(3)}</td><td>{cT}</td><td>{toBin(cT, 12)}</td></tr>
      <tr><td>Switch (GPIO, pull-up)</td><td>{sw ? "0.000" : "3.300"}</td><td>{sw ? 0 : 1}</td><td>{sw ? "0" : "1"}</td></tr></tbody></table>
    <p>One ADC step = {((3.3 / 4095) * 1000).toFixed(3)} mV ≈ {(3.3 / 4095 / 0.01).toFixed(3)} °C. Relay and LED: <b className={alarm ? "warn" : "hi"}>{alarm ? "energised" : "off"}</b></p>
    <div className="row"><label>Apps Script Web App URL (optional)<input style={{ width: 340 }} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" /></label>
      <label>Shared secret<input value={token} onChange={(e) => setToken(e.target.value)} /></label>
      <label>Cooldown (s)<input type="number" min="0" value={cool} onChange={(e) => setCool(+e.target.value)} style={{ width: 80 }} /></label>
      <button className="p" onClick={evaluate}>Run automation cycle</button>
      <button onClick={() => send(payload)}>Send test payload</button></div>
    <h3>JSON payload</h3><pre>{JSON.stringify(payload, null, 2)}</pre>
    <h3>Email preview</h3>
    <pre>{`Subject: [ESP32 ALERT] ${payload.device}: ${payload.temp_c} °C\n\nTemperature: ${payload.temp_c} °C\nADC: ${cT} (${toBin(cT, 12)})\nLight ADC: ${cL} (${toBin(cL, 12)})\nSwitch: ${payload.switch}\nTime: ${payload.ts}`}</pre>
    <h3>Event log</h3><pre>{log.join("\n") || "Run an automation cycle."}</pre>
  </section>);
}
