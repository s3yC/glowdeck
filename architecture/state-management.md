# GlowDeck -- Zustand Store & State Management SOP

## Overview

GlowDeck uses Zustand for state management with 4 store slices, each persisted to IndexedDB via `idb-keyval`. Stores are designed for an offline-first, single-device application -- no server sync, no localStorage, no cookies. State hydrates from IndexedDB on launch and persists with debounced writes to avoid thrashing during drag/resize operations.

---

## 1. Store Architecture

### 4 Store Slices

| Store | Responsibility | IndexedDB Key | Key State |
|-------|---------------|---------------|-----------|
| `widgetStore` | Widget instances and configs per Space | `glowdeck-widgets` | `widgets: Record<spaceId, Widget[]>` |
| `layoutStore` | Spaces, grid configs, active Space | `glowdeck-layouts` | `spaces: Space[]`, `activeSpaceId: string` |
| `preferenceStore` | Theme, night mode, wake lock, shortcuts | `glowdeck-prefs` | `theme`, `nightMode`, `wakeLock`, etc. |
| `premiumStore` | Trial status, tier, prompt tracking | `glowdeck-premium` | `tier`, `trialStartDate`, `trialEndDate` |

### Why 4 Separate Stores (Not 1 Combined Store)

- **Selective persistence**: each store has its own IndexedDB key and write frequency. Widget position changes (frequent during drag) should not trigger preference writes.
- **Selective hydration**: stores hydrate independently. A slow widget store load does not block theme application.
- **Selective subscription**: components subscribe to the slice they need. A theme change does not re-render the grid.
- **Independent debounce**: the widget store uses 500ms debounce for position/size writes during drag. The preference store can write immediately on toggle.

---

## 2. Store Slice Definitions

### widgetStore

Manages widget instances and their configurations, keyed by Space ID.

```typescript
// src/stores/widgetStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from '@/lib/idbStorage';

interface WidgetState {
  // Widgets grouped by Space ID
  widgetsBySpace: Record<string, Widget[]>;

  // Actions
  addWidget:            (spaceId: string, widget: Widget) => void;
  removeWidget:         (spaceId: string, widgetId: string) => void;
  updateWidgetConfig:   (widgetId: string, config: Record<string, unknown>) => void;
  updateWidgetPosition: (widgetId: string, position: { x: number; y: number }) => void;
  updateWidgetSize:     (widgetId: string, size: { w: number; h: number }) => void;
  getWidgetsForSpace:   (spaceId: string) => Widget[];
}

const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      widgetsBySpace: {},

      addWidget: (spaceId, widget) =>
        set((state) => ({
          widgetsBySpace: {
            ...state.widgetsBySpace,
            [spaceId]: [...(state.widgetsBySpace[spaceId] ?? []), widget],
          },
        })),

      removeWidget: (spaceId, widgetId) =>
        set((state) => ({
          widgetsBySpace: {
            ...state.widgetsBySpace,
            [spaceId]: (state.widgetsBySpace[spaceId] ?? []).filter(
              (w) => w.id !== widgetId
            ),
          },
        })),

      updateWidgetConfig: (widgetId, config) =>
        set((state) => {
          const updated = { ...state.widgetsBySpace };
          for (const spaceId of Object.keys(updated)) {
            updated[spaceId] = updated[spaceId].map((w) =>
              w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
            );
          }
          return { widgetsBySpace: updated };
        }),

      updateWidgetPosition: (widgetId, position) =>
        set((state) => {
          const updated = { ...state.widgetsBySpace };
          for (const spaceId of Object.keys(updated)) {
            updated[spaceId] = updated[spaceId].map((w) =>
              w.id === widgetId ? { ...w, position } : w
            );
          }
          return { widgetsBySpace: updated };
        }),

      updateWidgetSize: (widgetId, size) =>
        set((state) => {
          const updated = { ...state.widgetsBySpace };
          for (const spaceId of Object.keys(updated)) {
            updated[spaceId] = updated[spaceId].map((w) =>
              w.id === widgetId ? { ...w, size } : w
            );
          }
          return { widgetsBySpace: updated };
        }),

      getWidgetsForSpace: (spaceId) => get().widgetsBySpace[spaceId] ?? [],
    }),
    {
      name: 'glowdeck-widgets',
      storage: idbStorage('glowdeck-widgets'),
    }
  )
);
```

### layoutStore

Manages Spaces (profiles) and the active Space selection.

```typescript
// src/stores/layoutStore.ts

interface LayoutState {
  spaces:        Space[];
  activeSpaceId: string;

  // Actions
  setActiveSpace: (spaceId: string) => void;
  createSpace:    (space: Space) => void;
  deleteSpace:    (spaceId: string) => void;
  updateSpace:    (spaceId: string, updates: Partial<Space>) => void;
  getActiveSpace: () => Space | undefined;
}

const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      spaces: defaultSpaces,           // Home, Work, Focus from defaultSpaces.ts
      activeSpaceId: 'space-home',

      setActiveSpace: (spaceId) =>
        set({ activeSpaceId: spaceId }),

      createSpace: (space) =>
        set((state) => ({ spaces: [...state.spaces, space] })),

      deleteSpace: (spaceId) =>
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== spaceId || s.isDefault),
          // Prevent deleting default Spaces
          activeSpaceId:
            state.activeSpaceId === spaceId ? 'space-home' : state.activeSpaceId,
        })),

      updateSpace: (spaceId, updates) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, ...updates } : s
          ),
        })),

      getActiveSpace: () => {
        const state = get();
        return state.spaces.find((s) => s.id === state.activeSpaceId);
      },
    }),
    {
      name: 'glowdeck-layouts',
      storage: idbStorage('glowdeck-layouts'),
    }
  )
);
```

### preferenceStore

Manages user preferences: theme, night mode, wake lock, burn-in protection, keyboard shortcuts, onboarding status.

```typescript
// src/stores/preferenceStore.ts

interface PreferenceState {
  activeSpaceId:      string;
  theme: {
    mode:             'dark' | 'oled';
    accentColor:      string;
  };
  nightMode: {
    enabled:          boolean;
    autoSchedule:     boolean;
    startTime:        string;
    endTime:          string;
  };
  wakeLock:           boolean;
  burnInProtection:   boolean;
  keyboardShortcuts:  boolean;
  onboardingComplete: boolean;

  // Actions
  setTheme:              (theme: Partial<PreferenceState['theme']>) => void;
  setNightMode:          (nightMode: Partial<PreferenceState['nightMode']>) => void;
  toggleWakeLock:        () => void;
  toggleBurnInProtection:() => void;
  toggleKeyboardShortcuts:() => void;
  setOnboardingComplete: (complete: boolean) => void;
  setActiveSpaceId:      (id: string) => void;
}

const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      activeSpaceId: 'space-home',
      theme: { mode: 'oled', accentColor: '#667eea' },
      nightMode: { enabled: false, autoSchedule: false, startTime: '22:00', endTime: '07:00' },
      wakeLock: false,
      burnInProtection: true,
      keyboardShortcuts: true,
      onboardingComplete: false,

      setTheme: (theme) =>
        set((state) => ({ theme: { ...state.theme, ...theme } })),

      setNightMode: (nightMode) =>
        set((state) => ({ nightMode: { ...state.nightMode, ...nightMode } })),

      toggleWakeLock: () =>
        set((state) => ({ wakeLock: !state.wakeLock })),

      toggleBurnInProtection: () =>
        set((state) => ({ burnInProtection: !state.burnInProtection })),

      toggleKeyboardShortcuts: () =>
        set((state) => ({ keyboardShortcuts: !state.keyboardShortcuts })),

      setOnboardingComplete: (complete) =>
        set({ onboardingComplete: complete }),

      setActiveSpaceId: (id) =>
        set({ activeSpaceId: id }),
    }),
    {
      name: 'glowdeck-prefs',
      storage: idbStorage('glowdeck-prefs'),
    }
  )
);
```

### premiumStore

Manages trial and premium subscription status.

```typescript
// src/stores/premiumStore.ts

interface PremiumState {
  tier:                  'free' | 'trial' | 'premium';
  trialStartDate:        number | null;
  trialEndDate:          number | null;
  upgradePromptsShown:   number;
  lastPromptSessionId:   string | null;

  // Actions
  startTrial:          () => void;
  checkTrialExpiry:    () => void;
  recordUpgradePrompt: (sessionId: string) => void;
  setPremium:          () => void;
}

const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      trialStartDate: null,
      trialEndDate: null,
      upgradePromptsShown: 0,
      lastPromptSessionId: null,

      startTrial: () => {
        const now = Date.now();
        set({
          tier: 'trial',
          trialStartDate: now,
          trialEndDate: now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
        });
      },

      checkTrialExpiry: () => {
        const state = get();
        if (state.tier !== 'trial') return;
        if (state.trialEndDate && Date.now() >= state.trialEndDate) {
          set({ tier: 'free' });
        }
      },

      recordUpgradePrompt: (sessionId) =>
        set((state) => ({
          upgradePromptsShown: state.upgradePromptsShown + 1,
          lastPromptSessionId: sessionId,
        })),

      setPremium: () => set({ tier: 'premium' }),
    }),
    {
      name: 'glowdeck-premium',
      storage: idbStorage('glowdeck-premium'),
    }
  )
);
```

---

## 3. IndexedDB Persistence Adapter

All stores use a custom `idb-keyval` storage adapter compatible with Zustand's `persist` middleware.

### Adapter Implementation

```typescript
// src/lib/idbStorage.ts

import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * Creates a Zustand-compatible storage adapter backed by idb-keyval.
 * Each store gets its own namespace prefix to avoid key collisions.
 */
export function idbStorage(storeName: string): StateStorage {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const value = await get(`${storeName}-${name}`);
      return value ?? null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
      await set(`${storeName}-${name}`, value);
    },
    removeItem: async (name: string): Promise<void> => {
      await del(`${storeName}-${name}`);
    },
  };
}
```

### Why idb-keyval (Not localStorage)

- **Async**: Does not block the main thread on read/write
- **Structured data**: Can store objects, arrays, blobs (not just strings)
- **Larger quota**: IndexedDB has significantly more storage than localStorage (typically 50%+ of free disk space vs 5-10 MB)
- **Project rule**: `claude.md` explicitly forbids localStorage -- IndexedDB only

---

## 4. Debounced Persistence

During drag and resize operations, widget positions change many times per second. Writing to IndexedDB on every change would cause performance issues. The persistence adapter wraps `setItem` with a 500ms debounce.

### Debounced Adapter

```typescript
// src/lib/idbStorage.ts

import { debounce } from '@/lib/debounce';

export function idbStorageDebounced(
  storeName: string,
  debounceMs: number = PERSIST_DEBOUNCE_MS
): StateStorage {
  const debouncedSet = debounce(
    async (name: string, value: string) => {
      await set(`${storeName}-${name}`, value);
    },
    debounceMs
  );

  return {
    getItem: async (name: string): Promise<string | null> => {
      const value = await get(`${storeName}-${name}`);
      return value ?? null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
      debouncedSet(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
      await del(`${storeName}-${name}`);
    },
  };
}
```

### Debounce Utility

```typescript
// src/lib/debounce.ts

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}
```

### Which Stores Use Debouncing

| Store | Debounce | Reason |
|-------|----------|--------|
| `widgetStore` | 500ms (`PERSIST_DEBOUNCE_MS`) | Position/size changes are rapid during drag/resize |
| `layoutStore` | 500ms | Space reordering may involve multiple rapid changes |
| `preferenceStore` | None (immediate) | Toggle actions are infrequent; user expects instant persistence |
| `premiumStore` | None (immediate) | Trial status changes are rare and must persist immediately |

---

## 5. Hydration Strategy

### Hydration Flow

```
1. App launches
2. Show skeleton UI (full-screen loading state)
3. All 4 stores begin hydrating in parallel from IndexedDB
4. preferenceStore hydrates -> apply theme mode + accent color to CSS variables
5. layoutStore hydrates -> determine active Space
6. widgetStore hydrates -> load widgets for active Space
7. premiumStore hydrates -> check trial expiry, determine tier
8. All stores hydrated -> hide skeleton, render dashboard
```

### Implementation

Zustand's `persist` middleware fires `onRehydrateStorage` when hydration completes. Track hydration status across all stores:

```typescript
// src/hooks/useHydration.ts

function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if all stores have finished hydrating
    const unsubWidget = useWidgetStore.persist.onFinishHydration(() => checkAll());
    const unsubLayout = useLayoutStore.persist.onFinishHydration(() => checkAll());
    const unsubPref   = usePreferenceStore.persist.onFinishHydration(() => checkAll());
    const unsubPrem   = usePremiumStore.persist.onFinishHydration(() => checkAll());

    function checkAll() {
      const allReady =
        useWidgetStore.persist.hasHydrated() &&
        useLayoutStore.persist.hasHydrated() &&
        usePreferenceStore.persist.hasHydrated() &&
        usePremiumStore.persist.hasHydrated();

      if (allReady) setIsHydrated(true);
    }

    // Check immediately in case stores already hydrated
    checkAll();

    return () => {
      unsubWidget();
      unsubLayout();
      unsubPref();
      unsubPrem();
    };
  }, []);

  return isHydrated;
}
```

### Default Values

Each store is initialized with sensible defaults so the app renders correctly even before hydration completes:

| Store | Default State |
|-------|--------------|
| `widgetStore` | Empty `widgetsBySpace: {}` (populated from `defaultSpaces` on first run) |
| `layoutStore` | `spaces: [Home, Work, Focus]`, `activeSpaceId: 'space-home'` |
| `preferenceStore` | OLED mode, accent `#667eea`, night mode off, burn-in on, onboarding incomplete |
| `premiumStore` | `tier: 'free'`, no trial dates, 0 prompts shown |

### First-Run Initialization

On the very first launch (when IndexedDB is empty), stores hydrate with their defaults. The widget store detects an empty `widgetsBySpace` and seeds it with the default Space widget arrays:

```typescript
// In widgetStore, after hydration:
onRehydrateStorage: () => (state) => {
  if (state && Object.keys(state.widgetsBySpace).length === 0) {
    // Seed default widgets for each default Space
    state.widgetsBySpace = {
      'space-home':  homeSpace.widgets,
      'space-work':  workSpace.widgets,
      'space-focus': focusSpace.widgets,
    };
  }
}
```

---

## 6. Session ID for Upgrade Prompt Tracking

A unique session ID is generated on each app launch to enforce the "max 1 upgrade prompt per session" rule. This ID lives in memory only (not persisted) so it resets on every fresh page load or app restart.

```typescript
// src/app/layout.tsx (or a context provider)

import { nanoid } from 'nanoid';
import { createContext, useContext, useRef } from 'react';

const SessionContext = createContext<string>('');

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const sessionId = useRef(nanoid()).current;
  return (
    <SessionContext.Provider value={sessionId}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionId(): string {
  return useContext(SessionContext);
}
```

The `premiumStore` records `lastPromptSessionId` when an upgrade prompt is shown. Comparing `lastPromptSessionId` against the current `sessionId` determines whether a prompt has already been shown this session.

---

## 7. Store Access Patterns

### Inside React Components

Use Zustand's hook with a selector for optimal re-rendering:

```typescript
// Good: selective subscription
const theme = usePreferenceStore((s) => s.theme);
const tier = usePremiumStore((s) => s.tier);

// Bad: subscribes to entire store (re-renders on any change)
const store = usePreferenceStore();
```

### Outside React (Utilities, Event Handlers)

Use `getState()` for synchronous access outside the React lifecycle:

```typescript
// Good: direct state access
const isPremium = usePremiumStore.getState().tier === 'premium';

// Good: calling an action
useWidgetStore.getState().updateWidgetPosition(widgetId, newPosition);
```

---

## 8. File Structure

```
src/
  stores/
    widgetStore.ts               # Widget instances and configs per Space
    layoutStore.ts               # Spaces, grid configs, active Space
    preferenceStore.ts           # Theme, night mode, wake lock, shortcuts
    premiumStore.ts              # Trial status, tier, prompt tracking
  lib/
    idbStorage.ts                # idb-keyval persistence adapter (plain + debounced)
    debounce.ts                  # Generic debounce utility
    constants.ts                 # PERSIST_DEBOUNCE_MS = 500, TRIAL_DURATION_DAYS = 21
  hooks/
    useHydration.ts              # Track hydration status across all stores
  types/
    widget.ts                    # Widget, WidgetType, WidgetTier
    layout.ts                    # Space, GridConfig
    preferences.ts               # UserPreferences, PremiumStatus, NightModeConfig
```
