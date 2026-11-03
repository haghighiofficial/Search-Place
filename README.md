# Search Place 📍

> **Official Google UULE Geotargeting & Localized SERP Generator**  
> Engineered by **[Majid Haghighi](https://www.linkedin.com/in/haghighiofficial/)**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-025f57?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![GitHub](https://img.shields.io/badge/GitHub-haghighiofficial-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/haghighiofficial)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Majid%20Haghighi-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/haghighiofficial/)

**Search Place** is a lightweight, high-performance Chrome Extension designed for SEO specialists, digital marketers, agency strategists, webmasters, and market researchers who need to view and analyze real Google Search results from any city, district, or neighborhood worldwide—without needing a VPN, proxy, or fake GPS location.

---

## ⚡ Overview

Google search engine results vary drastically based on physical geolocation. Local map packs, organic listings, Google Business profiles, and local service ads change from one city to another, and even between neighboring urban districts.

Traditionally, testing localized search results required paid proxies, slow VPNs, or browser developer tools spoofing, which frequently trigger CAPTCHAs and distort true organic rankings.

**Search Place** solves this by leveraging Google's official **UULE (Encoded Location Parameter)** standard. By encoding official Google Geotargeting canonical names, it allows you to simulate searches from any neighborhood, city, or country on Earth with 100% accuracy, directly within Google Search.

---

## ✨ Key Features

### 1. 🎯 Official Google UULE Hashing Engine
- Full implementation of Google's official UULE algorithm (`w+CAIQICI` + length key + Base64 canonical name).
- Generates verified, valid `uule` and `gl` parameters recognized natively by Google Search.
- Early exit and fast string encoding with zero external libraries.

### 2. 🏙️ 3-Level Cascading Hierarchy (Country ➔ City ➔ District)
- **Country Dropdown:** Over 30 major global economic hubs and nations.
- **City Dropdown:** Dynamically updates based on the selected country.
- **District / Region Dropdown:** Narrows down searches to specific urban districts, boroughs, and neighborhoods (e.g., Manhattan, Brooklyn, Downtown Dubai, Shemiranat, Sa'adat Abad, Westminster, Kadikoy, Eixample, Mitte, Shinjuku).
- **Custom District Support:** Allows entering custom local areas or subdivisions.

### 3. 🔍 Hybrid Autocomplete Search (0ms Local + Live Global Geocoding)
- **Instant Local Search (0ms):** Embedded database of 270+ canonical locations supporting bilingual matching in both English and Persian (e.g., typing "ونک", "سعادت آباد", "زعفرانیه", "جلفا", "SoHo", "Kadikoy").
- **Live Global Geocoding:** Connects to open global geocoding services (OpenStreetMap Nominatim) with automatic English translation (`accept-language=en`) to discover any town, neighborhood, or street anywhere on Earth.
- Visual badges differentiate between `[District]`, `[City]`, and `[Global]` results.

### 4. ⭐ 1-Click Favorites & Presets
- Save frequently analyzed locations with a single click.
- Persistent local storage via `chrome.storage.local`.
- 1-click instant switching between saved locations without re-typing.
- Automatic active badge indicator.

### 5. 🌐 Universal Multi-Language Query Support
- Universal UTF-8 query support handling all global writing systems (English, Persian, Arabic, Chinese, Japanese, Russian, Spanish, German, etc.).
- Clean query input field that opens fresh on each session without stale cached keywords.

### 6. 🔒 Privacy-First & Zero-Bloat Architecture
- Zero telemetry, zero analytics tracking, zero third-party tracking scripts.
- Offline typography with bundled **Plus Jakarta Sans** local font files.
- Strictly compliant with Chrome Web Store Manifest V3 guidelines.

---

## 🔬 How Google UULE Works

The `uule` parameter instructs Google Search to render results as if the user is physically present at the specified geographical canonical coordinate.

The canonical string follows Google's official Geotargeting Criteria format:
```text
[Specific Location],[City or State],[Country]
```

### Encoding Formula:
```text
uule = "w+CAIQICI" + LengthCharacter + Base64(CanonicalLocation)
```

1. **Length Character:**  
   The length of the canonical location string is encoded using a 64-character lookup table:
   `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`
   - Index corresponds to string length: index `0 = 'A'`, index `31 = 'f'`, etc.

2. **Base64 Encoding:**  
   The canonical string is UTF-8 encoded and translated to standard Base64.

3. **Prefix:**  
   Prefixed with `w+CAIQICI`, representing Google's internal protocol buffer for canonical location criteria.

### Example:
- **Location:** `New York,New York,United States` (Length: 31 characters)
- **Length Character:** `f` (Index 31 in lookup table)
- **Base64:** `TmV3IFlvcmssTmV3IFlvcmssVW5pdGVkIFN0YXRlcw==`
- **Resulting UULE:**
  ```text
  w+CAIQICIfTmV3IFlvcmssTmV3IFlvcmssVW5pdGVkIFN0YXRlcw==
  ```
- **Generated Google Search URL:**
  ```text
  https://www.google.com/search?q=coffee+shop&uule=w%2BCAIQICIfTmV3IFlvcmssTmV3IFlvcmssVW5pdGVkIFN0YXRlcw%3D%3D&gl=us
  ```

---

## 🚀 Installation

### Option 1: Chrome Web Store (Recommended)
Install directly from the official **Chrome Web Store** *(link coming soon upon store approval)*.

### Option 2: Manual Installation (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/haghighiofficial/search-place.git
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked**.
5. Select the `Search Place` project directory.
6. The extension is now installed! Pin it to your toolbar for quick access.

---

## 🛡️ Permissions & Security

| Permission | Scope | Justification |
| :--- | :--- | :--- |
| `storage` | Local Browser Storage | Saves favorite locations and last-used location preferences locally on the user's device. |
| `host_permissions` | `nominatim.openstreetmap.org`, `photon.komoot.io` | Used exclusively to query live geocoding suggestions when typing in the search bar. |

- **Zero Tracking:** No user data or search queries are stored, logged, or sent to any private server.
- **Strict CSP:** Zero remote scripts, zero `eval()`, zero inline scripts.

---

## 👨‍💻 Author & Creator

**Majid Haghighi**  
- GitHub: [@haghighiofficial](https://github.com/haghighiofficial)
- LinkedIn: [https://www.linkedin.com/in/haghighiofficial/](https://www.linkedin.com/in/haghighiofficial/)
- Email: [m.haghighiofficial@gmail.com](mailto:m.haghighiofficial@gmail.com)

---

## 📄 License

This project is open-source and released under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.

```text
Copyright (c) 2024-2026 Majid Haghighi
```
