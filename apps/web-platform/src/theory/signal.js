// Core information-theory and signal math. Pure functions, no DOM.
export const sizes = (bits) => ({ bits, bytes: bits / 8, kib: bits / 8 / 1024 });
export const nyquist = (fs) => fs / 2;
export const quantStep = (bits, vpp = 2) => vpp / (2 ** bits - 1);
export const bitrate = (fs, bits, ch = 1) => fs * bits * ch;
export function quantize(x, bits) { // x in [-1,1] -> code 0..2^bits-1
  const L = 2 ** bits - 1, c = Math.round(((Math.max(-1, Math.min(1, x)) + 1) / 2) * L);
  return { code: c, value: (c / L) * 2 - 1 };
}
export function wave(type, f, t) {
  const ph = (f * t) % 1;
  switch (type) {
    case "square": return ph < 0.5 ? 1 : -1;
    case "triangle": return 4 * Math.abs(ph - 0.5) - 1;
    case "sawtooth": return 2 * ph - 1;
    default: return Math.sin(2 * Math.PI * f * t);
  }
}
// Single-pole IIR low-pass: y[n] = y[n-1] + a (x[n] - y[n-1])
export function lowpass(xs, fc, fs) {
  if (!fc) return xs.slice();
  const rc = 1 / (2 * Math.PI * fc), a = 1 / fs / (rc + 1 / fs);
  let y = xs[0] || 0;
  return xs.map((x) => (y += a * (x - y)));
}
// ESP32 chain: physical value -> volts (0-3.3) -> 12-bit ADC code
export const adc12 = (v) => Math.round((Math.max(0, Math.min(3.3, v)) / 3.3) * 4095);
export const adcToVolts = (c) => (c / 4095) * 3.3;
// Schmitt-style hysteresis: trips at/above hi, releases at/below lo
export const hysteresis = (state, x, lo, hi) => (state ? x > lo : x >= hi);
// Ideal full-scale sine SQNR approximation: 6.02 N + 1.76 dB
export const sqnrDb = (bits) => 6.02 * bits + 1.76;
// Quantization error (RMS) of a signal in [-1,1] at N bits
export function quantError(xs, bits) {
  if (!xs.length) return 0;
  return Math.sqrt(xs.reduce((a, x) => a + (x - quantize(x, bits).value) ** 2, 0) / xs.length);
}
