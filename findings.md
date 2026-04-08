# GlowDeck — Findings

## Market Research
- Apple StandBy (iOS 17+): dual widget stacks, 5 clock faces, photo slideshow, night mode red tint, landscape-only
- StandBy Mode Pro (Android, 1.6M+ downloads): 100+ clocks, quad widget layout, YouTube backgrounds, Lo-fi radio, Pomodoro
- AOA Always On Display: notification reply from AOD, $6 lifetime
- Common UX patterns: landscape-first, dark/OLED backgrounds, pixel-shift burn-in protection, swipe navigation between modes, auto-launch on charge

## Freemium Benchmarks
- Median conversion rate: 2-5%, great apps: 6-8%
- Best pattern: 7-day reverse trial (full access -> graceful downgrade)
- Anti-pattern: aggressive upgrade prompts (only 8% respond positively)
- Price ceiling for category: $2.99-4.99/month, $24.99-39.99/year, $59.99-79.99 lifetime

## Technical Constraints
- YouTube: use youtube-nocookie.com for privacy, react-player for unified API
- Stocks: TradingView embeddable widgets (free with branding, zero backend needed)
- Weather: Open-Meteo (free, no API key, CORS-friendly)
- Calendar: Google Calendar iframe embed or @fullcalendar/react with GCal plugin
- Music: AmplitudeJS (open-source) for local, Spotify iframe for streaming
- Screen Wake Lock API: navigator.wakeLock.request('screen') — Chrome 84+, Safari 16.4+
- Electron: powerSaveBlocker.start('prevent-display-sleep') for desktop always-on
- Security: sandbox iframes, CSP frame-src whitelist, nodeIntegration: false in Electron

## Architecture Decisions (Blueprint Phase)
- Widget system: Static Registry pattern chosen over convention-based auto-discovery and plugin/manifest architecture. 12 known widgets with clear free/premium split — static map is the right abstraction level. Migration path to plugin system exists if marketplace becomes real.
- State: 4 Zustand store slices (widgets, layouts, preferences, premium) each backed by a dedicated IndexedDB store. Persistence debounced at 500ms to avoid thrashing during drag/resize.
- Navigation: Single Next.js route (/). Settings and onboarding are modal/drawer UI states, not routes.
- Google Calendar: Public iframe embed only for MVP. OAuth for private calendars is explicitly out of scope (post-MVP stretch goal).
- Trial duration: 21-day reverse trial (user requested, up from industry-standard 7 days). Longer trial increases conversion likelihood for a "set it and forget it" app category.

## Key NPM Packages
- react-grid-layout: draggable/resizable grid
- zustand: lightweight state management
- idb-keyval: simple IndexedDB wrapper for persistence middleware
- nanoid: widget instance ID generation
- react-player: unified video player (YouTube, etc.)
- amplitude-js: local audio playback (AmplitudeJS)
- electron-builder: desktop builds
- electron-updater: auto-update from GitHub Releases
