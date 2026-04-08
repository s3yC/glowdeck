# GlowDeck -- Widget Plugin Architecture SOP

## Overview

Every widget in GlowDeck is a self-contained React component registered in a single static map (`widgetRegistry.ts`). The registry pattern provides type safety, tree-shakeability, and trivial testability without the complexity of a plugin/manifest system. Adding a new widget requires exactly two steps: create the component file and add one registry entry.

---

## 1. Standard Widget Interface

### WidgetProps

Every widget component receives the same props interface. This guarantees uniform behavior across all 12 widget types.

```typescript
// src/types/widget.ts

interface WidgetProps {
  id: string;                           // Unique instance ID (nanoid)
  config: Record<string, unknown>;      // Widget-specific configuration
  size: { w: number; h: number };       // Current grid size in columns/rows
  isPreview?: boolean;                  // True when rendering in WidgetPicker preview
  onConfigChange: (config: Record<string, unknown>) => void;
}
```

### Widget Data Model

```typescript
type WidgetType =
  | 'clock' | 'date' | 'calendar' | 'weather'
  | 'countdown' | 'quote'              // FREE
  | 'youtube' | 'music' | 'stocks'
  | 'iframe' | 'photo-frame'
  | 'pomodoro';                         // PREMIUM

type WidgetTier = 'free' | 'premium';

interface Widget {
  id:        string;                    // nanoid
  type:      WidgetType;
  title:     string;
  tier:      WidgetTier;
  config:    Record<string, unknown>;
  position:  { x: number; y: number };
  size:      { w: number; h: number };
}
```

Position and size are stored separately from the widget data and merged into react-grid-layout's `{ i, x, y, w, h }` format at render time. See `architecture/layout-engine.md`.

### WidgetRegistryEntry

```typescript
// src/lib/widgetRegistry.ts

interface WidgetRegistryEntry {
  type:          WidgetType;
  displayName:   string;                // Human-readable name for UI
  description:   string;                // One-line description for WidgetPicker
  tier:          WidgetTier;            // 'free' or 'premium'
  icon:          string;                // Emoji or icon identifier
  component:     React.LazyExoticComponent<React.ComponentType<WidgetProps>>;
  defaultConfig: Record<string, unknown>;
  defaultSize:   { w: number; h: number };
  minSize:       { w: number; h: number };
  maxIframes?:   number;               // For iframe-based widgets (max 8 total)
}
```

---

## 2. Static Widget Registry

The registry is a plain TypeScript `Map` (or `Record`) keyed by `WidgetType`. Every widget component is lazy-loaded via `React.lazy()` to enable code splitting.

### Registry Implementation

```typescript
// src/lib/widgetRegistry.ts

import React from 'react';

const widgetRegistry: Record<WidgetType, WidgetRegistryEntry> = {
  clock: {
    type: 'clock',
    displayName: 'Clock',
    description: 'Digital or analog clock with multiple styles',
    tier: 'free',
    icon: '\u{1F552}',
    component: React.lazy(() => import('@/components/widgets/ClockWidget')),
    defaultConfig: { style: 'minimal-digital', format: '12h', showSeconds: true },
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 2, h: 2 },
  },
  date: {
    type: 'date',
    displayName: 'Date',
    description: 'Current date with day of week',
    tier: 'free',
    icon: '\u{1F4C5}',
    component: React.lazy(() => import('@/components/widgets/DateWidget')),
    defaultConfig: { format: 'long' },
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 1 },
  },
  calendar: {
    type: 'calendar',
    displayName: 'Calendar',
    description: 'Month view or Google Calendar embed',
    tier: 'free',
    icon: '\u{1F4C6}',
    component: React.lazy(() => import('@/components/widgets/CalendarWidget')),
    defaultConfig: { source: 'built-in' },
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 2 },
    maxIframes: 1,
  },
  weather: {
    type: 'weather',
    displayName: 'Weather',
    description: 'Current conditions and forecast via Open-Meteo',
    tier: 'free',
    icon: '\u{26C5}',
    component: React.lazy(() => import('@/components/widgets/WeatherWidget')),
    defaultConfig: { latitude: 40.7128, longitude: -74.0060, units: 'fahrenheit', pollInterval: 900000 },
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 3, h: 2 },
  },
  countdown: {
    type: 'countdown',
    displayName: 'Countdown',
    description: 'Timer counting down to a target date',
    tier: 'free',
    icon: '\u{23F3}',
    component: React.lazy(() => import('@/components/widgets/CountdownWidget')),
    defaultConfig: { targetDate: '', label: 'Countdown' },
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  quote: {
    type: 'quote',
    displayName: 'Quote',
    description: 'Inspirational quote display',
    tier: 'free',
    icon: '\u{1F4AC}',
    component: React.lazy(() => import('@/components/widgets/QuoteWidget')),
    defaultConfig: { category: 'inspirational', refreshInterval: 3600000 },
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 2 },
  },
  youtube: {
    type: 'youtube',
    displayName: 'YouTube',
    description: 'Embed YouTube videos',
    tier: 'premium',
    icon: '\u{25B6}\u{FE0F}',
    component: React.lazy(() => import('@/components/widgets/YouTubeWidget')),
    defaultConfig: { videoUrl: '', autoplay: false, loop: false },
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 2 },
    maxIframes: 1,
  },
  music: {
    type: 'music',
    displayName: 'Music',
    description: 'Spotify embed player',
    tier: 'premium',
    icon: '\u{1F3B5}',
    component: React.lazy(() => import('@/components/widgets/MusicWidget')),
    defaultConfig: { spotifyUrl: '', theme: 'dark' },
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 3, h: 2 },
    maxIframes: 1,
  },
  stocks: {
    type: 'stocks',
    displayName: 'Stocks',
    description: 'TradingView stock/crypto charts',
    tier: 'premium',
    icon: '\u{1F4C8}',
    component: React.lazy(() => import('@/components/widgets/StocksWidget')),
    defaultConfig: { symbols: ['AAPL', 'GOOGL'], chartType: 'mini', pollInterval: 60000 },
    defaultSize: { w: 8, h: 2 },
    minSize: { w: 4, h: 2 },
    maxIframes: 1,
  },
  iframe: {
    type: 'iframe',
    displayName: 'Custom Iframe',
    description: 'Embed any whitelisted website',
    tier: 'premium',
    icon: '\u{1F310}',
    component: React.lazy(() => import('@/components/widgets/IframeWidget')),
    defaultConfig: { url: '', title: 'Custom Widget' },
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 2 },
    maxIframes: 1,
  },
  'photo-frame': {
    type: 'photo-frame',
    displayName: 'Photo Frame',
    description: 'Rotating photo slideshow',
    tier: 'premium',
    icon: '\u{1F5BC}\u{FE0F}',
    component: React.lazy(() => import('@/components/widgets/PhotoFrameWidget')),
    defaultConfig: { photos: [], interval: 10000, transition: 'fade' },
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 2 },
  },
  pomodoro: {
    type: 'pomodoro',
    displayName: 'Pomodoro',
    description: 'Focus timer with work/break cycles',
    tier: 'premium',
    icon: '\u{1F345}',
    component: React.lazy(() => import('@/components/widgets/PomodoroWidget')),
    defaultConfig: { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 },
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 3, h: 2 },
  },
};

export default widgetRegistry;
```

### Adding a New Widget

1. Create `src/components/widgets/MyNewWidget.tsx` implementing `WidgetProps`
2. Add the new `WidgetType` literal to the union type
3. Add one entry to `widgetRegistry`
4. The widget is immediately available in WidgetPicker and can be placed on any Space

No other files need modification. The DashboardGrid, WidgetContainer, and WidgetPicker all read from the registry dynamically.

---

## 3. Widget Lifecycle

Every widget follows a strict lifecycle. Each phase has clear entry/exit conditions.

```
Mount --> Show Skeleton --> Fetch Data --> Render --> Poll (interval) --> Unmount (cleanup)
```

### Phase Details

| Phase | Trigger | Action | Exit Condition |
|-------|---------|--------|----------------|
| **Mount** | Widget enters viewport / Space activates | React mounts the component inside `WidgetContainer` | Component mounted |
| **Skeleton** | Component mounted, no data yet | Show shimmer skeleton matching widget dimensions | Data fetched or timeout |
| **Fetch** | Skeleton visible | Widget calls its data source (API, local computation, iframe load) | Data received or error |
| **Render** | Data available | Replace skeleton with widget content via crossfade | Widget visible |
| **Poll** | Render complete, `pollInterval` configured | `setInterval` calls fetch again at configured interval | Widget unmounts |
| **Unmount** | Space switches, widget removed, app closes | Clear intervals, abort pending fetches, clean up event listeners | Component unmounted |

### Polling Intervals (from constants)

| Widget | Interval | Constant |
|--------|----------|----------|
| Clock | 1,000 ms | Driven by `requestAnimationFrame` or `setInterval` |
| Weather | 900,000 ms (15 min) | `POLLING_WEATHER_MS` |
| Stocks | 60,000 ms (1 min, configurable 1-5 min) | `POLLING_STOCKS_MS` |
| Calendar | 300,000 ms (5 min) | `POLLING_CALENDAR_MS` |

### Implementation Pattern

```typescript
// Inside a widget component
function WeatherWidget({ id, config, size, onConfigChange }: WidgetProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchWeather() {
      try {
        const res = await fetch(buildWeatherUrl(config), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, config.pollInterval as number);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [config]);

  if (isLoading) return <WidgetSkeleton size={size} />;
  if (error) return <WidgetError error={error} onRetry={() => setIsLoading(true)} />;
  return <WeatherDisplay data={data} config={config} />;
}
```

---

## 4. Error Boundary Per Widget

Each widget is wrapped in an `ErrorBoundary` component inside the `WidgetContainer`. A crash in one widget never takes down the dashboard or other widgets.

### ErrorBoundary Specification

```typescript
// src/components/dashboard/WidgetErrorBoundary.tsx

interface WidgetErrorBoundaryProps {
  widgetId: string;
  widgetType: WidgetType;
  children: React.ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[Widget ${this.props.widgetType}:${this.props.widgetId}]`,
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          widgetType={this.props.widgetType}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
```

### Error Fallback UI

The `WidgetErrorFallback` component shows:
- Widget type icon and name (from registry)
- Error message (sanitized, no stack traces in production)
- "Retry" button that resets the error boundary and re-mounts the widget
- Styled to match the widget's allocated grid space (no layout shift)

---

## 5. WidgetContainer

The `WidgetContainer` is the wrapper component that sits between the grid layout and the actual widget. It composes the error boundary, suspense boundary, premium gate, and loading skeleton.

```typescript
// src/components/dashboard/WidgetContainer.tsx

function WidgetContainer({ widget }: { widget: Widget }) {
  const registryEntry = widgetRegistry[widget.type];
  const canAccess = canAccessFeature(widget.tier);
  const Component = registryEntry.component;

  return (
    <div
      className="widget-container"
      style={{ contain: 'layout style paint' }}
    >
      {!canAccess ? (
        <PremiumGate
          widgetType={widget.type}
          displayName={registryEntry.displayName}
          description={registryEntry.description}
        />
      ) : (
        <WidgetErrorBoundary
          widgetId={widget.id}
          widgetType={widget.type}
        >
          <React.Suspense fallback={<WidgetSkeleton size={widget.size} />}>
            <Component
              id={widget.id}
              config={widget.config}
              size={widget.size}
              onConfigChange={(config) =>
                widgetStore.getState().updateWidgetConfig(widget.id, config)
              }
            />
          </React.Suspense>
        </WidgetErrorBoundary>
      )}
    </div>
  );
}
```

### CSS Requirements

Every `.widget-container` element must have:
- `contain: layout style paint` -- performance isolation so one widget's reflow/repaint does not affect others
- `overflow: hidden` -- prevent content from leaking outside the grid cell
- `border-radius` matching the design system (e.g., `0.75rem`)
- `background: var(--bg-secondary)` -- visible during skeleton/loading state

---

## 6. Loading States (Shimmer Skeleton)

Every widget shows a shimmer skeleton during the Skeleton lifecycle phase. The skeleton must match the widget's allocated grid dimensions to prevent layout shift.

### Skeleton Implementation

```typescript
// src/components/dashboard/WidgetSkeleton.tsx

function WidgetSkeleton({ size }: { size: { w: number; h: number } }) {
  return (
    <div className="widget-skeleton animate-pulse w-full h-full">
      <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/3 mb-3" />
      <div className="h-3 bg-[var(--bg-tertiary)] rounded w-2/3 mb-2" />
      <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2" />
    </div>
  );
}
```

The shimmer animation uses Tailwind's `animate-pulse` class with customized colors matching the theme tokens. The skeleton fills the entire widget container (100% width and height) so there is no layout shift when the real content renders.

---

## 7. Iframe Sandboxing Rules

Widgets that embed third-party content via iframes must follow strict sandboxing rules. See `architecture/integrations.md` for per-service details.

### Base Sandbox Attribute

All iframes receive at minimum:

```html
<iframe
  sandbox="allow-scripts allow-same-origin"
  loading="lazy"
  referrerpolicy="no-referrer"
/>
```

### Per-Widget Sandbox Extensions

| Widget | Additional Sandbox Permissions | Reason |
|--------|-------------------------------|--------|
| YouTube | `allow-popups allow-presentation` | Fullscreen playback, external links |
| Music (Spotify) | `allow-popups` | External Spotify links |
| Stocks (TradingView) | `allow-popups` | External TradingView links |
| Calendar (Google) | `allow-popups` | External Google Calendar links |
| Custom Iframe | `allow-popups` | User-configured content may need popups |

### Forbidden Sandbox Permissions

Never include these permissions in any widget iframe:
- `allow-top-navigation` -- prevents iframe from redirecting the dashboard
- `allow-top-navigation-by-user-activation` -- same reason
- `allow-modals` -- prevents alert/confirm/prompt dialogs from iframes
- `allow-downloads` -- prevents silent file downloads

### Iframe Count Enforcement

Maximum 8 simultaneous iframes across all rendered widgets in a single Space. The `DashboardGrid` component tracks active iframe count. When adding a new iframe-based widget would exceed this limit, show a warning toast: "Maximum active widgets reached. Remove an existing widget to add this one."

Check `maxIframes` on the registry entry to determine if a widget uses iframes. Sum all active iframe-based widgets before allowing placement.

### CSP Frame-Src

All iframe sources must be whitelisted in the Content Security Policy:

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

---

## 8. Widget Config Interface Patterns

Each widget type defines its own configuration shape. Configs are stored as `Record<string, unknown>` in the Widget data model for flexibility, but each widget component casts to its specific typed config internally.

### Config Type Definitions

```typescript
// src/types/widgetConfigs.ts

interface ClockConfig {
  style: 'minimal-digital' | 'analog' | 'flip' | 'word' | 'binary';
  format: '12h' | '24h';
  showSeconds: boolean;
}

interface DateConfig {
  format: 'long' | 'short' | 'relative';
}

interface CalendarConfig {
  source: 'built-in' | 'google';
  googleCalendarUrl?: string;
}

interface WeatherConfig {
  latitude: number;
  longitude: number;
  units: 'fahrenheit' | 'celsius';
  pollInterval: number;
}

interface CountdownConfig {
  targetDate: string;     // ISO 8601 date string
  label: string;
}

interface QuoteConfig {
  category: 'inspirational' | 'motivational' | 'tech' | 'random';
  refreshInterval: number;
}

interface YouTubeConfig {
  videoUrl: string;
  autoplay: false;        // Always false per behavioral rules
  loop: boolean;
}

interface MusicConfig {
  spotifyUrl: string;
  theme: 'dark' | 'light';
}

interface StocksConfig {
  symbols: string[];
  chartType: 'mini' | 'advanced' | 'ticker-tape';
  pollInterval: number;
}

interface IframeConfig {
  url: string;
  title: string;
}

interface PhotoFrameConfig {
  photos: string[];       // Array of image URLs or data URIs
  interval: number;       // Slideshow interval in ms
  transition: 'fade' | 'slide' | 'none';
}

interface PomodoroConfig {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}
```

### Config Usage Inside Widgets

Widgets cast the generic config to their typed version:

```typescript
function ClockWidget({ config, ...props }: WidgetProps) {
  const clockConfig = config as ClockConfig;
  // Use clockConfig.style, clockConfig.format, etc.
}
```

### Config Validation

When a widget receives config, it should merge with defaults from the registry entry to handle missing or outdated fields:

```typescript
const effectiveConfig = {
  ...widgetRegistry[widget.type].defaultConfig,
  ...widget.config,
} as ClockConfig;
```

This ensures forward compatibility when new config fields are added in future versions.

---

## 9. File Structure

```
src/
  components/
    dashboard/
      WidgetContainer.tsx       # Wraps each widget with error boundary + suspense + premium gate
      WidgetErrorBoundary.tsx   # Class component error boundary
      WidgetErrorFallback.tsx   # Error UI with retry button
      WidgetSkeleton.tsx        # Shimmer loading skeleton
    widgets/
      ClockWidget.tsx
      DateWidget.tsx
      CalendarWidget.tsx
      WeatherWidget.tsx
      CountdownWidget.tsx
      QuoteWidget.tsx
      YouTubeWidget.tsx
      MusicWidget.tsx
      StocksWidget.tsx
      IframeWidget.tsx
      PhotoFrameWidget.tsx
      PomodoroWidget.tsx
  lib/
    widgetRegistry.ts           # Static registry map
  types/
    widget.ts                   # Widget, WidgetType, WidgetTier, WidgetProps
    widgetConfigs.ts            # Per-widget config interfaces
```

---

## 10. Behavioral Rules

1. **No autoplay** -- Audio and video must never autoplay without explicit user action. YouTube `autoplay` config is always `false`.
2. **Lazy iframes** -- All iframes use `loading="lazy"` to defer loading until the widget is near the viewport.
3. **Performance isolation** -- Every widget container uses `contain: layout style paint` to prevent cross-widget reflow cascades.
4. **Graceful degradation** -- If a widget's data source is unavailable, show the last cached value with a staleness indicator. If no cache exists, show a friendly error with retry.
5. **Timeout limits** -- Iframe widgets: 10-second load timeout. API widgets: 5-second fetch timeout. On timeout, show error fallback with retry.
6. **No data leakage** -- Widget data stays on-device. No analytics, telemetry, or external logging from widgets.
