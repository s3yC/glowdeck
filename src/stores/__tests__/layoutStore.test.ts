import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Widget, Space } from '@/types';

// Mock the IDB storage with a simple synchronous in-memory store
vi.mock('@/lib/idb', () => ({
  createIDBStorage: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}));

let useLayoutStore: typeof import('../layoutStore').useLayoutStore;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../layoutStore');
  useLayoutStore = mod.useLayoutStore;
});

describe('layoutStore', () => {
  it('default state has 3 spaces (Home, Work, Focus)', () => {
    const { spaces } = useLayoutStore.getState();
    expect(spaces).toHaveLength(3);
    const names = spaces.map((s) => s.name);
    expect(names).toContain('Home');
    expect(names).toContain('Work');
    expect(names).toContain('Focus');
  });

  it('default active space is "home"', () => {
    expect(useLayoutStore.getState().activeSpaceId).toBe('home');
  });

  describe('setActiveSpace()', () => {
    it('changes active space', () => {
      useLayoutStore.getState().setActiveSpace('work');
      expect(useLayoutStore.getState().activeSpaceId).toBe('work');
    });
  });

  describe('addWidget()', () => {
    it('adds widget to the correct space', () => {
      const widget: Widget = {
        id: 'test-widget-1',
        type: 'clock',
        title: 'Test Clock',
        tier: 'free',
        config: { style: 'minimal-digital' },
        position: { x: 0, y: 0 },
        size: { w: 4, h: 2 },
      };

      const initialCount = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'home')!.widgets.length;

      useLayoutStore.getState().addWidget('home', widget);

      const homeSpace = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'home')!;
      expect(homeSpace.widgets).toHaveLength(initialCount + 1);
      expect(homeSpace.widgets.find((w) => w.id === 'test-widget-1')).toBeDefined();
    });

    it('does not affect other spaces', () => {
      const widget: Widget = {
        id: 'test-widget-2',
        type: 'clock',
        title: 'Test',
        tier: 'free',
        config: {},
        position: { x: 0, y: 0 },
        size: { w: 4, h: 2 },
      };

      const workCountBefore = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'work')!.widgets.length;

      useLayoutStore.getState().addWidget('home', widget);

      const workCountAfter = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'work')!.widgets.length;
      expect(workCountAfter).toBe(workCountBefore);
    });
  });

  describe('removeWidget()', () => {
    it('removes widget from space', () => {
      const homeWidgets = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'home')!.widgets;
      const firstWidgetId = homeWidgets[0].id;

      useLayoutStore.getState().removeWidget('home', firstWidgetId);

      const updatedWidgets = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'home')!.widgets;
      expect(updatedWidgets.find((w) => w.id === firstWidgetId)).toBeUndefined();
      expect(updatedWidgets).toHaveLength(homeWidgets.length - 1);
    });
  });

  describe('updateWidgetConfig()', () => {
    it('merges config correctly', () => {
      const homeWidgets = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'home')!.widgets;
      const clockWidget = homeWidgets.find((w) => w.type === 'clock')!;
      const originalConfig = { ...clockWidget.config };

      useLayoutStore
        .getState()
        .updateWidgetConfig('home', clockWidget.id, { format: '24h', newProp: 'value' });

      const updated = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'home')!
        .widgets.find((w) => w.id === clockWidget.id)!;

      // Original properties preserved
      expect(updated.config.style).toBe(originalConfig.style);
      // Updated property changed
      expect(updated.config.format).toBe('24h');
      // New property added
      expect(updated.config.newProp).toBe('value');
    });
  });

  describe('createSpace()', () => {
    it('adds a new space', () => {
      const newSpace: Space = {
        id: 'custom-1',
        name: 'Custom',
        icon: '🌟',
        widgets: [],
        gridConfig: { cols: 12, rowHeight: 120, margin: [8, 8], padding: [8, 8] },
        isDefault: false,
        createdAt: Date.now(),
      };

      useLayoutStore.getState().createSpace(newSpace);

      const { spaces } = useLayoutStore.getState();
      expect(spaces).toHaveLength(4);
      expect(spaces.find((s) => s.id === 'custom-1')).toBeDefined();
      expect(spaces.find((s) => s.id === 'custom-1')!.name).toBe('Custom');
    });
  });

  describe('deleteSpace()', () => {
    it('removes a non-default space', () => {
      // First add a non-default space
      const customSpace: Space = {
        id: 'deletable',
        name: 'Deletable',
        icon: '🗑️',
        widgets: [],
        gridConfig: { cols: 12, rowHeight: 120, margin: [8, 8], padding: [8, 8] },
        isDefault: false,
        createdAt: Date.now(),
      };

      useLayoutStore.getState().createSpace(customSpace);
      expect(useLayoutStore.getState().spaces).toHaveLength(4);

      useLayoutStore.getState().deleteSpace('deletable');
      expect(useLayoutStore.getState().spaces).toHaveLength(3);
      expect(
        useLayoutStore.getState().spaces.find((s) => s.id === 'deletable')
      ).toBeUndefined();
    });

    it('does not remove default spaces', () => {
      useLayoutStore.getState().deleteSpace('home');
      const homeSpace = useLayoutStore
        .getState()
        .spaces.find((s) => s.id === 'home');
      expect(homeSpace).toBeDefined();
    });

    it('resets activeSpaceId to "home" when deleting the active space', () => {
      const customSpace: Space = {
        id: 'temp-active',
        name: 'Temp',
        icon: '⚡',
        widgets: [],
        gridConfig: { cols: 12, rowHeight: 120, margin: [8, 8], padding: [8, 8] },
        isDefault: false,
        createdAt: Date.now(),
      };
      useLayoutStore.getState().createSpace(customSpace);
      useLayoutStore.getState().setActiveSpace('temp-active');
      expect(useLayoutStore.getState().activeSpaceId).toBe('temp-active');

      useLayoutStore.getState().deleteSpace('temp-active');
      expect(useLayoutStore.getState().activeSpaceId).toBe('home');
    });
  });
});
