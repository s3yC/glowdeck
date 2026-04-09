import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('glowdeck', {
  // App info
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-app-version'),

  isElectron: true,

  // Space switching (from tray menu)
  onSwitchSpace: (callback: (spaceId: string) => void) => {
    ipcRenderer.on('switch-space', (_event, spaceId) => callback(spaceId));
  },

  // Night mode toggle (from tray menu)
  onToggleNightMode: (callback: () => void) => {
    ipcRenderer.on('toggle-night-mode', () => callback());
  },

  // Settings (from tray menu)
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', () => callback());
  },

  // Wake lock control
  setWakeLock: (enabled: boolean): void => {
    ipcRenderer.send('set-wake-lock', enabled);
  },

  // Update notifications
  onUpdateAvailable: (callback: (version: string) => void) => {
    ipcRenderer.on('update-available', (_event, version) => callback(version));
  },
  onUpdateDownloaded: (callback: (version: string) => void) => {
    ipcRenderer.on('update-downloaded', (_event, version) => callback(version));
  },

  // Cleanup
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
