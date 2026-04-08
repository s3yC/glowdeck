# GlowDeck Phase 3: Architect — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete GlowDeck application — 6 SOPs, project scaffold, 12 widgets, state management, premium gating, settings, and onboarding — following A.N.T. architecture (SOPs before code).

**Architecture:** Static Widget Registry with lazy-loaded React components. 4 Zustand stores persisted to IndexedDB. Single Next.js route with modal/drawer overlays. 12-column react-grid-layout grid with 3 default Spaces. Freemium gating via soft paywall with 21-day reverse trial.

**Tech Stack:** React 18, Next.js (static export), Tailwind CSS, Zustand, idb-keyval, react-grid-layout, nanoid, react-player, Electron + electron-builder

**Spec:** `docs/superpowers/specs/2026-04-08-glowdeck-blueprint-design.md`
**Constitution:** `claude.md`
**Integrations SOP:** `architecture/integrations.md`

---

## Task Groups & Dependencies

```
Group A: SOPs (sequential, MUST complete before code)
    ↓
Group B: Foundation (scaffold, types, lib, stores, hooks)
    ↓
Group C: Dashboard Core (grid, containers, space switcher)
    ↓
Group D: Widgets (6 free + 6 premium — parallelizable)
    ↓
Group E: UI Shell (settings, premium UI, onboarding, electron)
```

Groups D widgets are parallelizable — dispatch one subagent per widget or batch of 2-3.

---

## Group A: Architecture SOPs

### Task 1: Write Widget System SOP

**Files:**
- Create: `architecture/widget-system.md`

- [ ] **Step 1: Write the SOP**

Document the Widget Plugin Architecture:
- Standard widget interface: `{ id, type, title, tier, component, defaultConfig, defaultSize, minSize }`
- Widget Registry pattern: single `widgetRegistry.ts` map, `React.lazy()` per component
- Widget lifecycle: Mount → Show Skeleton → Fetch Data → Render → Poll (interval) → Unmount (cleanup)
- Error boundary per widget: catches crashes, shows retry button, other widgets unaffected
- Iframe widget sandboxing rules: `allow-scripts allow-same-origin`, add `allow-popups`/`allow-presentation` where needed
- Loading states: shimmer skeleton matching widget dimensions
- Widget config interface: each widget type defines its own config shape via TypeScript discriminated union

- [ ] **Step 2: Verify completeness**

Check that SOP covers: interface definition, registry pattern, lifecycle, error handling, iframe rules, config patterns. Cross-reference with spec Section 3 and Section 9.

- [ ] **Step 3: Commit**

```bash
git add architecture/widget-system.md
git commit -m "docs: add widget system architecture SOP"
```

---

### Task 2: Write Layout Engine SOP

**Files:**
- Create: `architecture/layout-engine.md`

- [ ] **Step 1: Write the SOP**

Document the Grid & Spaces system:
- react-grid-layout config: `cols: 12`, `rowHeight: Math.floor((viewportHeight - headerHeight) / 6)`, `margin: [8, 8]`, `padding: [8, 8]`
- Responsive breakpoints: desktop (1200+), tablet (768-1199), phone (480-767)
- Space/Profile system: 3 defaults (Home, Work, Focus), each with pre-configured widget arrays per spec Section 5
- Widget position/size stored as `{ x, y }` + `{ w, h }`, merged to react-grid-layout `{ i, x, y, w, h }` at render
- Drag-and-drop: premium only. Free users see fixed grid with `static: true` on layout items
- Pixel-shift burn-in protection: CSS transform `translate(Xpx, Ypx)` on outer wrapper, shift 1-2px random direction every 60s
- Space switching: horizontal tab bar at top, persist `activeSpaceId` to preferenceStore

- [ ] **Step 2: Commit**

```bash
git add architecture/layout-engine.md
git commit -m "docs: add layout engine architecture SOP"
```

---

### Task 3: Write Freemium Gate SOP

**Files:**
- Create: `architecture/freemium-gate.md`

- [ ] **Step 1: Write the SOP**

Document the Monetization system:
- Feature tier matrix (copy from spec Section 6 — free vs premium for every feature)
- 21-day reverse trial flow:
  - Day 0: `startTrial()` → set `tier: 'trial'`, `trialStartDate: Date.now()`, `trialEndDate: Date.now() + 21 * 86400000`
  - Days 1-20: `checkTrialExpiry()` on app launch, show TrialBanner "X days left"
  - Day 21: `checkTrialExpiry()` returns expired → set `tier: 'free'`, show one UpgradePrompt
  - Day 22+: premium widgets show PremiumGate (blur + PRO badge)
- `canAccessFeature(tier: WidgetTier): boolean` — check `premiumStore.tier`
- `canShowUpgradePrompt(): boolean` — returns true only if `upgradePromptsShown === 0` AND `sessionId !== lastPromptSessionId`
- Soft paywall component spec: blurred backdrop-filter, PRO gradient badge, contextual description, CTA button
- Rule: max 1 upgrade prompt per session, never interrupt active use

- [ ] **Step 2: Commit**

```bash
git add architecture/freemium-gate.md
git commit -m "docs: add freemium gate architecture SOP"
```

---

### Task 4: Write Theming SOP

**Files:**
- Create: `architecture/theming.md`

- [ ] **Step 1: Write the SOP**

Document the Theme & Night Mode system:
- Design tokens as CSS custom properties on `:root`:
  - `--bg-primary: #000000` (OLED), `--bg-secondary: #111111`, `--bg-tertiary: #1a1a1a`
  - `--text-primary: #ffffff`, `--text-secondary: #888888`, `--text-muted: #555555`
  - `--accent: var(--user-accent, #667eea)` (default accent, user-configurable in premium)
  - `--accent-gradient: linear-gradient(135deg, #667eea, #764ba2)` (PRO badge gradient)
  - `--border: #222222`, `--border-active: #333333`
- Typography: system font stack `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Night mode: CSS filter `sepia(100%) hue-rotate(-30deg) saturate(200%) brightness(0.6)` applied to `<main>`, 500ms transition
- Night mode auto-schedule: compare current time to `startTime`/`endTime` in preferenceStore, check every 60s
- Theme persistence: preferenceStore → IndexedDB
- Two modes: `dark` (dark gray bg) and `oled` (pure #000 bg) — both use same token structure, differ in bg values

- [ ] **Step 2: Commit**

```bash
git add architecture/theming.md
git commit -m "docs: add theming architecture SOP"
```

---

### Task 5: Write State Management SOP

**Files:**
- Create: `architecture/state-management.md`

- [ ] **Step 1: Write the SOP**

Document the Zustand Store system:
- 4 store slices: widgetStore, layoutStore, preferenceStore, premiumStore
- Each store uses `persist` middleware from zustand with custom `idb-keyval` storage adapter
- Storage adapter pattern:

```typescript
import { get, set, del } from 'idb-keyval';
const idbStorage = (storeName: string) => ({
  getItem: async (name: string) => (await get(`${storeName}-${name}`)) ?? null,
  setItem: async (name: string, value: string) => set(`${storeName}-${name}`, value),
  removeItem: async (name: string) => del(`${storeName}-${name}`),
});
```

- Debounced persistence: wrap `setItem` with 500ms debounce to avoid thrashing during drag/resize
- Hydration strategy: stores start with defaults, `onRehydrateStorage` callback hides loading skeleton
- Session ID: generated with `nanoid()` on app start, stored in premiumStore for upgrade prompt tracking
- Store slice interfaces match spec Section 7 exactly

- [ ] **Step 2: Commit**

```bash
git add architecture/state-management.md
git commit -m "docs: add state management architecture SOP"
```

---

### Task 6: Write Electron Shell SOP

**Files:**
- Create: `architecture/electron-shell.md`

- [ ] **Step 1: Write the SOP**

Document the Desktop Wrapper:
- Main process (`electron/main.ts`):
  - `BrowserWindow` with `width: 1920, height: 1080`, kiosk mode optional via CLI flag
  - `powerSaveBlocker.start('prevent-display-sleep')` — called on window ready
  - Auto-updater: `electron-updater` checking GitHub Releases on app launch
  - Tray icon: menu items — Switch Space (Home/Work/Focus), Toggle Night Mode, Settings, Quit
- Preload script (`electron/preload.ts`):
  - `contextBridge.exposeInMainWorld('glowdeck', { ... })` for safe IPC
  - Exposed methods: `switchSpace(id)`, `toggleNightMode()`, `getAppVersion()`, `onTrayAction(callback)`
- Security: `nodeIntegration: false`, `contextIsolation: true`, `webSecurity: true`, `sandbox: true`
- Build config (`electron/electron-builder.config.js`):
  - Windows: NSIS installer, `artifactName: 'GlowDeck-Setup-${version}.exe'`
  - Mac: DMG, `artifactName: 'GlowDeck-${version}.dmg'`
  - `publish: { provider: 'github' }` for auto-updates
- NOTE: Electron build is Phase 5 (Trigger). This SOP defines the architecture; implementation is deferred.

- [ ] **Step 2: Commit**

```bash
git add architecture/electron-shell.md
git commit -m "docs: add electron shell architecture SOP"
```

---

## Group B: Foundation (Scaffold + Types + Lib + Stores + Hooks)

### Task 7: Scaffold Next.js Project

**Files:**
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `next.config.js`, `tailwind.config.js`, `tsconfig.json`, `postcss.config.js`
- Modify: `package.json`

- [ ] **Step 1: Initialize Next.js with Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
```

If project already has files, use `--no-git` flag and merge carefully.

- [ ] **Step 2: Install dependencies**

```bash
npm install zustand idb-keyval react-grid-layout nanoid react-player
npm install -D @types/react-grid-layout
```

- [ ] **Step 3: Configure next.config.js for static export**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
};
module.exports = nextConfig;
```

- [ ] **Step 4: Set up globals.css with CSS custom properties**

Add to `src/app/globals.css` after Tailwind directives:

```css
:root {
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --bg-tertiary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --text-muted: #555555;
  --accent: #667eea;
  --accent-gradient: linear-gradient(135deg, #667eea, #764ba2);
  --border: #222222;
  --border-active: #333333;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}
```

- [ ] **Step 5: Create minimal layout.tsx**

```tsx
// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GlowDeck',
  description: 'Display your Tech with GlowDeck',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Create placeholder page.tsx**

```tsx
// src/app/page.tsx
export default function Home() {
  return <main className="h-screen w-screen bg-black" />;
}
```

- [ ] **Step 7: Verify it builds**

```bash
npm run build
```

Expected: build succeeds, static export to `out/` directory.

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and dependencies"
```

---

### Task 8: Define TypeScript Types

**Files:**
- Create: `src/types/widget.ts`
- Create: `src/types/layout.ts`
- Create: `src/types/preferences.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Write widget types**

```typescript
// src/types/widget.ts
export type WidgetType =
  | 'clock' | 'date' | 'calendar' | 'weather' | 'countdown' | 'quote'
  | 'youtube' | 'music' | 'stocks' | 'iframe' | 'photo-frame' | 'pomodoro';

export type WidgetTier = 'free' | 'premium';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  tier: WidgetTier;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { w: number; h: number };
}

export interface WidgetRegistryEntry {
  type: WidgetType;
  displayName: string;
  description: string;
  tier: WidgetTier;
  icon: string;
  component: React.LazyExoticComponent<React.ComponentType<WidgetProps>>;
  defaultConfig: Record<string, unknown>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxIframes?: number;
}

export interface WidgetProps {
  widget: Widget;
  onConfigChange: (config: Record<string, unknown>) => void;
}
```

- [ ] **Step 2: Write layout types**

```typescript
// src/types/layout.ts
import type { Widget } from './widget';

export interface GridConfig {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  padding: [number, number];
}

export interface Space {
  id: string;
  name: string;
  icon: string;
  widgets: Widget[];
  gridConfig: GridConfig;
  isDefault: boolean;
  createdAt: number;
}
```

- [ ] **Step 3: Write preferences types**

```typescript
// src/types/preferences.ts
export interface UserPreferences {
  activeSpaceId: string;
  theme: {
    mode: 'dark' | 'oled';
    accentColor: string;
  };
  nightMode: {
    enabled: boolean;
    autoSchedule: boolean;
    startTime: string;
    endTime: string;
  };
  wakeLock: boolean;
  burnInProtection: boolean;
  keyboardShortcuts: boolean;
  onboardingComplete: boolean;
}

export interface PremiumStatus {
  tier: 'free' | 'trial' | 'premium';
  trialStartDate: number | null;
  trialEndDate: number | null;
  upgradePromptsShown: number;
  lastPromptSessionId: string | null;
  sessionId: string;
}
```

- [ ] **Step 4: Create barrel export**

```typescript
// src/types/index.ts
export * from './widget';
export * from './layout';
export * from './preferences';
```

- [ ] **Step 5: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for widgets, layouts, and preferences"
```

---

### Task 9: Implement Constants and Utilities

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/lib/csp.ts`
- Create: `src/lib/idb.ts`

- [ ] **Step 1: Write constants**

```typescript
// src/lib/constants.ts
export const TRIAL_DURATION_DAYS = 21;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export const POLLING_WEATHER_MS = 900_000;   // 15 min
export const POLLING_STOCKS_MS = 60_000;     // 1 min default
export const POLLING_CALENDAR_MS = 300_000;  // 5 min

export const MAX_IFRAMES = 8;
export const BURN_IN_SHIFT_PX = 2;
export const BURN_IN_INTERVAL_MS = 60_000;
export const PERSIST_DEBOUNCE_MS = 500;

export const GRID_COLS = 12;
export const GRID_MARGIN: [number, number] = [8, 8];
export const GRID_PADDING: [number, number] = [8, 8];

export const FREE_WIDGET_TYPES = ['clock', 'date', 'calendar', 'weather', 'countdown', 'quote'] as const;
export const PREMIUM_WIDGET_TYPES = ['youtube', 'music', 'stocks', 'iframe', 'photo-frame', 'pomodoro'] as const;

export const CSP_FRAME_SRC = [
  "'self'",
  'https://www.youtube-nocookie.com',
  'https://www.youtube.com',
  'https://open.spotify.com',
  'https://s.tradingview.com',
  'https://www.tradingview.com',
  'https://calendar.google.com',
  'https://embed.windy.com',
];
```

- [ ] **Step 2: Write CSP utility**

```typescript
// src/lib/csp.ts
import { CSP_FRAME_SRC } from './constants';

export function isAllowedIframeSrc(url: string): boolean {
  try {
    const parsed = new URL(url);
    const origin = `${parsed.protocol}//${parsed.host}`;
    return CSP_FRAME_SRC.some(src => src !== "'self'" && origin.startsWith(src));
  } catch {
    return false;
  }
}

export function getCSPMetaContent(): string {
  return `frame-src ${CSP_FRAME_SRC.join(' ')};`;
}
```

- [ ] **Step 3: Write IndexedDB persistence adapter**

```typescript
// src/lib/idb.ts
import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';
import { PERSIST_DEBOUNCE_MS } from './constants';

let debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function createIDBStorage(storeName: string): StateStorage {
  return {
    getItem: async (name: string) => {
      const val = await get(`${storeName}-${name}`);
      return val ?? null;
    },
    setItem: (name: string, value: string) => {
      const key = `${storeName}-${name}`;
      clearTimeout(debounceTimers[key]);
      debounceTimers[key] = setTimeout(() => {
        set(key, value);
      }, PERSIST_DEBOUNCE_MS);
    },
    removeItem: async (name: string) => {
      del(`${storeName}-${name}`);
    },
  };
}
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add constants, CSP utility, and IndexedDB persistence adapter"
```

---

### Task 10: Implement Zustand Stores

**Files:**
- Create: `src/stores/premiumStore.ts`
- Create: `src/stores/preferenceStore.ts`
- Create: `src/stores/layoutStore.ts`
- Create: `src/stores/widgetStore.ts`
- Create: `src/stores/index.ts`

- [ ] **Step 1: Write premiumStore**

```typescript
// src/stores/premiumStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { PremiumStatus } from '@/types';
import { createIDBStorage } from '@/lib/idb';
import { TRIAL_DURATION_MS } from '@/lib/constants';

interface PremiumStore extends PremiumStatus {
  startTrial: () => void;
  checkTrialExpiry: () => void;
  canShowUpgradePrompt: () => boolean;
  recordUpgradePrompt: () => void;
  canAccessFeature: (tier: 'free' | 'premium') => boolean;
}

export const usePremiumStore = create<PremiumStore>()(
  persist(
    (set, get) => ({
      tier: 'trial',
      trialStartDate: Date.now(),
      trialEndDate: Date.now() + TRIAL_DURATION_MS,
      upgradePromptsShown: 0,
      lastPromptSessionId: null,
      sessionId: nanoid(),

      startTrial: () => {
        const now = Date.now();
        set({
          tier: 'trial',
          trialStartDate: now,
          trialEndDate: now + TRIAL_DURATION_MS,
        });
      },

      checkTrialExpiry: () => {
        const { tier, trialEndDate } = get();
        if (tier === 'trial' && trialEndDate && Date.now() >= trialEndDate) {
          set({ tier: 'free' });
        }
      },

      canShowUpgradePrompt: () => {
        const { tier, upgradePromptsShown, lastPromptSessionId, sessionId } = get();
        if (tier !== 'free') return false;
        if (upgradePromptsShown > 0 && lastPromptSessionId === sessionId) return false;
        return true;
      },

      recordUpgradePrompt: () => {
        const { sessionId } = get();
        set(state => ({
          upgradePromptsShown: state.upgradePromptsShown + 1,
          lastPromptSessionId: sessionId,
        }));
      },

      canAccessFeature: (tier) => {
        if (tier === 'free') return true;
        const { tier: userTier } = get();
        return userTier === 'premium' || userTier === 'trial';
      },
    }),
    {
      name: 'glowdeck-premium',
      storage: createIDBStorage('glowdeck-premium'),
      partialize: (state) => ({
        tier: state.tier,
        trialStartDate: state.trialStartDate,
        trialEndDate: state.trialEndDate,
        upgradePromptsShown: state.upgradePromptsShown,
        lastPromptSessionId: state.lastPromptSessionId,
      }),
    }
  )
);
```

- [ ] **Step 2: Write preferenceStore**

```typescript
// src/stores/preferenceStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPreferences } from '@/types';
import { createIDBStorage } from '@/lib/idb';

interface PreferenceStore extends UserPreferences {
  setTheme: (theme: UserPreferences['theme']) => void;
  setNightMode: (config: Partial<UserPreferences['nightMode']>) => void;
  toggleWakeLock: () => void;
  toggleBurnInProtection: () => void;
  setOnboardingComplete: () => void;
  setActiveSpaceId: (id: string) => void;
}

const defaults: UserPreferences = {
  activeSpaceId: 'home',
  theme: { mode: 'oled', accentColor: '#667eea' },
  nightMode: { enabled: false, autoSchedule: false, startTime: '22:00', endTime: '07:00' },
  wakeLock: true,
  burnInProtection: true,
  keyboardShortcuts: true,
  onboardingComplete: false,
};

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set) => ({
      ...defaults,
      setTheme: (theme) => set({ theme }),
      setNightMode: (config) => set(s => ({ nightMode: { ...s.nightMode, ...config } })),
      toggleWakeLock: () => set(s => ({ wakeLock: !s.wakeLock })),
      toggleBurnInProtection: () => set(s => ({ burnInProtection: !s.burnInProtection })),
      setOnboardingComplete: () => set({ onboardingComplete: true }),
      setActiveSpaceId: (id) => set({ activeSpaceId: id }),
    }),
    {
      name: 'glowdeck-prefs',
      storage: createIDBStorage('glowdeck-prefs'),
    }
  )
);
```

- [ ] **Step 3: Write layoutStore with default Spaces**

The layoutStore must include the 3 default Spaces from spec Section 5. Reference `docs/superpowers/specs/2026-04-08-glowdeck-blueprint-design.md` Section 5 for exact widget positions per Space.

Create `src/stores/layoutStore.ts` with:
- `spaces: Space[]` initialized with Home, Work, Focus (each with their widget arrays from the spec)
- `activeSpaceId: string` defaulting to `'home'`
- Actions: `setActiveSpace`, `createSpace`, `deleteSpace`, `updateGridConfig`
- Persist to `glowdeck-layouts` IndexedDB store

- [ ] **Step 4: Write widgetStore**

Create `src/stores/widgetStore.ts` with:
- Actions: `addWidget(spaceId, widgetType)` — creates Widget from registry defaults + nanoid
- `removeWidget(spaceId, widgetId)` — filter out widget
- `updateWidgetConfig(spaceId, widgetId, config)` — merge config
- `updateWidgetPosition(spaceId, widgetId, position)` — update {x, y}
- `updateWidgetSize(spaceId, widgetId, size)` — update {w, h}
- Persist to `glowdeck-widgets` IndexedDB store
- NOTE: Widget state lives in layoutStore's Space.widgets array. widgetStore may be merged into layoutStore if cleaner — decide during implementation.

- [ ] **Step 5: Create barrel export**

```typescript
// src/stores/index.ts
export { usePremiumStore } from './premiumStore';
export { usePreferenceStore } from './preferenceStore';
export { useLayoutStore } from './layoutStore';
export { useWidgetStore } from './widgetStore';
```

- [ ] **Step 6: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/stores/
git commit -m "feat: add Zustand stores with IndexedDB persistence"
```

---

### Task 11: Implement Widget Registry

**Files:**
- Create: `src/lib/widgetRegistry.ts`

- [ ] **Step 1: Create the static registry**

Map all 12 widget types to their metadata and lazy-loaded components. Pattern:

```typescript
import { lazy } from 'react';
import type { WidgetType, WidgetRegistryEntry } from '@/types';

export const widgetRegistry: Record<WidgetType, WidgetRegistryEntry> = {
  clock: {
    type: 'clock',
    displayName: 'Clock',
    description: 'Analog or digital clock display',
    tier: 'free',
    icon: '🕐',
    component: lazy(() => import('@/components/widgets/ClockWidget')),
    defaultConfig: { style: 'minimal-digital', format: '12h', showSeconds: true },
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 2, h: 2 },
  },
  // ... repeat for all 12 widget types
};

export function getRegistryEntry(type: WidgetType): WidgetRegistryEntry {
  return widgetRegistry[type];
}

export function getWidgetsByTier(tier: 'free' | 'premium'): WidgetRegistryEntry[] {
  return Object.values(widgetRegistry).filter(w => w.tier === tier);
}
```

- [ ] **Step 2: Create placeholder widget components**

Create stub files for all 12 widgets so the lazy imports resolve:

```bash
mkdir -p src/components/widgets
```

For each widget, create a minimal placeholder:

```tsx
// src/components/widgets/ClockWidget.tsx (pattern for all 12)
import type { WidgetProps } from '@/types';

export default function ClockWidget({ widget }: WidgetProps) {
  return <div className="flex items-center justify-center h-full text-white">Clock</div>;
}
```

Create: `ClockWidget.tsx`, `DateWidget.tsx`, `CalendarWidget.tsx`, `WeatherWidget.tsx`, `CountdownWidget.tsx`, `QuoteWidget.tsx`, `YouTubeWidget.tsx`, `MusicWidget.tsx`, `StocksWidget.tsx`, `IframeWidget.tsx`, `PhotoFrameWidget.tsx`, `PomodoroWidget.tsx`

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/widgetRegistry.ts src/components/widgets/
git commit -m "feat: add widget registry with 12 placeholder widget components"
```

---

### Task 12: Implement Hooks

**Files:**
- Create: `src/hooks/useWakeLock.ts`
- Create: `src/hooks/useNightMode.ts`
- Create: `src/hooks/useBurnInProtection.ts`
- Create: `src/hooks/usePremiumStatus.ts`
- Create: `src/hooks/index.ts`

- [ ] **Step 1: Write useWakeLock**

```typescript
// src/hooks/useWakeLock.ts
import { useEffect, useRef } from 'react';
import { usePreferenceStore } from '@/stores';

export function useWakeLock() {
  const enabled = usePreferenceStore(s => s.wakeLock);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let active = true;
    const request = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          if (active) request(); // re-acquire on release (e.g., tab switch)
        });
      } catch { /* user denied or not supported */ }
    };
    request();

    return () => {
      active = false;
      wakeLockRef.current?.release();
    };
  }, [enabled]);
}
```

- [ ] **Step 2: Write useBurnInProtection**

```typescript
// src/hooks/useBurnInProtection.ts
import { useState, useEffect } from 'react';
import { usePreferenceStore } from '@/stores';
import { BURN_IN_SHIFT_PX, BURN_IN_INTERVAL_MS } from '@/lib/constants';

export function useBurnInProtection() {
  const enabled = usePreferenceStore(s => s.burnInProtection);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) { setOffset({ x: 0, y: 0 }); return; }

    const interval = setInterval(() => {
      setOffset({
        x: Math.round((Math.random() - 0.5) * 2 * BURN_IN_SHIFT_PX),
        y: Math.round((Math.random() - 0.5) * 2 * BURN_IN_SHIFT_PX),
      });
    }, BURN_IN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled]);

  return offset;
}
```

- [ ] **Step 3: Write useNightMode**

```typescript
// src/hooks/useNightMode.ts
import { useEffect } from 'react';
import { usePreferenceStore } from '@/stores';

function isInSchedule(startTime: string, endTime: string): boolean {
  const now = new Date();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Crosses midnight
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function useNightMode() {
  const { enabled, autoSchedule, startTime, endTime } = usePreferenceStore(s => s.nightMode);

  useEffect(() => {
    const apply = () => {
      const active = enabled && (!autoSchedule || isInSchedule(startTime, endTime));
      document.documentElement.classList.toggle('night-mode', active);
    };
    apply();
    const interval = setInterval(apply, 60_000);
    return () => clearInterval(interval);
  }, [enabled, autoSchedule, startTime, endTime]);
}
```

Add to `globals.css`:
```css
.night-mode main {
  filter: sepia(100%) hue-rotate(-30deg) saturate(200%) brightness(0.6);
  transition: filter 500ms ease;
}
```

- [ ] **Step 4: Write usePremiumStatus**

```typescript
// src/hooks/usePremiumStatus.ts
import { useEffect } from 'react';
import { usePremiumStore } from '@/stores';

export function usePremiumStatus() {
  const checkTrialExpiry = usePremiumStore(s => s.checkTrialExpiry);
  const tier = usePremiumStore(s => s.tier);
  const trialEndDate = usePremiumStore(s => s.trialEndDate);

  useEffect(() => {
    checkTrialExpiry();
  }, [checkTrialExpiry]);

  const daysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate - Date.now()) / 86_400_000))
    : 0;

  return { tier, daysRemaining };
}
```

- [ ] **Step 5: Create barrel export and commit**

```typescript
// src/hooks/index.ts
export { useWakeLock } from './useWakeLock';
export { useNightMode } from './useNightMode';
export { useBurnInProtection } from './useBurnInProtection';
export { usePremiumStatus } from './usePremiumStatus';
```

```bash
git add src/hooks/
git commit -m "feat: add hooks for wake lock, burn-in protection, night mode, and premium status"
```

---

## Group C: Dashboard Core

### Task 13: Implement BurnInProtection Wrapper

**Files:**
- Create: `src/components/dashboard/BurnInProtection.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/dashboard/BurnInProtection.tsx
'use client';
import { useBurnInProtection } from '@/hooks';

export function BurnInProtection({ children }: { children: React.ReactNode }) {
  const offset = useBurnInProtection();

  return (
    <div
      className="h-full w-full"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/BurnInProtection.tsx
git commit -m "feat: add burn-in protection wrapper component"
```

---

### Task 14: Implement SpaceSwitcher

**Files:**
- Create: `src/components/dashboard/SpaceSwitcher.tsx`

- [ ] **Step 1: Write the component**

Horizontal tab bar at top showing Space names (Home | Work | Focus). Active tab highlighted with accent color. Clicking a tab calls `usePreferenceStore.setActiveSpaceId(id)`. Premium users see a "+" button to create custom Spaces. Compact height (~40px) to maximize dashboard area.

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/SpaceSwitcher.tsx
git commit -m "feat: add space switcher tab bar"
```

---

### Task 15: Implement WidgetContainer

**Files:**
- Create: `src/components/dashboard/WidgetContainer.tsx`
- Create: `src/components/dashboard/WidgetErrorBoundary.tsx`
- Create: `src/components/dashboard/WidgetSkeleton.tsx`

- [ ] **Step 1: Write WidgetErrorBoundary**

React class component with `componentDidCatch`. Renders fallback with error message + retry button. Catches errors from child widget only — other widgets unaffected.

- [ ] **Step 2: Write WidgetSkeleton**

Shimmer animation placeholder matching widget dimensions. Uses `animate-pulse` from Tailwind.

- [ ] **Step 3: Write WidgetContainer**

Wraps each widget with:
1. Error boundary (outermost)
2. `Suspense` with `WidgetSkeleton` fallback (for lazy-loaded components)
3. Premium gate check — if widget tier is premium and user is free, render `PremiumGate` overlay
4. CSS `contain: layout style paint` on the container div
5. `loading="lazy"` attribute passed to iframe-based widgets

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add widget container with error boundary, skeleton, and premium gate"
```

---

### Task 16: Implement DashboardGrid

**Files:**
- Create: `src/components/dashboard/DashboardGrid.tsx`

- [ ] **Step 1: Write the grid component**

Uses `react-grid-layout`'s `Responsive` component:
- `cols: { lg: 12, md: 12, sm: 6, xs: 4 }`
- `rowHeight`: calculated from `(window.innerHeight - 48) / 6` (48px for SpaceSwitcher)
- `margin` and `padding` from constants
- Maps current Space's widgets array to `<WidgetContainer>` children
- `onLayoutChange` handler updates widget positions/sizes in widgetStore
- `isDraggable` and `isResizable` gated by premium status
- Track iframe count across rendered widgets, enforce MAX_IFRAMES limit
- Each layout item: `{ i: widget.id, x: widget.position.x, y: widget.position.y, w: widget.size.w, h: widget.size.h, static: !isPremium }`

- [ ] **Step 2: Import react-grid-layout CSS**

Add to `globals.css`:
```css
@import 'react-grid-layout/css/styles.css';
@import 'react-resizable/css/styles.css';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/DashboardGrid.tsx src/app/globals.css
git commit -m "feat: add dashboard grid with react-grid-layout"
```

---

### Task 17: Wire Up Main Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx with providers and hooks**

Add `'use client'` to a wrapper component. Initialize hooks: `useWakeLock()`, `useNightMode()`, `usePremiumStatus()`. Wrap children in providers.

- [ ] **Step 2: Update page.tsx**

Compose the dashboard:
```tsx
<BurnInProtection>
  <TrialBanner />
  <SpaceSwitcher />
  <DashboardGrid />
</BurnInProtection>
<SettingsPanel />     {/* placeholder for now */}
<UpgradePrompt />     {/* placeholder for now */}
```

- [ ] **Step 3: Verify it runs**

```bash
npm run dev
```

Open http://localhost:3000 — should see black background with Space tabs and placeholder widgets in grid.

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: wire up main dashboard page with all core components"
```

---

## Group D: Widgets (Parallelizable)

Each widget follows the same pattern. Dispatch one subagent per widget or batch 2-3 together. Every widget:
1. Exports a default component accepting `WidgetProps`
2. Renders within its container bounds (no overflow)
3. Handles its own data fetching/polling if needed
4. Shows loading state while fetching
5. Handles errors gracefully

### Task 18: ClockWidget (FREE)

**Files:** `src/components/widgets/ClockWidget.tsx`

Implement 5 clock styles selectable via `config.style`:
- `minimal-digital`: Large time, small date below. Use `Intl.DateTimeFormat`.
- `analog`: SVG clock face with hour/minute/second hands. Sweep second hand via `requestAnimationFrame`.
- `flip-clock`: CSS flip animation on digit change (hour:minute:second).
- `binary`: Binary clock showing hours/minutes/seconds as binary dots.
- `word-clock`: Spells out time in words ("ten forty-two").

Config: `{ style, format: '12h' | '24h', showSeconds: boolean }`. Updates every second via `setInterval`.

---

### Task 19: DateWidget (FREE)

**Files:** `src/components/widgets/DateWidget.tsx`

Display current date with day-of-week, month, day number, year. Multiple format options via config. Updates every minute. Uses `Intl.DateTimeFormat` for localization.

---

### Task 20: CalendarWidget (FREE)

**Files:** `src/components/widgets/CalendarWidget.tsx`

Built-in month-view calendar grid (no iframe). Highlights today. CSS grid 7 columns. Navigable (previous/next month) if widget is large enough. Falls back to compact view showing just current week if widget is small.

---

### Task 21: WeatherWidget (FREE)

**Files:** `src/components/widgets/WeatherWidget.tsx`

Fetches from Open-Meteo API per `architecture/integrations.md`. Shows current temp, weather icon (mapped from WMO weather codes), high/low. Config: `{ latitude, longitude, units, pollInterval }`. Polls per config. Caches last response for offline/error fallback. Shows "Last updated X min ago" badge when stale. Location config via city search in settings (geocoding API).

---

### Task 22: CountdownWidget (FREE)

**Files:** `src/components/widgets/CountdownWidget.tsx`

Counts down to a user-configured date. Shows days, hours, minutes, seconds. Config: `{ targetDate: string (ISO), label: string }`. When target reached, shows "Complete!" with confetti-like animation. Updates every second.

---

### Task 23: QuoteWidget (FREE)

**Files:** `src/components/widgets/QuoteWidget.tsx`

Displays a daily inspirational quote. Ships with a built-in array of 100+ quotes. Selects quote based on day-of-year (deterministic, same quote all day). Config: `{ category: 'inspirational' | 'tech' | 'stoic' }`. Centered text with author attribution.

---

### Task 24: YouTubeWidget (PREMIUM)

**Files:** `src/components/widgets/YouTubeWidget.tsx`

Uses `react-player` with YouTube nocookie URL. Config: `{ videoUrl, autoplay: false, loop }`. User pastes YouTube URL, component extracts video ID. No autoplay — play button overlay required. Respects iframe sandbox rules from `architecture/integrations.md`.

---

### Task 25: MusicWidget (PREMIUM)

**Files:** `src/components/widgets/MusicWidget.tsx`

Two modes via config:
- `spotify`: Iframe embed from `open.spotify.com/embed/...`. User pastes Spotify link, extract embed path. `theme=0` for dark mode.
- `local`: AmplitudeJS player for local audio files (stretch goal — implement Spotify mode first).

Config: `{ mode: 'spotify' | 'local', spotifyUrl, localFiles }`.

---

### Task 26: StocksWidget (PREMIUM)

**Files:** `src/components/widgets/StocksWidget.tsx`

TradingView iframe embed per `architecture/integrations.md`. Config: `{ symbols: string[], chartType: 'mini' | 'advanced' | 'ticker', pollInterval }`. Builds iframe URL with symbol and locale params. 10-second load timeout. Shows "Stocks unavailable" placeholder on error.

---

### Task 27: IframeWidget (PREMIUM)

**Files:** `src/components/widgets/IframeWidget.tsx`

Generic iframe embed for any CSP-whitelisted URL. Config: `{ url: string, refreshInterval?: number }`. Validates URL against `isAllowedIframeSrc()` before rendering. Shows error if URL not in whitelist. Sandbox: `allow-scripts allow-same-origin`. `loading="lazy"`.

---

### Task 28: PhotoFrameWidget (PREMIUM)

**Files:** `src/components/widgets/PhotoFrameWidget.tsx`

Slideshow from user-selected local images. Uses `<input type="file" accept="image/*" multiple>` to load images as object URLs. Config: `{ images: string[] (object URLs), interval: number (ms), transition: 'fade' | 'slide' }`. Cycles through images with CSS transition. Shows "Add Photos" placeholder when empty.

---

### Task 29: PomodoroWidget (PREMIUM)

**Files:** `src/components/widgets/PomodoroWidget.tsx`

Focus timer with configurable work/break intervals. Config: `{ workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 }`. Circular progress SVG. States: idle, working, break, long-break. Audio chime on state transition (only with user interaction per behavioral rules). Session counter.

---

## Group E: UI Shell

### Task 30: Implement PremiumGate Component

**Files:**
- Create: `src/components/premium/PremiumGate.tsx`

Blur overlay shown on locked premium widgets. Renders:
- `backdrop-filter: blur(8px)` over widget content
- PRO gradient badge (`var(--accent-gradient)`)
- Contextual description from widget registry `description` field
- CTA button: "Start Free Trial" (if never trialed) or "Upgrade to Pro" (if trial expired)
- Clicking CTA triggers upgrade prompt (respecting max 1/session rule)

---

### Task 31: Implement UpgradePrompt Modal

**Files:**
- Create: `src/components/premium/UpgradePrompt.tsx`

Modal overlay (centered, backdrop blur). Shows when `premiumStore.canShowUpgradePrompt()` is true and user taps a premium feature. Content: feature benefits, pricing placeholder, CTA buttons (Upgrade / Maybe Later). Calls `recordUpgradePrompt()` on display. Dismissible with Escape key or "Maybe Later".

---

### Task 32: Implement TrialBanner

**Files:**
- Create: `src/components/premium/TrialBanner.tsx`

Thin banner at top of dashboard (below SpaceSwitcher). Shows only during trial: "X days left in your free trial". Subtle styling, no close button (auto-hides after trial). Uses `usePremiumStatus()` hook for `daysRemaining`.

---

### Task 33: Implement SettingsPanel

**Files:**
- Create: `src/components/settings/SettingsPanel.tsx`
- Create: `src/components/settings/ThemeSettings.tsx`
- Create: `src/components/settings/SpaceManager.tsx`
- Create: `src/components/settings/WidgetPicker.tsx`

SettingsPanel: Slide-in drawer from right, 400px wide, `backdrop-filter: blur(12px)`, spring animation via CSS transition. Opened by gear icon in SpaceSwitcher or Escape key. Sections: Theme, Spaces, Add Widget.

ThemeSettings: Toggle dark/OLED mode, accent color picker (premium), night mode toggle + schedule config.

SpaceManager: List of Spaces with edit/delete. "Create Space" button (premium). Edit Space name and icon.

WidgetPicker: Grid of available widget types from registry. Shows icon, name, description. PRO badge on premium widgets. Clicking adds widget to current Space at next available grid position.

---

### Task 34: Implement OnboardingWizard

**Files:**
- Create: `src/components/onboarding/OnboardingWizard.tsx`

3-step wizard shown on first launch (`preferenceStore.onboardingComplete === false`):
1. **Choose your vibe** — Select a default Space (Home/Work/Focus) as starting view
2. **Pick your widgets** — Show widget picker, let user customize their starting layout
3. **Start your free trial** — Explain 21-day trial, CTA to begin. Calls `startTrial()` + `setOnboardingComplete()`

Modal overlay, step indicator dots, back/next navigation. Smooth transitions between steps.

---

### Task 35: Final Wiring & Verification

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Wire all components into page.tsx**

Ensure all components are rendered:
- OnboardingWizard (conditional on `!onboardingComplete`)
- BurnInProtection > TrialBanner + SpaceSwitcher + DashboardGrid
- SettingsPanel
- UpgradePrompt

- [ ] **Step 2: Full build verification**

```bash
npm run build
```

Expected: clean build, no TypeScript errors, static export succeeds.

- [ ] **Step 3: Dev server smoke test**

```bash
npm run dev
```

Verify in browser:
- Black background renders
- Space tabs visible (Home, Work, Focus)
- Widgets render in grid
- Clock shows time
- Weather fetches data
- Settings panel slides in
- Premium widgets show blur + PRO badge (after trial)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire up complete GlowDeck dashboard with all components"
```

---

## Phase Gate

After all tasks complete, present to user:
- Component tree (verify all files exist)
- File structure (`tree src/`)
- Running dev server screenshot
- **"Show me the component tree and file structure."**
