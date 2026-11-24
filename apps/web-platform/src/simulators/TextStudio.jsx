import React, { useMemo, useState } from "react";
import { asciiTable, frequencies, entropy, sizes, utf8Table, utf8Length, bitBounds } from "../theory/index.js";
export default function Studio() {
  const [text, setText] = useState("Hello, 42!");
  const rows = useMemo(() => asciiTable(text), [text]);
  const f = useMemo(() => frequencies(text), [text]);
  const u = useMemo(() => utf8Table(text), [text]), bb = bitBounds(text), H = entropy(f), s = sizes(rows.length * 8);
  return (<section>
    <h2>Text &amp; numbers</h2>
    <label>Type letters, words, sentences or numbers<textarea value={text} onChange={(e) => setText(e.target.value)} /></label>
    <div className="stats">
      <div><b>{H.toFixed(4)}</b><span>Shannon entropy H (bits/symbol)</span></div>
      <div><b>{rows.length}</b><span>symbols</span></div>
      <div><b>{s.bits}</b><span>bits at 8 bits/char</span></div>
      <div><b>{s.bytes}</b><span>bytes ({s.kib.toFixed(4)} KiB)</span></div>
      <div><b>{(H * rows.length).toFixed(1)}</b><span>bits at entropy bound</span></div>
    </div>
    <p>An 8-bit code spends 8 bits per symbol; entropy is the lower bound for a lossless symbol code of this distribution. Gap: {(8 - H).toFixed(3)} bits/symbol.</p>
    {rows.some((r) => r.extended) && <p className="warn">Characters above code 255 are truncated to their low 8 bits here; UTF-8 would use multi-byte sequences.</p>}
    <table><thead><tr><th>Char</th><th>Dec</th><th>Hex</th><th>Binary (high nibble, low nibble)</th></tr></thead>
      <tbody>{rows.map((r, k) => <tr key={k}><td>{r.ch === " " ? "␠" : r.ch}</td><td>{r.dec}</td><td>0x{r.hex}</td>
        <td><span className="byte"><span className="hi">{r.bin.slice(0, 4)}</span><span>{r.bin.slice(4)}</span></span></td></tr>)}</tbody></table>
    <h3>UTF-8 encoding ({utf8Length(text)} bytes; minimum bound {bb.minBits.toFixed(1)} of {bb.rawBits} raw bits)</h3>
    <table><thead><tr><th>Char</th><th>Code point</th><th>UTF-8 bytes (hex)</th><th>Bit stream</th></tr></thead>
      <tbody>{u.map((r, k) => <tr key={k}><td>{r.ch === " " ? "␠" : r.ch}</td><td>U+{r.codePoint.toString(16).toUpperCase().padStart(4, "0")}</td>
        <td>{r.bytes.map((b) => b.hex).join(" ")}</td><td>{r.bytes.map((b) => b.bin).join(" ")}</td></tr>)}</tbody></table>
    <h3>Symbol frequencies</h3>
    <table><thead><tr><th>Symbol</th><th>Count</th><th>p</th><th>−p·log₂p</th><th></th></tr></thead>
      <tbody>{f.map((x) => <tr key={x.ch}><td>{x.ch === " " ? "␠" : x.ch}</td><td>{x.count}</td><td>{x.p.toFixed(4)}</td>
        <td>{(-x.p * Math.log2(x.p)).toFixed(4)}</td><td><div style={{ background: "var(--acc)", height: 8, width: `${x.p * 200}px` }} /></td></tr>)}</tbody></table>
  </section>);
}
