# GlowDeck -- Theme & Night Mode SOP

## Overview

GlowDeck uses CSS custom properties (design tokens) for runtime theming. The app ships with two base modes -- dark (dark gray) and oled (pure black) -- and a night mode that applies a red-tint filter to reduce eye strain. Premium users can customize the accent color. All theme preferences persist to IndexedDB via the preference store.

---

## 1. Design Tokens (CSS Custom Properties)

All color and spacing values are defined as CSS custom properties on `:root`. Components reference these tokens rather than hardcoded values, enabling runtime theme switching without re-rendering the React tree.

### Token Definitions

```css
/* src/app/globals.css */

:root {
  /* Background layers */
  --bg-primary:    #000000;           /* Main background */
  --bg-secondary:  #111111;           /* Widget background, cards */
  --bg-tertiary:   #1a1a1a;           /* Skeleton placeholders, subtle surfaces */

  /* Text hierarchy */
  --text-primary:   #ffffff;          /* Headings, primary content */
  --text-secondary: #888888;          /* Labels, secondary info */
  --text-muted:     #555555;          /* Hints, disabled states */

  /* Accent (user-configurable in premium) */
  --accent:          var(--user-accent, #667eea);
  --accent-gradient: linear-gradient(135deg, #667eea, #764ba2);

  /* Borders */
  --border:        #222222;           /* Default borders */
  --border-active: #333333;           /* Focused/active borders */
}
```

### OLED vs Dark Mode Values

The two modes share the same token names but differ in background values:

| Token | OLED Mode (`mode: 'oled'`) | Dark Mode (`mode: 'dark'`) |
|-------|---------------------------|---------------------------|
| `--bg-primary` | `#000000` (pure black) | `#121212` (dark gray) |
| `--bg-secondary` | `#111111` | `#1e1e1e` |
| `--bg-tertiary` | `#1a1a1a` | `#2a2a2a` |
| `--text-primary` | `#ffffff` | `#e0e0e0` |
| `--text-secondary` | `#888888` | `#9e9e9e` |
| `--text-muted` | `#555555` | `#666666` |
| `--border` | `#222222` | `#333333` |
| `--border-active` | `#333333` | `#444444` |

### Applying Theme Mode

Theme mode is applied by setting CSS custom properties on the `<html>` element:

```typescript
function applyThemeMode(mode: 'dark' | 'oled'): void {
  const root = document.documentElement;
  const tokens = mode === 'oled' ? oledTokens : darkTokens;

  Object.entries(tokens).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}
```

```typescript
const oledTokens = {
  '--bg-primary':    '#000000',
  '--bg-secondary':  '#111111',
  '--bg-tertiary':   '#1a1a1a',
  '--text-primary':  '#ffffff',
  '--text-secondary':'#888888',
  '--text-muted':    '#555555',
  '--border':        '#222222',
  '--border-active': '#333333',
};

const darkTokens = {
  '--bg-primary':    '#121212',
  '--bg-secondary':  '#1e1e1e',
  '--bg-tertiary':   '#2a2a2a',
  '--text-primary':  '#e0e0e0',
  '--text-secondary':'#9e9e9e',
  '--text-muted':    '#666666',
  '--border':        '#333333',
  '--border-active': '#444444',
};
```

### Custom Accent Color (Premium)

Premium users can set a custom accent color. The value is stored in `preferenceStore.theme.accentColor` and applied as a CSS custom property:

```typescript
function applyAccentColor(color: string): void {
  document.documentElement.style.setProperty('--user-accent', color);
}
```

Because `--accent` is defined as `var(--user-accent, #667eea)`, the custom color overrides the default when set. The accent gradient updates independently (the gradient is used for PRO badges and CTAs and always uses the brand gradient).

---

## 2. Typography

### System Font Stack

GlowDeck uses the system font stack for maximum compatibility and zero font loading overhead:

```css
body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen-Sans,
    Ubuntu,
    Cantarell,
    'Helvetica Neue',
    sans-serif;
}
```

### Type Scale

| Usage | Class / Size | Weight |
|-------|-------------|--------|
| Widget title | `text-sm` (14px) | `font-medium` (500) |
| Clock (large) | `text-8xl` (96px) responsive | `font-light` (300) |
| Clock (medium) | `text-6xl` (60px) responsive | `font-light` (300) |
| Body text | `text-base` (16px) | `font-normal` (400) |
| Label / caption | `text-xs` (12px) | `font-medium` (500) |
| PRO badge | `text-xs` (12px) | `font-bold` (700) |

### Responsive Clock Sizing

The clock widget adjusts font size based on its grid size. Use Tailwind's responsive utilities or CSS `clamp()`:

```css
.clock-display {
  font-size: clamp(2rem, 8vw, 8rem);
  font-weight: 300;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;  /* Prevent layout shift from changing digits */
}
```

---

## 3. Night Mode

Night mode applies a red-tint CSS filter to the entire dashboard to reduce blue light emission. This is an accessibility and comfort feature for always-on displays in dark environments.

### CSS Filter Approach

```css
/* Applied to <main> or the root dashboard wrapper */
.night-mode-active {
  filter: sepia(100%) hue-rotate(-30deg) saturate(200%) brightness(0.6);
  transition: filter 500ms ease-in-out;
}

.night-mode-inactive {
  filter: none;
  transition: filter 500ms ease-in-out;
}
```

### Transition

The filter fades in/out over 500ms using CSS transitions. This prevents a jarring flash when toggling night mode.

### Implementation

```typescript
// src/hooks/useNightMode.ts

function useNightMode() {
  const nightMode = usePreferenceStore((s) => s.nightMode);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!nightMode.enabled) {
      setIsActive(false);
      return;
    }

    if (!nightMode.autoSchedule) {
      // Manual mode: night mode is always active when enabled
      setIsActive(true);
      return;
    }

    // Auto-schedule mode: check current time against startTime/endTime
    function checkSchedule() {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = nightMode.startTime.split(':').map(Number);
      const [endH, endM] = nightMode.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes > endMinutes) {
        // Overnight range (e.g., 22:00 to 07:00)
        setIsActive(currentMinutes >= startMinutes || currentMinutes < endMinutes);
      } else {
        // Same-day range
        setIsActive(currentMinutes >= startMinutes && currentMinutes < endMinutes);
      }
    }

    checkSchedule();
    const interval = setInterval(checkSchedule, 60_000); // Re-check every 60 seconds

    return () => clearInterval(interval);
  }, [nightMode]);

  return isActive;
}
```

### Usage in Component Tree

```tsx
// In the root layout or App component

function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const isNightMode = useNightMode();

  return (
    <main className={isNightMode ? 'night-mode-active' : 'night-mode-inactive'}>
      {children}
    </main>
  );
}
```

---

## 4. Auto-Schedule

Night mode supports an auto-schedule that activates/deactivates based on time of day.

### Configuration

```typescript
interface NightModeConfig {
  enabled:      boolean;       // Master toggle
  autoSchedule: boolean;       // If true, use startTime/endTime
  startTime:    string;        // "22:00" (24-hour format)
  endTime:      string;        // "07:00" (24-hour format)
}
```

### Default Values

```typescript
const defaultNightMode: NightModeConfig = {
  enabled: false,
  autoSchedule: false,
  startTime: '22:00',
  endTime: '07:00',
};
```

### Behavior Matrix

| `enabled` | `autoSchedule` | Behavior |
|-----------|---------------|----------|
| `false` | any | Night mode off |
| `true` | `false` | Night mode always on |
| `true` | `true` | Night mode follows schedule |

### Settings UI

The Settings panel provides:
1. Night mode toggle (on/off)
2. Auto-schedule toggle (only visible when night mode is on)
3. Start time picker (only visible when auto-schedule is on)
4. End time picker (only visible when auto-schedule is on)

---

## 5. Theme Persistence

All theme settings persist to IndexedDB via the `preferenceStore` Zustand slice. Changes take effect immediately (CSS custom properties update in real-time) and persist across sessions.

### PreferenceStore Theme Slice

```typescript
interface ThemeState {
  mode: 'dark' | 'oled';
  accentColor: string;
}
```

### Theme Application on Hydration

When the app hydrates from IndexedDB:

1. Read `preferenceStore.theme.mode` from IndexedDB
2. Call `applyThemeMode(mode)` to set CSS custom properties
3. If `accentColor` differs from default, call `applyAccentColor(accentColor)`
4. Read `preferenceStore.nightMode` settings
5. Initialize the `useNightMode` hook

This all happens before the skeleton is hidden, so the user never sees a flash of wrong theme.

### Theme Change Flow

```
User clicks "Dark Mode" toggle in Settings
  -> preferenceStore.setTheme({ mode: 'dark' })
  -> applyThemeMode('dark') updates CSS custom properties
  -> All components re-render with new token values (no React state change needed -- CSS handles it)
  -> preferenceStore persists to IndexedDB (debounced 500ms)
```

---

## 6. Body & Root Styles

### Global CSS

```css
/* src/app/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Design tokens -- see Section 1 */
:root { /* ... */ }

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;                     /* Dashboard fills viewport, no scroll */
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Night mode filter classes */
.night-mode-active {
  filter: sepia(100%) hue-rotate(-30deg) saturate(200%) brightness(0.6);
  transition: filter 500ms ease-in-out;
}

.night-mode-inactive {
  filter: none;
  transition: filter 500ms ease-in-out;
}

/* Widget container performance isolation */
.widget-container {
  contain: layout style paint;
  overflow: hidden;
  border-radius: 0.75rem;
  background: var(--bg-secondary);
}
```

---

## 7. Tailwind Configuration

Extend Tailwind to use CSS custom properties as color values:

```javascript
// tailwind.config.js

module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary:  'var(--bg-tertiary)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
        accent:      'var(--accent)',
        border: {
          DEFAULT:   'var(--border)',
          active:    'var(--border-active)',
        },
      },
    },
  },
  plugins: [],
};
```

This enables usage like `bg-bg-primary`, `text-text-secondary`, `border-border` in Tailwind classes.

---

## 8. File Structure

```
src/
  app/
    globals.css                   # Design tokens, night mode classes, base styles
  lib/
    theme.ts                      # applyThemeMode(), applyAccentColor(), token maps
  hooks/
    useNightMode.ts               # Night mode hook with auto-schedule
  stores/
    preferenceStore.ts            # Theme mode, accent color, night mode config
  types/
    preferences.ts                # ThemeState, NightModeConfig interfaces
```
