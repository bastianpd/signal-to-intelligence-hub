import React, { useEffect, useRef, useState } from "react";
import { sqnrDb, quantError, wave, quantize, lowpass, toBin, nyquist, quantStep, bitrate, sizes } from "../theory/index.js";
export default function Studio() {
  const [type, setType] = useState("sine"), [f, setF] = useState(440), [amp, setAmp] = useState(0.8), [dur, setDur] = useState(0.01);
  const [fs, setFs] = useState(8000), [bits, setBits] = useState(4), [fc, setFc] = useState(0), [src, setSrc] = useState("synth");
  const [err, setErr] = useState(0), [micMsg, setMicMsg] = useState(""), [words, setWords] = useState([]);
  const mic = useRef(null), cv = useRef(null), micBuf = useRef(null), p = useRef({});
  p.current = { type, f, amp, dur, fs, bits, fc, src };
  useEffect(() => () => mic.current?.stop(), []);
  async function startMic() {
    if (!navigator.mediaDevices?.getUserMedia) { setMicMsg("Microphone API unavailable; using the synthesized signal."); setSrc("synth"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext(), an = ctx.createAnalyser(); an.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(an);
      micBuf.current = { an, buf: new Float32Array(an.fftSize), ctx };
      const m = { raf: 0, stop() { cancelAnimationFrame(m.raf); stream.getTracks().forEach((t) => t.stop()); ctx.close(); } };
      const loop = () => { an.getFloatTimeDomainData(micBuf.current.buf); draw(); m.raf = requestAnimationFrame(loop); };
      m.raf = requestAnimationFrame(loop); mic.current = m;
      p.current.src = "mic"; setMicMsg(`Microphone live (device rate ${ctx.sampleRate} Hz).`); setSrc("mic");
    } catch (e) { setMicMsg(`Microphone ${e.name === "NotAllowedError" ? "permission denied" : "unavailable"}; using the synthesized signal.`); setSrc("synth"); }
  }
  function stopMic() { mic.current?.stop(); mic.current = null; micBuf.current = null; setSrc("synth"); setMicMsg(""); }
  function signal() {
    const { type, f, amp, dur, src } = p.current, simFs = 48000;
    if (src === "mic" && micBuf.current) {
      const n = Math.min(micBuf.current.buf.length, Math.floor(micBuf.current.ctx.sampleRate * dur));
      return { cont: Array.from(micBuf.current.buf.slice(0, n)), rate: micBuf.current.ctx.sampleRate };
    }
    return { cont: Array.from({ length: Math.floor(simFs * dur) }, (_, i) => amp * wave(type, f, i / simFs)), rate: simFs };
  }
  function draw() {
    const c = cv.current; if (!c) return;
    const { fs, bits, fc, src } = p.current, g = c.getContext("2d"), W = c.width, H = c.height;
    const { cont, rate } = signal(), filt = lowpass(cont, fc, rate), ns = Math.max(1, Math.floor((cont.length / rate) * fs));
    const css = getComputedStyle(document.documentElement), line = css.getPropertyValue("--line"), mut = css.getPropertyValue("--mut"), acc = css.getPropertyValue("--acc");
    g.clearRect(0, 0, W, H); g.strokeStyle = line; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    g.strokeStyle = mut; g.beginPath();
    filt.forEach((v, i) => { const x = (i / filt.length) * W, y = H / 2 - (v * H) / 2.2; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    g.strokeStyle = acc; g.fillStyle = acc; g.beginPath();
    const ws = [];
    for (let k = 0; k < ns; k++) {
      const idx = Math.min(filt.length - 1, Math.floor((k / fs) * rate)), q = quantize(filt[idx], bits);
      const x = (k / ns) * W, y = H / 2 - (q.value * H) / 2.2;
      k ? g.lineTo(x, y) : g.moveTo(x, y); g.fillRect(x - 2, y - 2, 4, 4);
      if (k < 16) ws.push({ k, v: filt[idx], code: q.code, bin: toBin(q.code, bits) });
    }
    g.stroke(); setErr(quantError(filt, bits)); if (src === "synth") setWords(ws);
  }
  useEffect(() => { if (src === "synth") draw(); }, [type, f, amp, dur, fs, bits, fc, src]);
  const alias = src === "synth" && f > nyquist(fs) ? Math.abs(f - fs * Math.round(f / fs)) : null;
  const total = sizes(Math.floor(fs * dur) * bits);
  return (<section>
    <h2>Sound</h2>
    <div className="row">
      <label>Waveform<select value={type} onChange={(e) => setType(e.target.value)}>{["sine", "square", "triangle", "sawtooth"].map((t) => <option key={t}>{t}</option>)}</select></label>
      <label>Frequency {f} Hz<input type="range" min="20" max="4000" value={f} onChange={(e) => setF(+e.target.value)} /></label>
      <label>Amplitude {amp}<input type="range" min="0.1" max="1" step="0.05" value={amp} onChange={(e) => setAmp(+e.target.value)} /></label>
      <label>Duration {Math.round(dur * 1000)} ms<input type="range" min="0.002" max="0.04" step="0.001" value={dur} onChange={(e) => setDur(+e.target.value)} /></label>
    </div>
    <div className="row">
      <label>Sample rate (Hz)<select value={fs} onChange={(e) => setFs(+e.target.value)}>{[500, 1000, 2000, 4000, 8000, 16000, 44100].map((r) => <option key={r}>{r}</option>)}</select></label>
      <label>Bit depth<select value={bits} onChange={(e) => setBits(+e.target.value)}>{[4, 8, 12, 16].map((b) => <option key={b}>{b}</option>)}</select></label>
      <label>Low-pass cutoff {fc || "off"} Hz<input type="range" min="0" max="4000" step="50" value={fc} onChange={(e) => setFc(+e.target.value)} /></label>
      {src === "mic" ? <button className="p" onClick={stopMic}>Stop microphone</button> : <button className="p" onClick={startMic}>Use microphone</button>}
    </div>
    {micMsg && <p className="warn" role="status">{micMsg}</p>}
    <canvas ref={cv} width="960" height="260" aria-label="Continuous signal (grey) versus quantized samples (teal)" />
    <div className="stats">
      <div><b>{nyquist(fs)} Hz</b><span>Nyquist frequency</span></div>
      <div><b>{quantStep(bits).toFixed(6)}</b><span>step size (full scale 2.0)</span></div>
      <div><b>{(bitrate(fs, bits) / 1000).toFixed(1)} kbit/s</b><span>bitrate (mono)</span></div>
      <div><b>{total.bytes} B</b><span>window payload ({total.bits} bits)</span></div>
      <div><b>{err.toFixed(5)}</b><span>RMS quantization error (full scale ±1)</span></div>
      <div><b>{sqnrDb(bits).toFixed(1)} dB</b><span>ideal SQNR</span></div>
    </div>
    {alias !== null && <p className="warn">Aliasing: {f} Hz exceeds Nyquist; it appears near {alias} Hz.</p>}
    <table><thead><tr><th>n</th><th>Sample</th><th>Code</th><th>{bits}-bit word</th></tr></thead>
      <tbody>{words.map((w) => <tr key={w.k}><td>{w.k}</td><td>{w.v.toFixed(4)}</td><td>{w.code}</td><td>{w.bin}</td></tr>)}</tbody></table>
  </section>);
}
