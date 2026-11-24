// ESP32: sensors -> 12-bit ADC -> binary -> hysteresis -> HTTPS POST to Google Apps Script.
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// UPDATE: your Wi-Fi name, password, Web App URL and token before flashing.
const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const char* WEBAPP_URL = "https://script.google.com/macros/s/XXXX/exec";
const char* TOKEN = "change-me";          // must equal SHARED_SECRET in Apps Script
const char* DEVICE = "esp32-lab-01";

// ADC1 pins only: ADC2 is unusable while Wi-Fi is active.
const int PIN_TEMP = 34, PIN_LDR = 35, PIN_SWITCH = 27, PIN_RELAY = 26, PIN_LED = 2;
// UPDATE: tune trip/release temperatures for your application.
const float TRIP_C = 30.0, RELEASE_C = 28.0;       // hysteresis band
const unsigned long COOLDOWN_MS = 10UL * 60UL * 1000UL;

bool alarmOn = false, everSent = false;
unsigned long lastEmail = 0;

String bits12(uint16_t v) { String s; for (int i = 11; i >= 0; i--) s += ((v >> i) & 1) ? '1' : '0'; return s; }

// 16-sample average reduces noise; the RC filter on the pin handles aliasing.
uint16_t readAdc(int pin) { uint32_t a = 0; for (int i = 0; i < 16; i++) { a += analogRead(pin); delayMicroseconds(200); } return a / 16; }

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(500);
}

bool postAlert(float tempC, uint16_t tAdc, uint16_t lAdc, bool sw) {
  connectWifi();
  if (WiFi.status() != WL_CONNECTED) return false;
  WiFiClientSecure client;
  client.setInsecure();   // For production, pin Google's root CA with client.setCACert().
  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);  // Apps Script answers via redirect
  if (!http.begin(client, WEBAPP_URL)) return false;
  http.addHeader("Content-Type", "text/plain");
  String body = String("{\"device\":\"") + DEVICE + "\",\"token\":\"" + TOKEN + "\",\"temp_c\":" + String(tempC, 2) +
    ",\"temp_adc\":" + tAdc + ",\"temp_bin\":\"" + bits12(tAdc) + "\",\"light_adc\":" + lAdc +
    ",\"light_bin\":\"" + bits12(lAdc) + "\",\"switch\":" + (sw ? 1 : 0) + ",\"alarm\":true}";
  int code = http.POST(body);
  Serial.printf("POST -> %d\n", code);
  http.end();
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);                       // codes 0..4095
  analogSetPinAttenuation(PIN_TEMP, ADC_11db);
  analogSetPinAttenuation(PIN_LDR, ADC_11db);
  pinMode(PIN_SWITCH, INPUT_PULLUP);              // pressed = LOW
  pinMode(PIN_RELAY, OUTPUT); pinMode(PIN_LED, OUTPUT);
  connectWifi();
}

void loop() {
  uint16_t tAdc = readAdc(PIN_TEMP), lAdc = readAdc(PIN_LDR);
  float tempC = (tAdc * 3.3f / 4095.0f - 0.5f) / 0.01f;   // TMP36-style: 500 mV offset, 10 mV/degC
  bool sw = digitalRead(PIN_SWITCH) == LOW;

  bool next = alarmOn ? (tempC > RELEASE_C) : (tempC >= TRIP_C);
  if (next != alarmOn) {
    alarmOn = next;
    digitalWrite(PIN_RELAY, alarmOn); digitalWrite(PIN_LED, alarmOn);
    if (alarmOn && (!everSent || millis() - lastEmail >= COOLDOWN_MS)) {
      if (postAlert(tempC, tAdc, lAdc, sw)) { lastEmail = millis(); everSent = true; }
    }
  }
  Serial.printf("{\"temp_c\":%.2f,\"temp_adc\":%u,\"temp_bin\":\"%s\",\"light_adc\":%u,\"light_bin\":\"%s\",\"switch\":%d,\"alarm\":%d}\n",
                tempC, tAdc, bits12(tAdc).c_str(), lAdc, bits12(lAdc).c_str(), sw, alarmOn);
  delay(1000);
}
