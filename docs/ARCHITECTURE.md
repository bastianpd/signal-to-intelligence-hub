# Architecture

## Pipeline
Real-world source → transduction and signal conditioning → sampling and quantization → binary / ASCII / numeric representation → processing, alerts and automation.

| Stage | Physics / maths | Where it lives |
|---|---|---|
| Source | light, temperature, sound pressure, symbols, pixels | all four studios |
| Transduction and conditioning | sensor → voltage, divider, RC low-pass, clamp to 0-3.3 V | `edge-hardware/schematics-bom`, Automation Studio |
| Sampling and quantization | fs ≥ 2·fmax; step Δ = Vpp / (2^N − 1); SQNR ≈ 6.02N + 1.76 dB | `theory/signal.js`, Sound Studio |
| Representation | ASCII/UTF-8 bytes, 12-bit ADC codes, 24-bit RGB; entropy bound H | `theory/text.js`, Text and Image Studios |
| Processing and automation | hysteresis trip/release, cooldown, HTTPS POST, email, sheet log | firmware, `cloud-automation` |

## Code layout
- `apps/web-platform/src/theory`: pure functions with no DOM access, reusable by later phases.
- `apps/web-platform/src/simulators`: one React component per studio.
- Data flow to the cloud: ESP32 → HTTPS POST (JSON, `text/plain` content type) → Apps Script `doPost` → `MailApp` and optional Sheet row.
