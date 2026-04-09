import { describe, it, expect } from 'vitest';
import { widgetRegistry, getRegistryEntry, getWidgetsByTier } from '../widgetRegistry';
import { FREE_WIDGET_TYPES, PREMIUM_WIDGET_TYPES } from '../constants';
import type { WidgetType } from '@/types';

const allWidgetTypes: WidgetType[] = Object.keys(widgetRegistry) as WidgetType[];

describe('widgetRegistry', () => {
  it('contains all widget types defined in constants', () => {
    const allConstantTypes = [...FREE_WIDGET_TYPES, ...PREMIUM_WIDGET_TYPES];
    for (const type of allConstantTypes) {
      expect(widgetRegistry).toHaveProperty(type);
    }
  });

  it('has an entry for every WidgetType key', () => {
    expect(allWidgetTypes.length).toBeGreaterThan(0);
    for (const type of allWidgetTypes) {
      expect(widgetRegistry[type]).toBeDefined();
    }
  });

  it.each(allWidgetTypes)('entry "%s" has all required fields', (type) => {
    const entry = widgetRegistry[type];
    expect(entry).toHaveProperty('type', type);
    expect(typeof entry.displayName).toBe('string');
    expect(entry.displayName.length).toBeGreaterThan(0);
    expect(['free', 'premium']).toContain(entry.tier);
    expect(entry.component).toBeDefined();
    expect(entry.defaultConfig).toBeDefined();
    expect(typeof entry.defaultConfig).toBe('object');
    expect(entry.defaultSize).toHaveProperty('w');
    expect(entry.defaultSize).toHaveProperty('h');
    expect(entry.minSize).toHaveProperty('w');
    expect(entry.minSize).toHaveProperty('h');
  });

  describe('getRegistryEntry()', () => {
    it('returns the correct entry for "clock"', () => {
      const entry = getRegistryEntry('clock');
      expect(entry.type).toBe('clock');
      expect(entry.displayName).toBe('Clock');
      expect(entry.tier).toBe('free');
    });

    it('returns the correct entry for "youtube"', () => {
      const entry = getRegistryEntry('youtube');
      expect(entry.type).toBe('youtube');
      expect(entry.displayName).toBe('YouTube');
      expect(entry.tier).toBe('premium');
    });

    it('returns correct entry for every widget type', () => {
      for (const type of allWidgetTypes) {
        const entry = getRegistryEntry(type);
        expect(entry.type).toBe(type);
      }
    });
  });

  describe('getWidgetsByTier()', () => {
    it('returns only free widgets for tier "free"', () => {
      const freeWidgets = getWidgetsByTier('free');
      expect(freeWidgets.length).toBeGreaterThan(0);
      for (const widget of freeWidgets) {
        expect(widget.tier).toBe('free');
      }
    });

    it('returns only premium widgets for tier "premium"', () => {
      const premiumWidgets = getWidgetsByTier('premium');
      expect(premiumWidgets.length).toBeGreaterThan(0);
      for (const widget of premiumWidgets) {
        expect(widget.tier).toBe('premium');
      }
    });

    it('free widget count matches FREE_WIDGET_TYPES length', () => {
      const freeWidgets = getWidgetsByTier('free');
      expect(freeWidgets.length).toBe(FREE_WIDGET_TYPES.length);
    });

    it('premium widget count matches PREMIUM_WIDGET_TYPES length', () => {
      const premiumWidgets = getWidgetsByTier('premium');
      expect(premiumWidgets.length).toBe(PREMIUM_WIDGET_TYPES.length);
    });
  });
});
