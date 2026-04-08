import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPreferences } from '@/types';
import { createIDBStorage } from '@/lib/idb';

interface PreferenceStore extends UserPreferences {
  setTheme: (theme: UserPreferences['theme']) => void;
  setNightMode: (config: Partial<UserPreferences['nightMode']>) => void;
  toggleWakeLock: () => void;
  toggleBurnInProtection: () => void;
  setOnboardingComplete: () => void;
  setActiveSpaceId: (id: string) => void;
}

const defaults: UserPreferences = {
  activeSpaceId: 'home',
  theme: { mode: 'oled', accentColor: '#667eea' },
  nightMode: {
    enabled: false,
    autoSchedule: false,
    startTime: '22:00',
    endTime: '07:00',
  },
  wakeLock: true,
  burnInProtection: true,
  keyboardShortcuts: true,
  onboardingComplete: false,
};

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set) => ({
      ...defaults,

      setTheme: (theme) => set({ theme }),

      setNightMode: (config) =>
        set((s) => ({ nightMode: { ...s.nightMode, ...config } })),

      toggleWakeLock: () => set((s) => ({ wakeLock: !s.wakeLock })),

      toggleBurnInProtection: () =>
        set((s) => ({ burnInProtection: !s.burnInProtection })),

      setOnboardingComplete: () => set({ onboardingComplete: true }),

      setActiveSpaceId: (id) => set({ activeSpaceId: id }),
    }),
    {
      name: 'glowdeck-prefs',
      storage: createIDBStorage('glowdeck-prefs'),
    }
  )
);
