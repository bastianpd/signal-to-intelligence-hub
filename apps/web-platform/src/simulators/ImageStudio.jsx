import React, { useEffect, useRef, useState } from "react";
import { toBin, sizes } from "../theory/index.js";
const N = 16;
export default function Studio() {
  const cv = useRef(null), hist = useRef(null), data = useRef(new ImageData(N, N)), down = useRef(false);
  const [px, setPx] = useState(null), [color, setColor] = useState("#0b6e69"), [dim, setDim] = useState([N, N]);
  useEffect(() => { const d = data.current.data; for (let i = 0; i < d.length; i++) d[i] = 255; render(); }, []);
  function render() {
    const c = cv.current, g = c.getContext("2d"), im = data.current, off = document.createElement("canvas");
    off.width = im.width; off.height = im.height; off.getContext("2d").putImageData(im, 0, 0);
    const s = Math.max(1, Math.floor(480 / Math.max(im.width, im.height)));
    c.width = im.width * s; c.height = im.height * s; g.imageSmoothingEnabled = false; g.drawImage(off, 0, 0, c.width, c.height); c.dataset.s = s;
    const h = [0, 1, 2].map(() => new Array(256).fill(0));
    for (let i = 0; i < im.data.length; i += 4) for (let k = 0; k < 3; k++) h[k][im.data[i + k]]++;
    const hc = hist.current.getContext("2d"), mx = Math.max(...h.flat(), 1); hc.clearRect(0, 0, 512, 120);
    ["#d33", "#3a3", "#36d"].forEach((col, k) => { hc.strokeStyle = col; hc.beginPath(); h[k].forEach((v, x) => { hc.moveTo(x * 2, 120); hc.lineTo(x * 2, 120 - (v / mx) * 118); }); hc.stroke(); });
    setDim([im.width, im.height]);
  }
  function at(e) {
    const r = cv.current.getBoundingClientRect(), s = +cv.current.dataset.s, k = cv.current.width / r.width, im = data.current;
    return [Math.min(im.width - 1, Math.floor(((e.clientX - r.left) * k) / s)), Math.min(im.height - 1, Math.floor(((e.clientY - r.top) * k) / s))];
  }
  function inspect(e) {
    const [x, y] = at(e), i = (y * data.current.width + x) * 4, d = data.current.data;
    setPx({ x, y, r: d[i], g: d[i + 1], b: d[i + 2] }); return i;
  }
  function paint(e) {
    const i = inspect(e), d = data.current.data, v = parseInt(color.slice(1), 16);
    d[i] = v >> 16; d[i + 1] = (v >> 8) & 255; d[i + 2] = v & 255; d[i + 3] = 255; render();
  }
  function upload(e) {
    const f = e.target.files[0]; if (!f) return; const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, 128 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
      const o = document.createElement("canvas"); o.width = w; o.height = h; const g = o.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
      data.current = g.getImageData(0, 0, w, h); render(); URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  }
  const total = sizes(dim[0] * dim[1] * 24), hx = (v) => v.toString(16).padStart(2, "0");
  return (<section>
    <h2>Image</h2>
    <p>Uploads are downscaled to at most 128 px on the long side. Click or drag to draw; hover to inspect a pixel.</p>
    <div className="row"><label>Upload image<input type="file" accept="image/*" onChange={upload} /></label>
      <label>Brush colour<input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label></div>
    <canvas ref={cv} onMouseMove={(e) => (down.current ? paint(e) : inspect(e))} onMouseDown={(e) => { down.current = true; paint(e); }}
      onMouseUp={() => (down.current = false)} onMouseLeave={() => (down.current = false)} style={{ cursor: "crosshair", imageRendering: "pixelated" }} />
    <div className="stats"><div><b>{dim[0]}×{dim[1]}</b><span>pixels</span></div><div><b>{dim[0] * dim[1] * 24}</b><span>bits (24-bit RGB)</span></div>
      <div><b>{total.bytes}</b><span>bytes ({total.kib.toFixed(2)} KiB)</span></div></div>
    {px && <table><thead><tr><th>Pixel ({px.x}, {px.y})</th><th>Value</th><th>8-bit binary</th></tr></thead>
      <tbody>{[["R", px.r], ["G", px.g], ["B", px.b]].map(([n, v]) => <tr key={n}><td>{n}</td><td>{v}</td><td>{toBin(v)}</td></tr>)}
        <tr><td>RGB24</td><td>#{hx(px.r)}{hx(px.g)}{hx(px.b)}</td><td>{toBin(px.r)} {toBin(px.g)} {toBin(px.b)}</td></tr></tbody></table>}
    <h3>Channel histograms (red, green, blue)</h3><canvas ref={hist} width="512" height="120" />
  </section>);
}
