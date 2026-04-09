import { describe, it, expect } from 'vitest';
import {
  TRIAL_DURATION_DAYS,
  FREE_WIDGET_TYPES,
  PREMIUM_WIDGET_TYPES,
  MAX_IFRAMES,
} from '../constants';
import { widgetRegistry } from '../widgetRegistry';

describe('constants', () => {
  it('TRIAL_DURATION_DAYS is 21', () => {
    expect(TRIAL_DURATION_DAYS).toBe(21);
  });

  it('MAX_IFRAMES is 8', () => {
    expect(MAX_IFRAMES).toBe(8);
  });

  it('FREE_WIDGET_TYPES and PREMIUM_WIDGET_TYPES do not overlap', () => {
    const freeSet = new Set<string>(FREE_WIDGET_TYPES);
    for (const premiumType of PREMIUM_WIDGET_TYPES) {
      expect(freeSet.has(premiumType)).toBe(false);
    }
  });

  it('all widget types are covered (free + premium = all registry types)', () => {
    const allConstantTypes = new Set([...FREE_WIDGET_TYPES, ...PREMIUM_WIDGET_TYPES]);
    const allRegistryTypes = new Set(Object.keys(widgetRegistry));

    // Every registry type should be in constants
    for (const type of allRegistryTypes) {
      expect(allConstantTypes.has(type)).toBe(true);
    }

    // Every constant type should be in registry
    for (const type of allConstantTypes) {
      expect(allRegistryTypes.has(type)).toBe(true);
    }
  });
});
