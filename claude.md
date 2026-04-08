# GlowDeck — Project Constitution

## Identity
- Product: GlowDeck — Always-On Smart Dashboard
- Tagline: "Display your Tech with GlowDeck"
- Free Tier: GlowDeck | Premium Tier: GlowDeck Pro
- Type: Freemium PWA + Electron Desktop App
- Stack: React 18 + Next.js (static export) + Tailwind CSS + Zustand + react-grid-layout
- Deployment: Vercel (PWA) + Electron (Windows/Mac desktop builds)

## Data Schema

### Core Types
```typescript
type WidgetType =
  | 'clock' | 'date' | 'calendar' | 'weather' | 'countdown' | 'quote'  // FREE
  | 'youtube' | 'music' | 'stocks' | 'iframe' | 'photo-frame' | 'pomodoro';  // PREMIUM

type WidgetTier = 'free' | 'premium';

interface Widget {
  id: string;                    // nanoid
  type: WidgetType;
  title: string;
  tier: WidgetTier;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { w: number; h: number };
  // Merged into react-grid-layout { i, x, y, w, h } at render time
}

interface WidgetRegistryEntry {
  type: WidgetType;
  displayName: string;
  description: string;
  tier: WidgetTier;
  icon: string;
  component: React.LazyExoticComponent;
  defaultConfig: Record<string, unknown>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxIframes?: number;
}

interface Space {
  id: string;
  name: string;               // 'Home' | 'Work' | 'Focus' | custom
  icon: string;
  widgets: Widget[];
  gridConfig: GridConfig;
  isDefault: boolean;
  createdAt: number;
}

interface GridConfig {
  cols: 12;
  rowHeight: number;          // calculated from viewport
  margin: [number, number];
  padding: [number, number];
}

interface UserPreferences {
  activeSpaceId: string;
  theme: { mode: 'dark' | 'oled'; accentColor: string };
  nightMode: { enabled: boolean; autoSchedule: boolean; startTime: string; endTime: string };
  wakeLock: boolean;
  burnInProtection: boolean;
  keyboardShortcuts: boolean;
  onboardingComplete: boolean;
}

interface PremiumStatus {
  tier: 'free' | 'trial' | 'premium';
  trialStartDate: number | null;
  trialEndDate: number | null;       // trialStartDate + TRIAL_DURATION_DAYS (21)
  upgradePromptsShown: number;       // per session, max 1
  lastPromptSessionId: string | null;
}
```

### Constants (src/lib/constants.ts)
- TRIAL_DURATION_DAYS = 21
- POLLING_WEATHER_MS = 900_000 (15 min)
- POLLING_STOCKS_MS = 60_000 (1 min default, configurable 1-5 min)
- POLLING_CALENDAR_MS = 300_000 (5 min)
- MAX_IFRAMES = 8
- BURN_IN_SHIFT_PX = 2
- BURN_IN_INTERVAL_MS = 60_000
- PERSIST_DEBOUNCE_MS = 500

### IndexedDB Stores
- glowdeck-widgets: Widget instances & configs per Space
- glowdeck-layouts: Spaces, grid configs, active space ID
- glowdeck-prefs: Theme, night mode, wake lock, shortcuts
- glowdeck-premium: Trial dates, tier, prompt count

## Behavioral Rules

### DO:
- Always render in landscape orientation as the primary layout (portrait as secondary/responsive)
- Use OLED-friendly pure black (#000000) backgrounds by default
- Implement pixel-shift burn-in protection (subtle 1-2px shift every 60 seconds)
- Implement Screen Wake Lock API to prevent screen sleep (with user opt-in toggle)
- Show a smooth loading skeleton for every widget while data loads
- Lazy-load all iframes with `loading="lazy"`
- Apply `contain: layout style paint` CSS on every widget container for performance isolation
- Use CSS Grid + react-grid-layout for the dashboard grid — widgets must be draggable and resizable (premium feature)
- Provide 3 default "Spaces" (profiles): Home, Work, Focus — each with different widget layouts
- Gate premium features with a contextual soft paywall — show blurred preview + PRO badge when user taps a locked widget
- Include a 21-day reverse trial for new users (full premium access, then graceful downgrade)
- Support keyboard shortcuts for navigation (arrow keys to switch widgets, Esc for settings)
- Stagger API polling: weather every 15 min, stocks every 1-5 min, calendar every 5 min
- Persist all user data locally — zero data leaves the device unless user opts into cloud sync

### DO NOT:
- Do NOT show more than 1 upgrade prompt per session — no nagging
- Do NOT play audio or autoplay video without explicit user action
- Do NOT use `nodeIntegration: true` in Electron — always `contextIsolation: true`
- Do NOT embed iframes from domains not in the CSP whitelist
- Do NOT exceed 8 simultaneous iframes in any single layout
- Do NOT use localStorage (use IndexedDB for persistence — larger storage, async, structured)
- Do NOT hardcode any API keys in client-side code
- Do NOT fetch external data more frequently than the minimum polling intervals above
- Do NOT skip writing/updating architecture SOPs before writing code

### CSP Whitelist (iframe frame-src):
```
frame-src 'self'
  https://www.youtube-nocookie.com
  https://www.youtube.com
  https://open.spotify.com
  https://s.tradingview.com
  https://www.tradingview.com
  https://calendar.google.com
  https://embed.windy.com;
```

## Architectural Invariants
- A.N.T. 3-Layer: Architecture (SOPs in architecture/) -> Navigation (routing logic) -> Tools (atomic scripts in tools/)
- SOPs are updated BEFORE code changes — never after
- Self-Annealing: Analyze stack trace -> Patch -> Test -> Update architecture doc
- No scripts in tools/ until Blueprint is approved
- Widget Plugin Architecture: every widget is a self-contained React component with a standard interface
- Maximum 8 simultaneous iframes in any layout to prevent memory issues
- All iframe sources must be explicitly whitelisted in CSP
