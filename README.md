# GlowDeck

**Display your Tech with GlowDeck**

GlowDeck is an always-on smart dashboard designed for dedicated displays, standby screens, and wall-mounted monitors. It runs as a Progressive Web App (PWA) on any browser or as a native Electron desktop app on Windows and macOS.

## Features

### Free Tier (GlowDeck)
- Clock (5 styles: minimal digital, bold digital, analog, word clock, binary)
- Date display
- Calendar (built-in month view or Google Calendar embed)
- Weather (current conditions + forecast via Open-Meteo)
- Countdown timer
- Alarm Clock
- Inspirational Quotes
- Network Traffic monitor

### Premium Tier (GlowDeck Pro)
- YouTube video embed
- Spotify music player
- TradingView stock/crypto charts
- Pomodoro focus timer
- Photo Frame slideshow
- CPU Usage monitor
- Memory Usage monitor

### Dashboard Features
- Drag-and-drop widget grid (react-grid-layout)
- 3 default Spaces: Home, Work, Focus
- Create custom Spaces
- OLED-friendly pure black theme
- Night mode with auto-schedule
- Burn-in protection (pixel shifting)
- Screen Wake Lock (keeps display on)
- Keyboard shortcuts
- 21-day reverse trial (full premium access, then graceful downgrade)

## Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Production build
npm run build

# Start production server
npm start
```

### Electron (Desktop App)

```bash
# Install electron dependencies (if not already installed)
npm install

# Development build
npm run electron:dev

# Production build (Windows)
npm run electron:build:win

# Production build (macOS)
npm run electron:build:mac
```

## Tech Stack

- **Framework:** Next.js 16 (static export)
- **UI:** React 19 + Tailwind CSS 4
- **State:** Zustand with IndexedDB persistence
- **Grid:** react-grid-layout
- **Desktop:** Electron with electron-builder
- **Testing:** Vitest + Testing Library
- **APIs:** Open-Meteo (weather), TradingView (stocks), YouTube/Spotify (embeds)

## Project Structure

```
src/
  app/                    # Next.js app router pages
  components/
    dashboard/            # Dashboard shell (grid, providers, space switcher)
    widgets/              # 15 widget components
    ui/                   # Premium gate, upgrade prompt, settings, onboarding
  hooks/                  # Wake lock, night mode, burn-in protection, etc.
  lib/                    # Constants, CSP, IDB storage, widget registry
  stores/                 # Zustand stores (layout, preferences, premium)
  types/                  # TypeScript type definitions
  test/                   # Test setup
electron/
  main.ts                 # Electron main process
  preload.ts              # contextBridge preload script
  electron-builder.config.js
architecture/             # Architecture SOPs
public/
  icons/                  # PWA icons
  manifest.json           # PWA manifest
  sw.js                   # Service worker
```

## License

MIT
