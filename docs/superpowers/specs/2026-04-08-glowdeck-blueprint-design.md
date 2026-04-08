# GlowDeck — Blueprint Design Spec

**Date:** 2026-04-08
**Status:** Approved
**Product:** GlowDeck — Always-On Smart Dashboard
**Tagline:** "Display your Tech with GlowDeck"

---

## 1. North Star

Build a production-quality, freemium StandBy-style always-on dashboard app that runs as both a PWA (any browser) and an Electron desktop app (Windows/Mac). Free users get a beautiful, functional clock/calendar/weather dashboard. Premium users unlock custom iframe widgets (YouTube, stocks, music, any website), unlimited layouts, and full theme customization. The app must feel premium even on the free tier.

## 2. Tech Stack

- **Framework:** React 18 + Next.js (static export via `next export`)
- **Styling:** Tailwind CSS + CSS custom properties for runtime theming
- **State:** Zustand with IndexedDB persistence middleware (idb-keyval)
- **Layout:** react-grid-layout (12-column grid)
- **Desktop:** Electron with electron-builder (Windows NSIS + Mac DMG)
- **Deployment:** Vercel (PWA) + GitHub Releases (Electron)

## 3. Architecture Decision: Static Widget Registry

All 12 widget types defined in a single `widgetRegistry.ts` map. Each entry points to a lazy-loaded React component via `React.lazy()`. Adding a widget = adding one registry entry + one component file.

**Why this over alternatives:**
- Convention-based auto-discovery: over-engineered for 12 widgets, bundler-specific magic
- Plugin/manifest architecture: YAGNI — marketplace not on roadmap
- Static registry: transparent, type-safe, tree-shakeable, trivially testable. Migration to plugin system later is straightforward if needed.

## 4. Data Schema

### Widget

```typescript
type WidgetType =
  | 'clock' | 'date' | 'calendar' | 'weather'
  | 'countdown' | 'quote'              // FREE
  | 'youtube' | 'music' | 'stocks'
  | 'iframe' | 'photo-frame'
  | 'pomodoro';                         // PREMIUM

type WidgetTier = 'free' | 'premium';

interface Widget {
  id:        string;          // nanoid
  type:      WidgetType;
  title:     string;
  tier:      WidgetTier;
  config:    Record<string, unknown>;
  position:  { x: number; y: number };
  size:      { w: number; h: number };
  // position + size are stored separately and merged into
  // react-grid-layout's { i, x, y, w, h } format at render time
}
```

### Widget Registry Entry

```typescript
interface WidgetRegistryEntry {
  type:          WidgetType;
  displayName:   string;
  description:   string;
  tier:          WidgetTier;
  icon:          string;
  component:     React.LazyExoticComponent;
  defaultConfig: Record<string, unknown>;
  defaultSize:   { w: number; h: number };
  minSize:       { w: number; h: number };
  maxIframes?:   number;
}
```

### Space / Layout

```typescript
interface Space {
  id:          string;
  name:        string;        // 'Home' | 'Work' | 'Focus' | custom
  icon:        string;
  widgets:     Widget[];
  gridConfig:  GridConfig;
  isDefault:   boolean;
  createdAt:   number;        // timestamp
}

interface GridConfig {
  cols:        12;            // fixed 12-column grid
  rowHeight:   number;        // calculated from viewport
  margin:      [number, number];
  padding:     [number, number];
}
```

### User Preferences

```typescript
interface UserPreferences {
  activeSpaceId:      string;
  theme: {
    mode:             'dark' | 'oled';
    accentColor:      string;
  };
  nightMode: {
    enabled:          boolean;
    autoSchedule:     boolean;
    startTime:        string;    // "22:00"
    endTime:          string;    // "07:00"
  };
  wakeLock:           boolean;
  burnInProtection:   boolean;
  keyboardShortcuts:  boolean;
  onboardingComplete: boolean;
}
```

### Premium Status

```typescript
interface PremiumStatus {
  tier:                'free' | 'trial' | 'premium';
  trialStartDate:     number | null;
  trialEndDate:       number | null;
  upgradePromptsShown: number;
  lastPromptSessionId: string | null;
}
```

### Widget Config Examples

| Widget | Default Config |
|--------|---------------|
| Clock | `{ style: 'minimal-digital', format: '12h', showSeconds: true }` |
| Weather | `{ latitude: 40.7128, longitude: -74.0060, units: 'fahrenheit', pollInterval: 900000 }` |
| YouTube | `{ videoUrl: '', autoplay: false, loop: false }` |
| Stocks | `{ symbols: ['AAPL', 'GOOGL'], chartType: 'mini', pollInterval: 60000 }` |

## 5. Default Spaces

### Home (relaxed ambient display)
| Widget | Grid Position | Size | Tier |
|--------|--------------|------|------|
| Clock | col 1-6, row 1-4 | 6x4 | Free |
| Weather | col 7-12, row 1-2 | 6x2 | Free |
| Calendar | col 7-12, row 3-4 | 6x2 | Free |
| YouTube | col 1-6, row 5-6 | 6x2 | Premium |
| Music | col 7-12, row 5-6 | 6x2 | Premium |

### Work (productivity cockpit)
| Widget | Grid Position | Size | Tier |
|--------|--------------|------|------|
| Clock | col 1-4, row 1-2 | 4x2 | Free |
| Weather | col 5-8, row 1-2 | 4x2 | Free |
| Calendar | col 9-12, row 1-4 | 4x4 | Free |
| Stocks | col 1-8, row 3-4 | 8x2 | Premium |
| Pomodoro | col 1-4, row 5-6 | 4x2 | Premium |
| Iframe | col 5-12, row 5-6 | 8x2 | Premium |

### Focus (minimal distraction-free)
| Widget | Grid Position | Size | Tier |
|--------|--------------|------|------|
| Clock | col 1-8, row 1-4 | 8x4 | Free |
| Quote | col 9-12, row 1-4 | 4x4 | Free |
| Pomodoro | col 1-6, row 5-6 | 6x2 | Premium |
| Music | col 7-12, row 5-6 | 6x2 | Premium |

**Layout principle:** Free widgets fill the top 2/3 (usable immediately). Premium widgets in the bottom 1/3 (blurred soft-upsell with PRO badge). During the 21-day trial all widgets unlock. Premium users can rearrange everything via drag/resize.

## 6. Freemium Gating

### Feature Tier Matrix

**Free:**
- Clock (5 styles), Date, Calendar, Weather, Countdown, Quote widgets
- 3 default Spaces (Home, Work, Focus)
- OLED dark mode, night mode (red tint), wake lock, burn-in protection

**Premium (PRO):**
- YouTube, Music, Stocks, Custom Iframe, Photo Frame, Pomodoro widgets
- Drag & resize widgets
- Custom Spaces (create/delete)
- Custom accent colors
- Unlimited layouts per Space

### 21-Day Reverse Trial

| Day | Experience |
|-----|-----------|
| 0 | Install & onboard. Full PRO unlocked. No payment asked. |
| 1-20 | Full premium experience. Subtle "X days left" banner. No upgrade prompts. |
| 21 | Trial ends. One "Keep Premium?" prompt. Graceful downgrade. |
| 22+ | Free tier. PRO widgets blur. Dashboard fully usable. Max 1 prompt/session. |

### Soft Paywall Behavior

When a free user taps a locked widget:
- Blurred preview of actual widget content
- PRO badge overlay
- Contextual benefit text (e.g., "Track your portfolio in real-time")
- One-tap "Start Free Trial" or "Upgrade" button

**Rules:**
- Max 1 upgrade prompt per session
- Never interrupt active dashboard use
- Never auto-dismiss or time-gate the prompt
- Never hide free functionality behind prompts

### Premium Check Utility

```typescript
function canAccessFeature(tier: WidgetTier): boolean {
  const status = usePremiumStore.getState();
  if (tier === 'free') return true;
  return status.tier === 'premium' || status.tier === 'trial';
}
```

## 7. State Management

### Zustand Store Slices

| Store | Responsibility | Key Actions |
|-------|---------------|-------------|
| widgetStore | Widget instances per Space | addWidget, removeWidget, updateWidgetConfig, updateWidgetPosition, updateWidgetSize |
| layoutStore | Spaces & grid configs | setActiveSpace, createSpace, deleteSpace, updateGridConfig |
| preferenceStore | Theme, night mode, wake lock | setTheme, setNightMode, toggleWakeLock |
| premiumStore | Trial & premium status | startTrial, checkTrialExpiry, canShowUpgradePrompt, recordUpgradePrompt |

### IndexedDB Stores

| Store Name | Contents |
|-----------|----------|
| glowdeck-widgets | Widget instances & configs per Space |
| glowdeck-layouts | Spaces, grid configs, active space ID |
| glowdeck-prefs | Theme, night mode, wake lock, shortcuts |
| glowdeck-premium | Trial dates, tier, prompt count |

### Hydration & Persistence

1. **App launch** — show skeleton UI
2. **Hydrate** — read IndexedDB into Zustand stores
3. **Render** — dashboard ready, widgets mount
4. **User action** — move widget, change setting
5. **Persist** — Zustand middleware writes to IndexedDB (debounced 500ms)

## 8. Component Tree

```
App (layout.tsx — providers, theme, wake lock)
├── BurnInProtection (1-2px shift wrapper, every 60s)
│   ├── SpaceSwitcher (top bar — Home | Work | Focus tabs)
│   └── DashboardGrid (react-grid-layout)
│       └── WidgetContainer (per widget — error boundary + skeleton + premium gate)
│           ├── ClockWidget | WeatherWidget | CalendarWidget | ...
│           └── PremiumGate (blur overlay if locked)
├── SettingsPanel (slide-over drawer from right)
│   ├── ThemeSettings
│   ├── SpaceManager
│   └── WidgetPicker (add widget modal)
├── UpgradePrompt (modal — max 1/session)
├── TrialBanner (top — "X days left")
└── OnboardingWizard (first-run only: Choose vibe → Pick widgets → Start trial)
```

## 9. Widget Lifecycle

Every widget follows: Mount → Show Skeleton → Fetch Data → Render → Poll (interval) → Unmount (cleanup).

Error at any step is caught by per-widget ErrorBoundary — shows retry button, other widgets unaffected.

**Polling intervals:**
- Clock: 1 second
- Weather: 15 minutes
- Stocks: 1-5 minutes (configurable)
- Calendar: 5 minutes

## 10. Integrations

| Service | Method | Auth | Rate Limit | CSP Entry |
|---------|--------|------|-----------|-----------|
| Open-Meteo | REST API | None | Fair use | N/A (API, not iframe) |
| TradingView | Iframe embed | None (free w/ branding) | None | `s.tradingview.com`, `www.tradingview.com` |
| YouTube | Iframe (nocookie) | None | None | `www.youtube-nocookie.com`, `www.youtube.com` |
| Spotify | Iframe embed | None | None | `open.spotify.com` |
| Google Calendar | Iframe embed | None (public calendars only for MVP; OAuth for private calendars is a post-MVP stretch goal) | None | `calendar.google.com` |
| Windy | Iframe embed | None | None | `embed.windy.com` |

## 11. Electron Desktop

- **Main process:** BrowserWindow (kiosk option), powerSaveBlocker, auto-updater, tray icon
- **Preload:** contextBridge for safe IPC (switch Space, toggle night mode, quit)
- **Security:** nodeIntegration: false, contextIsolation: true, webSecurity: true
- **Build:** electron-builder → Windows NSIS .exe + Mac .dmg
- **Updates:** GitHub Releases via electron-updater

## 12. Behavioral Rules

See `claude.md` for the complete DO/DO NOT list. Key invariants:
- Landscape-first, OLED black (#000000) default
- Pixel-shift burn-in protection (1-2px every 60s)
- Screen Wake Lock API with user opt-in
- `contain: layout style paint` on every widget container
- Lazy-load all iframes with `loading="lazy"`
- Max 8 simultaneous iframes per layout
- All iframe sources CSP-whitelisted
- Zero data leaves device unless user opts in
- No localStorage — IndexedDB only

## 13. File Structure

```
glowdeck/
├── architecture/              # SOPs (markdown)
├── tools/                     # Standalone utility scripts
│   ├── verify-integrations.mjs
│   ├── generate-widget-registry.mjs
│   └── build-electron.mjs
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/         # DashboardGrid, WidgetContainer, SpaceSwitcher, BurnInProtection
│   │   ├── widgets/           # 12 widget components
│   │   ├── settings/          # SettingsPanel, WidgetPicker, ThemeSettings, SpaceManager
│   │   ├── premium/           # PremiumGate, UpgradePrompt, TrialBanner
│   │   └── onboarding/        # OnboardingWizard
│   ├── hooks/                 # useWakeLock, useNightMode, useBurnInProtection, usePremiumStatus
│   ├── stores/                # widgetStore, layoutStore, preferenceStore, premiumStore
│   ├── lib/                   # widgetRegistry, idb, csp, constants
│   └── types/                 # widget, layout, preferences
├── electron/                  # main.ts, preload.ts, electron-builder.config.js
├── public/                    # manifest.json, sw.js, icons/
├── docs/superpowers/specs/    # This spec
├── claude.md
├── task_plan.md
├── findings.md
└── progress.md
```

## 14. Navigation

- `/` — Main dashboard view (loads active Space) — the only actual Next.js route
- Settings — slide-over drawer component (UI state, not a route — no `app/settings/page.tsx`)
- Onboarding — modal overlay component (UI state, not a route — no `app/onboarding/page.tsx`)
- Single-screen app: all navigation is component state (open/close panels), not URL routing
