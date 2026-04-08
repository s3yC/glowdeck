export interface UserPreferences {
  activeSpaceId: string;
  theme: {
    mode: 'dark' | 'oled';
    accentColor: string;
  };
  nightMode: {
    enabled: boolean;
    autoSchedule: boolean;
    startTime: string;
    endTime: string;
  };
  wakeLock: boolean;
  burnInProtection: boolean;
  keyboardShortcuts: boolean;
  onboardingComplete: boolean;
}

export interface PremiumStatus {
  tier: 'free' | 'trial' | 'premium';
  trialStartDate: number | null;
  trialEndDate: number | null;
  upgradePromptsShown: number;
  lastPromptSessionId: string | null;
  sessionId: string;
}
