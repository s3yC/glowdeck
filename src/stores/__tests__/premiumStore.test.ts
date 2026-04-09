import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRIAL_DURATION_MS } from '@/lib/constants';

// Mock the IDB storage with a simple synchronous in-memory store
vi.mock('@/lib/idb', () => ({
  createIDBStorage: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}));

// We need to reset the module between tests to get fresh store state
let usePremiumStore: typeof import('../premiumStore').usePremiumStore;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../premiumStore');
  usePremiumStore = mod.usePremiumStore;
});

describe('premiumStore', () => {
  it('initial state is "trial" with dates set', () => {
    const state = usePremiumStore.getState();
    expect(state.tier).toBe('trial');
    expect(state.trialStartDate).toBeTypeOf('number');
    expect(state.trialEndDate).toBeTypeOf('number');
    expect(state.trialStartDate).not.toBeNull();
    expect(state.trialEndDate).not.toBeNull();
  });

  it('startTrial() sets correct dates (21 days from now)', () => {
    const before = Date.now();
    usePremiumStore.getState().startTrial();
    const after = Date.now();
    const state = usePremiumStore.getState();

    expect(state.tier).toBe('trial');
    expect(state.trialStartDate).toBeGreaterThanOrEqual(before);
    expect(state.trialStartDate).toBeLessThanOrEqual(after);
    expect(state.trialEndDate).toBe(state.trialStartDate! + TRIAL_DURATION_MS);
  });

  it('checkTrialExpiry() expires trial when past endDate', () => {
    // Set trial end date to the past
    usePremiumStore.setState({
      tier: 'trial',
      trialEndDate: Date.now() - 1000,
    });
    usePremiumStore.getState().checkTrialExpiry();
    expect(usePremiumStore.getState().tier).toBe('free');
  });

  it('checkTrialExpiry() keeps trial when not expired', () => {
    usePremiumStore.setState({
      tier: 'trial',
      trialEndDate: Date.now() + 86_400_000, // 1 day in the future
    });
    usePremiumStore.getState().checkTrialExpiry();
    expect(usePremiumStore.getState().tier).toBe('trial');
  });

  it('canAccessFeature("free") always returns true', () => {
    // Check for all tier states
    usePremiumStore.setState({ tier: 'free' });
    expect(usePremiumStore.getState().canAccessFeature('free')).toBe(true);

    usePremiumStore.setState({ tier: 'trial' });
    expect(usePremiumStore.getState().canAccessFeature('free')).toBe(true);

    usePremiumStore.setState({ tier: 'premium' });
    expect(usePremiumStore.getState().canAccessFeature('free')).toBe(true);
  });

  it('canAccessFeature("premium") returns true during trial', () => {
    usePremiumStore.setState({ tier: 'trial' });
    expect(usePremiumStore.getState().canAccessFeature('premium')).toBe(true);
  });

  it('canAccessFeature("premium") returns false when free', () => {
    usePremiumStore.setState({ tier: 'free' });
    expect(usePremiumStore.getState().canAccessFeature('premium')).toBe(false);
  });

  it('canShowUpgradePrompt() returns false during trial', () => {
    usePremiumStore.setState({ tier: 'trial' });
    expect(usePremiumStore.getState().canShowUpgradePrompt()).toBe(false);
  });

  it('canShowUpgradePrompt() returns true when free and no prompts shown', () => {
    usePremiumStore.setState({
      tier: 'free',
      upgradePromptsShown: 0,
      lastPromptSessionId: null,
    });
    expect(usePremiumStore.getState().canShowUpgradePrompt()).toBe(true);
  });

  it('recordUpgradePrompt() prevents second prompt in same session', () => {
    const sessionId = usePremiumStore.getState().sessionId;
    usePremiumStore.setState({
      tier: 'free',
      upgradePromptsShown: 0,
      lastPromptSessionId: null,
    });

    // First: should be able to show prompt
    expect(usePremiumStore.getState().canShowUpgradePrompt()).toBe(true);

    // Record that we showed a prompt
    usePremiumStore.getState().recordUpgradePrompt();

    // Now it should be blocked (same session)
    expect(usePremiumStore.getState().canShowUpgradePrompt()).toBe(false);
    expect(usePremiumStore.getState().upgradePromptsShown).toBe(1);
    expect(usePremiumStore.getState().lastPromptSessionId).toBe(sessionId);
  });
});
