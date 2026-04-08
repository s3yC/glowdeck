# GlowDeck — Integrations SOP

## Overview

All MVP integrations are keyless — either open REST APIs or iframe embeds. No backend proxy needed. Payment integration (Stripe) and private calendar access (Google OAuth) are post-MVP.

---

## 1. Open-Meteo (Weather)

| Field | Value |
|-------|-------|
| **Type** | REST API |
| **URL Pattern** | `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min&timezone=auto` |
| **Auth** | None — fully open, no API key |
| **Rate Limits** | Fair use: ~10,000 requests/day (no hard limit published) |
| **Polling Interval** | Every 15 minutes (`POLLING_WEATHER_MS = 900_000`) |
| **Response** | JSON with `current_weather`, `hourly`, `daily` objects |
| **Fallback** | Show last cached data with "Last updated X min ago" badge. If no cache, show "Weather unavailable" with retry button. |
| **CSP Entry** | N/A — API call via `fetch()`, not iframe |
| **Notes** | CORS-friendly. Geocoding: use `https://geocoding-api.open-meteo.com/v1/search?name={city}` for city lookup in widget settings. |

---

## 2. TradingView (Stocks/Crypto)

| Field | Value |
|-------|-------|
| **Type** | Iframe embed (widget library) |
| **URL Pattern** | `https://s.tradingview.com/widgetembed/?symbol={SYMBOL}&locale=en` (widget embed) or script-based widgets via `https://s.tradingview.com/external-embedding/` |
| **Auth** | None — free tier includes TradingView branding |
| **Rate Limits** | None (client-side widget, data fetched by TradingView) |
| **Polling Interval** | Real-time via TradingView's own socket connection. Widget config `pollInterval` (1-5 min) controls our re-render, not data fetch. |
| **Fallback** | Show "Stocks unavailable" placeholder if iframe fails to load. 10-second load timeout. |
| **CSP Entry** | `https://s.tradingview.com`, `https://www.tradingview.com` |
| **Iframe Sandbox** | `allow-scripts allow-same-origin allow-popups` |
| **Notes** | Free tier shows TradingView logo. Multiple widget types available: mini-symbol-overview, advanced-chart, ticker-tape. |

---

## 3. YouTube (Video)

| Field | Value |
|-------|-------|
| **Type** | Iframe embed (nocookie domain for privacy) |
| **URL Pattern** | `https://www.youtube-nocookie.com/embed/{videoId}?autoplay=0&rel=0&modestbranding=1` |
| **Auth** | None |
| **Rate Limits** | None (embed is client-side) |
| **Polling Interval** | N/A — video is user-triggered |
| **Fallback** | Show video thumbnail as static image if embed fails. "Video unavailable" message on error. |
| **CSP Entry** | `https://www.youtube-nocookie.com`, `https://www.youtube.com` |
| **Iframe Sandbox** | `allow-scripts allow-same-origin allow-popups allow-presentation` |
| **Notes** | Use `react-player` for unified API (supports YouTube, Vimeo, etc.). `autoplay=0` enforced — no autoplay without user action per behavioral rules. |

---

## 4. Spotify (Music)

| Field | Value |
|-------|-------|
| **Type** | Iframe embed |
| **URL Pattern** | `https://open.spotify.com/embed/track/{trackId}?theme=0` (`theme=0` = dark mode) |
| **Auth** | None for embed player |
| **Rate Limits** | None (embed is client-side) |
| **Polling Interval** | N/A — user-controlled playback |
| **Fallback** | Show "Connect Spotify" placeholder with link to open Spotify. |
| **CSP Entry** | `https://open.spotify.com` |
| **Iframe Sandbox** | `allow-scripts allow-same-origin allow-popups` |
| **Notes** | Embed supports tracks, albums, playlists, and podcasts. User pastes Spotify URL, we extract the embed path. Also supports `?utm_source=generator` for playlist embeds. |

---

## 5. Google Calendar (Calendar)

| Field | Value |
|-------|-------|
| **Type** | Iframe embed (public calendars only for MVP) |
| **URL Pattern** | `https://calendar.google.com/calendar/embed?src={calendarId}&ctz={timezone}&mode=AGENDA&showTitle=0&showNav=0&showPrint=0&showTabs=0&showCalendars=0&bgcolor=%23000000` |
| **Auth** | None for public calendars. OAuth required for private calendars (post-MVP). |
| **Rate Limits** | None (embed is client-side) |
| **Polling Interval** | Every 5 minutes (`POLLING_CALENDAR_MS = 300_000`) — achieved by reloading the iframe src |
| **Fallback** | Show built-in month view calendar (no Google data) as fallback. "Calendar unavailable" if iframe fails. |
| **CSP Entry** | `https://calendar.google.com` |
| **Iframe Sandbox** | `allow-scripts allow-same-origin allow-popups` |
| **Notes** | For MVP, user provides their public calendar embed URL. Post-MVP: Google OAuth → fetch events via Calendar API → render in custom @fullcalendar/react component. |

---

## 6. Windy (Weather Map — Future Widget)

| Field | Value |
|-------|-------|
| **Type** | Iframe embed |
| **URL Pattern** | `https://embed.windy.com/embed2.html?lat={lat}&lon={lon}&zoom=5&level=surface&overlay=wind` |
| **Auth** | None |
| **CSP Entry** | `https://embed.windy.com` |
| **Notes** | Reserved in CSP whitelist for future weather map widget. Not in MVP widget set. |

---

## Security Rules

1. **All iframes** must include `loading="lazy"` attribute
2. **All iframe-based widgets** must use sandbox attribute: `allow-scripts allow-same-origin` (add `allow-popups` and `allow-presentation` only where needed)
3. **Maximum 8 iframes** simultaneously rendered in any layout
4. **CSP frame-src** must include only whitelisted domains (see claude.md)
5. **No iframe** may include `allow-top-navigation` in sandbox
6. **Widget containers** must use `contain: layout style paint` for performance isolation

## Iframe Count Enforcement

The `DashboardGrid` component must track active iframe count across all rendered widgets. If adding a new iframe-based widget would exceed 8, show a warning: "Maximum active widgets reached. Remove an existing widget to add this one."

## Error Handling Pattern

All integrations follow the same pattern:
1. **Loading** — show skeleton/shimmer animation
2. **Success** — render widget content
3. **Error** — show contextual error message + retry button
4. **Timeout** — 10-second load timeout for iframes, 5-second for API calls
5. **Offline** — show last cached data (if available) with staleness indicator
