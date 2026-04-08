# GlowDeck -- Grid & Spaces SOP

## Overview

GlowDeck uses a 12-column grid system powered by `react-grid-layout` (RGL). The dashboard is organized into Spaces (profiles), each containing a set of widgets with independently stored positions and sizes. The grid is landscape-first, OLED-optimized, and includes burn-in protection for always-on display scenarios.

---

## 1. react-grid-layout Configuration

### Grid Parameters

```typescript
// src/lib/constants.ts

const GRID_COLS = 12;
const GRID_MARGIN: [number, number] = [8, 8];
const GRID_PADDING: [number, number] = [8, 8];
const GRID_ROWS = 6;                        // Logical rows for default layouts
const HEADER_HEIGHT = 48;                    // SpaceSwitcher tab bar height in px

// Calculated at runtime:
// rowHeight = Math.floor((window.innerHeight - HEADER_HEIGHT) / GRID_ROWS)
```

### GridConfig Interface

```typescript
interface GridConfig {
  cols:      12;                              // Fixed, never changes
  rowHeight: number;                         // Calculated from viewport
  margin:    [number, number];               // [8, 8] horizontal/vertical gap
  padding:   [number, number];               // [8, 8] container padding
}
```

### Runtime Row Height Calculation

```typescript
function calculateRowHeight(): number {
  const viewportHeight = window.innerHeight;
  return Math.floor((viewportHeight - HEADER_HEIGHT) / GRID_ROWS);
}
```

Row height recalculates on window resize (debounced 200ms). This ensures widgets fill the viewport in landscape orientation without scroll.

### DashboardGrid Component Props

```typescript
<ReactGridLayout
  className="dashboard-grid"
  cols={12}
  rowHeight={rowHeight}
  margin={[8, 8]}
  containerPadding={[8, 8]}
  layout={rglLayout}
  onLayoutChange={handleLayoutChange}
  isDraggable={isPremium}
  isResizable={isPremium}
  compactType={null}
  preventCollision={true}
  useCSSTransforms={true}
>
  {widgets.map((widget) => (
    <div key={widget.id}>
      <WidgetContainer widget={widget} />
    </div>
  ))}
</ReactGridLayout>
```

Key RGL props:
- `compactType={null}` -- Disable auto-compaction. Widgets stay where the user (or default layout) places them.
- `preventCollision={true}` -- Prevent widgets from overlapping during drag/resize.
- `useCSSTransforms={true}` -- Use CSS transforms instead of top/left for GPU-accelerated positioning.
- `isDraggable` / `isResizable` -- Controlled by premium status (see Section 6).

---

## 2. Responsive Breakpoints

GlowDeck is landscape-first but must degrade gracefully on smaller screens.

| Breakpoint | Width Range | Columns | Behavior |
|------------|-------------|---------|----------|
| **Desktop** | 1200px+ | 12 | Full grid, default layout |
| **Tablet** | 768--1199px | 8 | Widgets reflow to 8 columns, some stack vertically |
| **Phone** | 480--767px | 4 | Single-column stacking, simplified widgets |

### Responsive Implementation

Use `react-grid-layout`'s `ResponsiveGridLayout` (aliased as `ResponsiveReactGridLayout`) with per-breakpoint layouts:

```typescript
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { desktop: 1200, tablet: 768, phone: 480 };
const cols = { desktop: 12, tablet: 8, phone: 4 };

<ResponsiveGridLayout
  breakpoints={breakpoints}
  cols={cols}
  rowHeight={rowHeight}
  margin={[8, 8]}
  containerPadding={[8, 8]}
  layouts={responsiveLayouts}
  onLayoutChange={handleLayoutChange}
  isDraggable={isPremium}
  isResizable={isPremium}
  compactType={null}
  preventCollision={true}
>
  {/* widgets */}
</ResponsiveGridLayout>
```

### Responsive Layout Generation

For default Spaces, responsive layouts are derived from the desktop layout by scaling down:

```typescript
function deriveTabletLayout(desktopLayout: RGLLayout[]): RGLLayout[] {
  return desktopLayout.map((item) => ({
    ...item,
    x: Math.floor(item.x * (8 / 12)),
    w: Math.max(Math.floor(item.w * (8 / 12)), 2),
  }));
}

function derivePhoneLayout(desktopLayout: RGLLayout[]): RGLLayout[] {
  return desktopLayout.map((item, index) => ({
    ...item,
    x: 0,
    y: index * 2,
    w: 4,
    h: 2,
  }));
}
```

---

## 3. Default Spaces

Three default Spaces ship with GlowDeck. Each is preconfigured with widget arrays matching the blueprint design spec. Default Spaces have `isDefault: true` and cannot be deleted.

### Home (Relaxed Ambient Display)

```typescript
const homeSpace: Space = {
  id: 'space-home',
  name: 'Home',
  icon: '\u{1F3E0}',
  isDefault: true,
  createdAt: 0,
  gridConfig: { cols: 12, rowHeight: 0, margin: [8, 8], padding: [8, 8] },
  widgets: [
    { id: 'home-clock',    type: 'clock',    title: 'Clock',    tier: 'free',    config: { style: 'minimal-digital', format: '12h', showSeconds: true }, position: { x: 0, y: 0 },  size: { w: 6, h: 4 } },
    { id: 'home-weather',  type: 'weather',  title: 'Weather',  tier: 'free',    config: { latitude: 40.7128, longitude: -74.0060, units: 'fahrenheit', pollInterval: 900000 }, position: { x: 6, y: 0 },  size: { w: 6, h: 2 } },
    { id: 'home-calendar', type: 'calendar', title: 'Calendar', tier: 'free',    config: { source: 'built-in' }, position: { x: 6, y: 2 },  size: { w: 6, h: 2 } },
    { id: 'home-youtube',  type: 'youtube',  title: 'YouTube',  tier: 'premium', config: { videoUrl: '', autoplay: false, loop: false }, position: { x: 0, y: 4 },  size: { w: 6, h: 2 } },
    { id: 'home-music',    type: 'music',    title: 'Music',    tier: 'premium', config: { spotifyUrl: '', theme: 'dark' }, position: { x: 6, y: 4 },  size: { w: 6, h: 2 } },
  ],
};
```

### Work (Productivity Cockpit)

```typescript
const workSpace: Space = {
  id: 'space-work',
  name: 'Work',
  icon: '\u{1F4BC}',
  isDefault: true,
  createdAt: 0,
  gridConfig: { cols: 12, rowHeight: 0, margin: [8, 8], padding: [8, 8] },
  widgets: [
    { id: 'work-clock',    type: 'clock',    title: 'Clock',    tier: 'free',    config: { style: 'minimal-digital', format: '12h', showSeconds: true }, position: { x: 0, y: 0 },  size: { w: 4, h: 2 } },
    { id: 'work-weather',  type: 'weather',  title: 'Weather',  tier: 'free',    config: { latitude: 40.7128, longitude: -74.0060, units: 'fahrenheit', pollInterval: 900000 }, position: { x: 4, y: 0 },  size: { w: 4, h: 2 } },
    { id: 'work-calendar', type: 'calendar', title: 'Calendar', tier: 'free',    config: { source: 'built-in' }, position: { x: 8, y: 0 },  size: { w: 4, h: 4 } },
    { id: 'work-stocks',   type: 'stocks',   title: 'Stocks',   tier: 'premium', config: { symbols: ['AAPL', 'GOOGL'], chartType: 'mini', pollInterval: 60000 }, position: { x: 0, y: 2 },  size: { w: 8, h: 2 } },
    { id: 'work-pomodoro', type: 'pomodoro', title: 'Pomodoro', tier: 'premium', config: { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 }, position: { x: 0, y: 4 },  size: { w: 4, h: 2 } },
    { id: 'work-iframe',   type: 'iframe',   title: 'Custom',   tier: 'premium', config: { url: '', title: 'Custom Widget' }, position: { x: 4, y: 4 },  size: { w: 8, h: 2 } },
  ],
};
```

### Focus (Minimal Distraction-Free)

```typescript
const focusSpace: Space = {
  id: 'space-focus',
  name: 'Focus',
  icon: '\u{1F3AF}',
  isDefault: true,
  createdAt: 0,
  gridConfig: { cols: 12, rowHeight: 0, margin: [8, 8], padding: [8, 8] },
  widgets: [
    { id: 'focus-clock',    type: 'clock',    title: 'Clock',    tier: 'free',    config: { style: 'minimal-digital', format: '12h', showSeconds: true }, position: { x: 0, y: 0 },  size: { w: 8, h: 4 } },
    { id: 'focus-quote',    type: 'quote',    title: 'Quote',    tier: 'free',    config: { category: 'inspirational', refreshInterval: 3600000 }, position: { x: 8, y: 0 },  size: { w: 4, h: 4 } },
    { id: 'focus-pomodoro', type: 'pomodoro', title: 'Pomodoro', tier: 'premium', config: { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 }, position: { x: 0, y: 4 },  size: { w: 6, h: 2 } },
    { id: 'focus-music',    type: 'music',    title: 'Music',    tier: 'premium', config: { spotifyUrl: '', theme: 'dark' }, position: { x: 6, y: 4 },  size: { w: 6, h: 2 } },
  ],
};
```

### Layout Principle

Free widgets fill the top 2/3 of the grid (rows 1-4) and are usable immediately. Premium widgets occupy the bottom 1/3 (rows 5-6) and appear as blurred soft-upsell cards with a PRO badge. During the 21-day trial, all widgets are fully unlocked. Premium users can rearrange everything via drag and resize.

---

## 4. Widget Position/Size Storage

Widget positions and sizes are stored as separate properties on the `Widget` object, not in RGL format. This decouples data storage from the layout library.

### Storage Format

```typescript
interface Widget {
  // ...other fields
  position: { x: number; y: number };   // Grid column, grid row
  size:     { w: number; h: number };    // Width in columns, height in rows
}
```

### Merge to RGL Format at Render

When rendering the grid, merge widget data into RGL's layout format:

```typescript
function widgetsToRGLLayout(widgets: Widget[]): RGLLayoutItem[] {
  return widgets.map((widget) => ({
    i: widget.id,                         // RGL uses 'i' as the unique key
    x: widget.position.x,
    y: widget.position.y,
    w: widget.size.w,
    h: widget.size.h,
    minW: widgetRegistry[widget.type].minSize.w,
    minH: widgetRegistry[widget.type].minSize.h,
    static: !canAccessFeature('premium'), // Free users cannot move widgets
  }));
}
```

### Persist RGL Changes Back to Widget Store

When the user drags or resizes a widget (premium only), RGL fires `onLayoutChange`. Convert back to the storage format:

```typescript
function handleLayoutChange(newLayout: RGLLayoutItem[]) {
  const { updateWidgetPosition, updateWidgetSize } = widgetStore.getState();
  newLayout.forEach((item) => {
    updateWidgetPosition(item.i, { x: item.x, y: item.y });
    updateWidgetSize(item.i, { w: item.w, h: item.h });
  });
}
```

This write is debounced at 500ms by the Zustand persistence middleware (see `architecture/state-management.md`).

---

## 5. Space Switching

### Tab Bar

The `SpaceSwitcher` component renders a horizontal tab bar at the top of the dashboard. Each tab shows the Space's icon and name. The active Space is highlighted.

```
[Home icon] Home  |  [Work icon] Work  |  [Focus icon] Focus  |  [+ New Space (PRO)]
```

### Switching Logic

```typescript
function switchSpace(spaceId: string) {
  // 1. Persist the new active space
  preferenceStore.getState().setActiveSpaceId(spaceId);

  // 2. Layout store loads the new space's widgets
  layoutStore.getState().setActiveSpace(spaceId);

  // 3. All current widgets unmount, new space's widgets mount
  //    (React handles this via key change on DashboardGrid)
}
```

### Keyboard Shortcut

- `Ctrl+1` / `Cmd+1` -- Switch to Space 1 (Home)
- `Ctrl+2` / `Cmd+2` -- Switch to Space 2 (Work)
- `Ctrl+3` / `Cmd+3` -- Switch to Space 3 (Focus)
- `Ctrl+N` / `Cmd+N` -- Create new Space (premium only)

### Custom Spaces (Premium)

Premium users can create additional Spaces beyond the 3 defaults. Custom Spaces start empty and the user adds widgets from the WidgetPicker. Custom Spaces can be renamed, reordered, and deleted. Default Spaces cannot be deleted.

---

## 6. Drag & Resize (Premium Only)

### Free Users

All layout items have `static: true` in the RGL layout. This prevents drag and resize interactions. The cursor does not show drag handles. The grid is read-only.

### Premium/Trial Users

Layout items have `static: false`. Drag handles appear on hover. Resize handles appear at the bottom-right corner of each widget. Changes persist to IndexedDB via the widget store.

### Implementation

```typescript
const isPremium = canAccessFeature('premium');

// When generating RGL layout items:
const layoutItem = {
  i: widget.id,
  x: widget.position.x,
  y: widget.position.y,
  w: widget.size.w,
  h: widget.size.h,
  static: !isPremium,   // <-- this is the gate
};
```

---

## 7. Burn-In Protection

For always-on displays (especially OLED), static content causes burn-in over time. GlowDeck applies a subtle pixel shift to the entire dashboard wrapper.

### Specification

| Parameter | Value | Constant |
|-----------|-------|----------|
| Shift magnitude | 1-2 pixels | `BURN_IN_SHIFT_PX = 2` |
| Shift interval | Every 60 seconds | `BURN_IN_INTERVAL_MS = 60_000` |
| Method | CSS `transform: translate(Xpx, Ypx)` on outer wrapper | -- |
| Direction | Random within range [-2px, +2px] on both axes | -- |
| Transition | `transition: transform 2s ease-in-out` | Slow enough to be imperceptible |

### Implementation

```typescript
// src/hooks/useBurnInProtection.ts

function useBurnInProtection(enabled: boolean) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

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

### Usage

```tsx
// src/components/dashboard/BurnInProtection.tsx

function BurnInProtection({ children }: { children: React.ReactNode }) {
  const burnInEnabled = usePreferenceStore((s) => s.burnInProtection);
  const offset = useBurnInProtection(burnInEnabled);

  return (
    <div
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 2s ease-in-out',
      }}
    >
      {children}
    </div>
  );
}
```

The `BurnInProtection` wrapper sits around the entire dashboard (including the SpaceSwitcher and DashboardGrid) in the component tree. The user can toggle burn-in protection on/off in Settings. Default: enabled.

---

## 8. Component Tree (Layout Context)

```
App (layout.tsx)
  BurnInProtection
    SpaceSwitcher (tab bar -- Home | Work | Focus)
    DashboardGrid (ResponsiveReactGridLayout)
      WidgetContainer (per widget)
        ErrorBoundary
          Suspense (skeleton fallback)
            WidgetComponent (lazy-loaded)
          PremiumGate (if locked)
```

---

## 9. File Structure

```
src/
  components/
    dashboard/
      DashboardGrid.tsx           # ResponsiveReactGridLayout wrapper
      SpaceSwitcher.tsx           # Tab bar for Space navigation
      BurnInProtection.tsx        # Pixel-shift wrapper
      WidgetContainer.tsx         # Error boundary + suspense + premium gate
  hooks/
    useBurnInProtection.ts        # Pixel-shift interval hook
  lib/
    constants.ts                  # Grid constants, breakpoints, intervals
    defaultSpaces.ts              # Home, Work, Focus Space definitions
  types/
    layout.ts                     # Space, GridConfig, RGLLayoutItem
```
