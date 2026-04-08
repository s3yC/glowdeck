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
        set((state) => ({
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
      partialize: (state) =>
        ({
          tier: state.tier,
          trialStartDate: state.trialStartDate,
          trialEndDate: state.trialEndDate,
          upgradePromptsShown: state.upgradePromptsShown,
          lastPromptSessionId: state.lastPromptSessionId,
        }) as unknown as PremiumStore,
    }
  )
);
