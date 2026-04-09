interface GlowDeckElectronAPI {
  getAppVersion: () => Promise<string>;
  isElectron: true;
  onSwitchSpace: (callback: (spaceId: string) => void) => void;
  onToggleNightMode: (callback: () => void) => void;
  onOpenSettings: (callback: () => void) => void;
  setWakeLock: (enabled: boolean) => void;
  onUpdateAvailable: (callback: (version: string) => void) => void;
  onUpdateDownloaded: (callback: (version: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    glowdeck?: GlowDeckElectronAPI;
  }
}

export {};
