# GlowDeck -- Electron Desktop Wrapper SOP

> **NOTE:** Electron implementation is deferred to Phase 5. This SOP defines the architecture so that all PWA-phase decisions remain compatible with the desktop wrapper. No Electron code should be written until Phase 5.

## Overview

GlowDeck ships as both a PWA (Vercel) and an Electron desktop app (Windows + Mac). The Electron shell wraps the same Next.js static export with native features: always-on display via `powerSaveBlocker`, system tray integration, auto-updates from GitHub Releases, and optional kiosk mode. Security is paramount -- `nodeIntegration` is always false and all renderer-to-main communication goes through a `contextBridge` preload script.

---

## 1. Main Process (`electron/main.ts`)

### BrowserWindow Configuration

```typescript
// electron/main.ts

import {
  app,
  BrowserWindow,
  powerSaveBlocker,
  Tray,
  Menu,
  nativeImage,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let powerSaveId: number | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    title: 'GlowDeck',
    icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
    backgroundColor: '#000000',           // Matches OLED theme, no white flash
    show: false,                          // Show after ready-to-show to prevent flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,             // SECURITY: never enable
      contextIsolation: true,             // SECURITY: always enable
      webSecurity: true,                  // SECURITY: enforce same-origin + CSP
      sandbox: true,                      // SECURITY: sandbox renderer process
    },
  });

  // Load the static export
  mainWindow.loadFile(path.join(__dirname, '../out/index.html'));

  // Show window when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window close -- minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}
```

### Kiosk Mode

Optional kiosk mode for dedicated dashboard displays. Enabled via CLI flag:

```bash
glowdeck --kiosk
```

```typescript
const isKiosk = process.argv.includes('--kiosk');

if (isKiosk) {
  mainWindow.setKiosk(true);
  mainWindow.setFullScreen(true);
  mainWindow.setMenuBarVisibility(false);
}
```

Kiosk mode:
- Fills the entire screen with no title bar, taskbar, or window controls
- `Esc` does not exit kiosk mode (user must use tray icon or `Ctrl+Q` / `Cmd+Q`)
- Ideal for wall-mounted displays, bedside tablets, or dedicated screens

### powerSaveBlocker

Prevents the OS from sleeping the display while GlowDeck is active. Mirrors the PWA's Wake Lock API behavior.

```typescript
function enablePowerSaveBlocker() {
  if (powerSaveId === null) {
    powerSaveId = powerSaveBlocker.start('prevent-display-sleep');
  }
}

function disablePowerSaveBlocker() {
  if (powerSaveId !== null) {
    powerSaveBlocker.stop(powerSaveId);
    powerSaveId = null;
  }
}
```

The power save blocker is enabled/disabled based on the user's wake lock preference (communicated from the renderer via IPC). Default: enabled on app start, user can toggle in Settings.

### Auto-Updater

Uses `electron-updater` to check for updates from GitHub Releases on app launch.

```typescript
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info.version);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', info.version);
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-update error:', err);
  });

  // Check for updates on launch (after a short delay to not block startup)
  app.whenReady().then(() => {
    setTimeout(() => autoUpdater.checkForUpdates(), 5000);
  });
}
```

### Tray Icon

System tray icon with a context menu for quick actions without opening the main window.

```typescript
function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../public/icons/icon-32x32.png')
  );
  tray = new Tray(icon);
  tray.setToolTip('GlowDeck');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show GlowDeck',
      click: () => mainWindow?.show(),
    },
    { type: 'separator' },
    {
      label: 'Switch Space',
      submenu: [
        { label: 'Home',  click: () => sendToRenderer('switch-space', 'space-home') },
        { label: 'Work',  click: () => sendToRenderer('switch-space', 'space-work') },
        { label: 'Focus', click: () => sendToRenderer('switch-space', 'space-focus') },
      ],
    },
    {
      label: 'Toggle Night Mode',
      click: () => sendToRenderer('toggle-night-mode'),
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow?.show();
        sendToRenderer('open-settings');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit GlowDeck',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

function sendToRenderer(channel: string, ...args: unknown[]) {
  mainWindow?.webContents.send(channel, ...args);
}
```

### App Lifecycle

```typescript
app.whenReady().then(() => {
  createWindow();
  createTray();
  enablePowerSaveBlocker();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running in the tray
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

app.on('before-quit', () => {
  disablePowerSaveBlocker();
});
```

---

## 2. Preload Script (`electron/preload.ts`)

The preload script exposes a safe API to the renderer via `contextBridge`. This is the only communication channel between the web app and the Electron main process.

### Exposed API

```typescript
// electron/preload.ts

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
```

### Main Process IPC Handlers

```typescript
// electron/main.ts (add to createWindow or app.whenReady)

import { ipcMain } from 'electron';

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('set-wake-lock', (_event, enabled: boolean) => {
  if (enabled) {
    enablePowerSaveBlocker();
  } else {
    disablePowerSaveBlocker();
  }
});
```

### TypeScript Declarations

For type safety in the renderer, declare the `glowdeck` global:

```typescript
// src/types/electron.d.ts

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
```

### Detecting Electron vs PWA

The renderer checks for the `glowdeck` global to determine if it is running in Electron:

```typescript
function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.glowdeck?.isElectron;
}
```

This is used to:
- Show the `powerSaveBlocker` toggle instead of the Wake Lock API toggle in Settings
- Show update notifications from `electron-updater`
- Handle tray menu actions

---

## 3. Security Configuration

### Non-Negotiable Security Rules

| Setting | Value | Reason |
|---------|-------|--------|
| `nodeIntegration` | `false` | Never expose Node.js APIs to web content |
| `contextIsolation` | `true` | Isolate preload script context from renderer |
| `webSecurity` | `true` | Enforce same-origin policy and CSP |
| `sandbox` | `true` | Sandbox the renderer process at the OS level |
| `allowRunningInsecureContent` | `false` (default) | Block HTTP resources on HTTPS pages |
| `enableRemoteModule` | `false` (default, deprecated) | Never use the remote module |

### Content Security Policy

The Electron app enforces the same CSP as the PWA, set via response headers:

```typescript
mainWindow.webContents.session.webRequest.onHeadersReceived(
  (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://open.spotify.com https://s.tradingview.com https://www.tradingview.com https://calendar.google.com https://embed.windy.com; " +
          "connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com; " +
          "img-src 'self' data: blob:;"
        ],
      },
    });
  }
);
```

### Navigation Restrictions

Prevent the renderer from navigating away from the app:

```typescript
mainWindow.webContents.on('will-navigate', (event, url) => {
  // Only allow navigation to the app's own pages
  if (!url.startsWith('file://')) {
    event.preventDefault();
  }
});

// Prevent new windows from opening (external links open in system browser)
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  require('electron').shell.openExternal(url);
  return { action: 'deny' };
});
```

---

## 4. Build Configuration

### electron-builder Config

```javascript
// electron/electron-builder.config.js

module.exports = {
  appId: 'com.glowdeck.app',
  productName: 'GlowDeck',
  copyright: 'Copyright (c) GlowDeck',

  directories: {
    output: 'dist-electron',
    buildResources: 'public/icons',
  },

  files: [
    'out/**/*',                          // Next.js static export
    'electron/**/*.js',                  // Compiled Electron scripts
    'public/icons/**/*',
  ],

  // Windows
  win: {
    target: 'nsis',
    artifactName: 'GlowDeck-Setup-${version}.exe',
    icon: 'public/icons/icon-512x512.png',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'public/icons/icon-512x512.ico',
    uninstallerIcon: 'public/icons/icon-512x512.ico',
  },

  // macOS
  mac: {
    target: 'dmg',
    artifactName: 'GlowDeck-${version}.dmg',
    icon: 'public/icons/icon-512x512.png',
    category: 'public.app-category.utilities',
  },
  dmg: {
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
  },

  // Auto-updates via GitHub Releases
  publish: {
    provider: 'github',
    releaseType: 'release',
  },
};
```

### Build Scripts

```json
// package.json (scripts to add in Phase 5)

{
  "scripts": {
    "electron:dev": "next build && electron .",
    "electron:build": "next build && next export && electron-builder --config electron/electron-builder.config.js",
    "electron:build:win": "npm run electron:build -- --win",
    "electron:build:mac": "npm run electron:build -- --mac"
  }
}
```

### Build Pipeline

```
1. next build          # Build the Next.js app
2. next export         # Generate static HTML/JS/CSS in /out
3. tsc electron/       # Compile Electron TypeScript to JS
4. electron-builder    # Package /out + /electron into native installer
```

---

## 5. PWA Compatibility

The Electron shell must not break any PWA functionality. The web app runs identically in both environments. Feature detection determines the runtime:

| Feature | PWA | Electron |
|---------|-----|----------|
| Screen wake | Wake Lock API (`navigator.wakeLock`) | `powerSaveBlocker` via IPC |
| Updates | Service Worker + manifest | `electron-updater` via GitHub Releases |
| Install prompt | Browser's "Add to Home Screen" | N/A (already installed) |
| Tray/dock actions | N/A | Tray icon context menu |
| Kiosk mode | Browser fullscreen (F11) | `BrowserWindow.setKiosk(true)` |

### Feature Detection Pattern

```typescript
// src/hooks/useWakeLock.ts

function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    if (isElectron()) {
      // Electron: use powerSaveBlocker via preload API
      window.glowdeck?.setWakeLock(true);
      return () => window.glowdeck?.setWakeLock(false);
    }

    // PWA: use Wake Lock API
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock not supported:', err);
      }
    }

    requestWakeLock();

    return () => {
      wakeLock?.release();
    };
  }, [enabled]);
}
```

---

## 6. File Structure

```
electron/
  main.ts                        # Main process: window, tray, power, updates
  preload.ts                     # contextBridge API for renderer
  electron-builder.config.js     # Build configuration for Windows + Mac
src/
  types/
    electron.d.ts                # TypeScript declarations for window.glowdeck
```

---

## 7. Phase 5 Implementation Checklist

When Phase 5 begins, implement in this order:

1. Set up `electron/main.ts` with BrowserWindow and security config
2. Create `electron/preload.ts` with contextBridge API
3. Add `src/types/electron.d.ts` type declarations
4. Add feature detection (`isElectron()`) to wake lock hook
5. Wire up tray icon IPC handlers
6. Configure `electron-builder.config.js`
7. Add build scripts to `package.json`
8. Test on Windows (NSIS installer) and Mac (DMG)
9. Set up GitHub Releases for auto-updates
10. Test kiosk mode on a dedicated display
