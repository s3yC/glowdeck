import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Space, Widget, GridConfig } from '@/types';
import { createIDBStorage } from '@/lib/idb';
import { GRID_COLS, GRID_MARGIN, GRID_PADDING } from '@/lib/constants';

// ---------- Default grid config ----------

const defaultGridConfig: GridConfig = {
  cols: GRID_COLS,
  rowHeight: 120,
  margin: GRID_MARGIN,
  padding: GRID_PADDING,
};

// ---------- Default Spaces (Section 5 of the spec) ----------

const homeWidgets: Widget[] = [
  { id: 'home-clock',    type: 'clock',    title: 'Clock',    tier: 'free',    config: { style: 'minimal-digital', format: '12h', showSeconds: true }, position: { x: 0, y: 0 }, size: { w: 6, h: 4 } },
  { id: 'home-weather',  type: 'weather',  title: 'Weather',  tier: 'free',    config: { latitude: 40.7128, longitude: -74.006, units: 'fahrenheit', pollInterval: 900000 }, position: { x: 6, y: 0 }, size: { w: 6, h: 2 } },
  { id: 'home-calendar', type: 'calendar', title: 'Calendar', tier: 'free',    config: { source: 'built-in' }, position: { x: 6, y: 2 }, size: { w: 6, h: 2 } },
  { id: 'home-youtube',  type: 'youtube',  title: 'YouTube',  tier: 'premium', config: { videoUrl: '', autoplay: false, loop: false }, position: { x: 0, y: 4 }, size: { w: 6, h: 2 } },
  { id: 'home-music',    type: 'music',    title: 'Music',    tier: 'premium', config: { spotifyUrl: '', theme: 'dark' }, position: { x: 6, y: 4 }, size: { w: 6, h: 2 } },
];

const workWidgets: Widget[] = [
  { id: 'work-clock',    type: 'clock',    title: 'Clock',    tier: 'free',    config: { style: 'minimal-digital', format: '12h', showSeconds: true }, position: { x: 0, y: 0 }, size: { w: 4, h: 2 } },
  { id: 'work-weather',  type: 'weather',  title: 'Weather',  tier: 'free',    config: { latitude: 40.7128, longitude: -74.006, units: 'fahrenheit', pollInterval: 900000 }, position: { x: 4, y: 0 }, size: { w: 4, h: 2 } },
  { id: 'work-calendar', type: 'calendar', title: 'Calendar', tier: 'free',    config: { source: 'built-in' }, position: { x: 8, y: 0 }, size: { w: 4, h: 4 } },
  { id: 'work-stocks',   type: 'stocks',   title: 'Stocks',   tier: 'premium', config: { symbols: ['AAPL', 'GOOGL'], chartType: 'mini', pollInterval: 60000 }, position: { x: 0, y: 2 }, size: { w: 8, h: 2 } },
  { id: 'work-pomodoro', type: 'pomodoro', title: 'Pomodoro', tier: 'premium', config: { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 }, position: { x: 0, y: 4 }, size: { w: 4, h: 2 } },
  { id: 'work-countdown', type: 'countdown', title: 'Countdown', tier: 'free', config: { targetDate: '', label: 'Deadline' }, position: { x: 4, y: 4 }, size: { w: 8, h: 2 } },
];

const focusWidgets: Widget[] = [
  { id: 'focus-clock',    type: 'clock',    title: 'Clock',    tier: 'free',    config: { style: 'minimal-digital', format: '12h', showSeconds: true }, position: { x: 0, y: 0 }, size: { w: 8, h: 4 } },
  { id: 'focus-quote',    type: 'quote',    title: 'Quote',    tier: 'free',    config: { category: 'inspirational', refreshInterval: 3600000 }, position: { x: 8, y: 0 }, size: { w: 4, h: 4 } },
  { id: 'focus-pomodoro', type: 'pomodoro', title: 'Pomodoro', tier: 'premium', config: { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 }, position: { x: 0, y: 4 }, size: { w: 6, h: 2 } },
  { id: 'focus-music',    type: 'music',    title: 'Music',    tier: 'premium', config: { spotifyUrl: '', theme: 'dark' }, position: { x: 6, y: 4 }, size: { w: 6, h: 2 } },
];

// Exported so SpaceSwitcher can use it for "Reset to Default"
export const defaultWidgetsBySpaceId: Record<string, Widget[]> = {
  home: homeWidgets,
  work: workWidgets,
  focus: focusWidgets,
};

const defaultSpaces: Space[] = [
  {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    widgets: homeWidgets,
    gridConfig: defaultGridConfig,
    isDefault: true,
    createdAt: 0,
  },
  {
    id: 'work',
    name: 'Work',
    icon: '💼',
    widgets: workWidgets,
    gridConfig: defaultGridConfig,
    isDefault: true,
    createdAt: 0,
  },
  {
    id: 'focus',
    name: 'Focus',
    icon: '🎯',
    widgets: focusWidgets,
    gridConfig: defaultGridConfig,
    isDefault: true,
    createdAt: 0,
  },
];

// ---------- Store interface ----------

interface LayoutStore {
  spaces: Space[];
  activeSpaceId: string;

  // Space actions
  setActiveSpace: (spaceId: string) => void;
  createSpace: (space: Space) => void;
  deleteSpace: (spaceId: string) => void;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  getActiveSpace: () => Space | undefined;

  // Widget actions (merged from widgetStore)
  addWidget: (spaceId: string, widget: Widget) => void;
  removeWidget: (spaceId: string, widgetId: string) => void;
  updateWidgetConfig: (spaceId: string, widgetId: string, config: Record<string, unknown>) => void;
  updateWidgetPosition: (spaceId: string, widgetId: string, position: { x: number; y: number }) => void;
  updateWidgetSize: (spaceId: string, widgetId: string, size: { w: number; h: number }) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      spaces: defaultSpaces,
      activeSpaceId: 'home',

      // ---------- Space actions ----------

      setActiveSpace: (spaceId) => set({ activeSpaceId: spaceId }),

      createSpace: (space) =>
        set((state) => ({ spaces: [...state.spaces, space] })),

      deleteSpace: (spaceId) =>
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== spaceId || s.isDefault),
          activeSpaceId:
            state.activeSpaceId === spaceId ? 'home' : state.activeSpaceId,
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

      // ---------- Widget actions ----------

      addWidget: (spaceId, widget) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, widgets: [...s.widgets, widget] }
              : s
          ),
        })),

      removeWidget: (spaceId, widgetId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, widgets: s.widgets.filter((w) => w.id !== widgetId) }
              : s
          ),
        })),

      updateWidgetConfig: (spaceId, widgetId, config) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? {
                  ...s,
                  widgets: s.widgets.map((w) =>
                    w.id === widgetId
                      ? { ...w, config: { ...w.config, ...config } }
                      : w
                  ),
                }
              : s
          ),
        })),

      updateWidgetPosition: (spaceId, widgetId, position) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? {
                  ...s,
                  widgets: s.widgets.map((w) =>
                    w.id === widgetId ? { ...w, position } : w
                  ),
                }
              : s
          ),
        })),

      updateWidgetSize: (spaceId, widgetId, size) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? {
                  ...s,
                  widgets: s.widgets.map((w) =>
                    w.id === widgetId ? { ...w, size } : w
                  ),
                }
              : s
          ),
        })),
    }),
    {
      name: 'glowdeck-layouts',
      storage: createIDBStorage('glowdeck-layouts'),
    }
  )
);
