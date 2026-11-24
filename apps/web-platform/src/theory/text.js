// Text encoding and Shannon information measures.
export const toBin = (n, w = 8) => (n >>> 0).toString(2).padStart(w, "0");
export const toHex = (n, w = 2) => n.toString(16).toUpperCase().padStart(w, "0");

// One row per UTF-16 code unit; for code points <= 255 this is ASCII / Latin-1.
export function asciiTable(text) {
  return [...text].map((ch) => {
    const c = ch.charCodeAt(0);
    return { ch, dec: c, hex: toHex(c), bin: toBin(c & 0xff), extended: c > 255 };
  });
}
// UTF-8 bytes per character (1-4 bytes), exact via TextEncoder.
export function utf8Table(text) {
  const enc = new TextEncoder();
  return [...text].map((ch) => {
    const bytes = [...enc.encode(ch)];
    return { ch, codePoint: ch.codePointAt(0), bytes: bytes.map((b) => ({ dec: b, hex: toHex(b), bin: toBin(b) })) };
  });
}
export const utf8Length = (text) => new TextEncoder().encode(text).length;

export function frequencies(text) {
  const map = new Map();
  for (const ch of text) map.set(ch, (map.get(ch) || 0) + 1);
  const n = [...map.values()].reduce((a, b) => a + b, 0);
  return [...map].map(([ch, count]) => ({ ch, count, p: count / n })).sort((a, b) => b.count - a.count);
}
// H = -sum p_i log2 p_i  (bits/symbol)
export const entropy = (freqs) => freqs.reduce((h, { p }) => (p > 0 ? h - p * Math.log2(p) : h), 0);
// Theoretical lossless minimum (source-coding bound, symbol-by-symbol) vs raw 8-bit length.
export function bitBounds(text) {
  const f = frequencies(text), n = [...text].length, H = entropy(f);
  return { n, H, minBits: H * n, rawBits: n * 8, savedBits: n * 8 - H * n };
}
