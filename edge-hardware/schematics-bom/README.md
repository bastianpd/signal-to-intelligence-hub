# Schematics and bill of materials

**Safety rule:** ESP32 GPIOs are 3.3 V only (absolute maximum about 3.6 V). Never connect a 5 V or higher signal directly. Divide it down, clamp it, or level-shift it.

## Pin map (UPDATE if you change pins in the firmware)
| Function | GPIO | Notes |
|---|---|---|
| Temperature sensor | 34 | ADC1, input only |
| Light sensor | 35 | ADC1, input only |
| Limit switch | 27 | internal pull-up, pressed = LOW |
| MOSFET gate (relay) | 26 | via 100 Ω |
| Status LED | 2 | via 330 Ω |

## Components and why
- **ESP32 DevKit**: 3.3 V logic, 12-bit SAR ADC, Wi-Fi.
- **ADC1 vs ADC2**: ADC2 is shared with the Wi-Fi radio and returns errors while Wi-Fi is active. Use ADC1 pins (GPIO 32-39) for analog sensing.
- **TMP36-style temperature sensor**: 500 mV + 10 mV/°C, so 0-80 °C yields 0.5-1.3 V, within range.
- **TEMT6000 or LDR light sensor**: a TEMT6000 module outputs a voltage that rises with light. An LDR needs a 10 kΩ divider: Vout = 3.3 · R / (R + R_LDR).
- **Voltage divider** (for any >3.3 V source): Vout = Vin · R2 / (R1 + R2). Example: 10 kΩ over 6.8 kΩ takes 5 V to about 2.0 V.
- **RC low-pass, 1 kΩ + 100 nF (fc ≈ 1.6 kHz)** per analog pin: anti-aliasing and noise reduction before the sampler.
- **Pull-up (10 kΩ or internal)**: gives the switch input a defined idle level. **Gate pull-down 10 kΩ**: keeps the MOSFET off during boot.
- **Decoupling, 100 nF + 10 µF** across 3V3/GND: absorbs Wi-Fi transmit current bursts that otherwise corrupt ADC readings.
- **N-MOSFET (IRLZ44N logic-level, or 2N7000 for small coils)**: a GPIO cannot supply relay-coil current. 100 Ω gate resistor limits switching current.
- **Flyback diode (1N4007) across the coil, cathode to supply**: absorbs the inductive spike at turn-off that would destroy the MOSFET.
- **LED + 330 Ω**: (3.3 − ~2.0 V) / 330 Ω ≈ 4 mA.

## Bill of materials
| Qty | Part | Value / model |
|---|---|---|
| 1 | ESP32 DevKit V1 | 30 or 38 pin |
| 1 | Temperature sensor | TMP36 |
| 1 | Light sensor | TEMT6000 module (or LDR + 10 kΩ) |
| 1 | Limit switch / push button | normally open |
| 1 | Relay module coil (5 V) or 3.3 V relay | with isolated load side |
| 1 | N-MOSFET | IRLZ44N |
| 1 | Diode | 1N4007 |
| 2 | Resistor | 1 kΩ (RC filters) |
| 2 | Capacitor | 100 nF (RC filters) |
| 1 | Capacitor | 100 nF + 10 µF (decoupling) |
| 1 | Resistor | 100 Ω (gate) |
| 2 | Resistor | 10 kΩ (gate pull-down, switch pull-up) |
| 1 | Resistor | 330 Ω (LED) |
| 1 | LED | any 3 mm/5 mm |
| 1 | Breadboard + jumper wires | |

Mains-voltage loads: use a certified relay module and keep the load side physically isolated. Do not build mains wiring without qualified supervision.
