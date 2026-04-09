import {
  app,
  BrowserWindow,
  powerSaveBlocker,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  shell,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let powerSaveId: number | null = null;

// ---------- Kiosk mode detection ----------

const isKiosk = process.argv.includes('--kiosk');

// ---------- Window ----------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    title: 'GlowDeck',
    icon: path.join(__dirname, '../public/icons/icon-512.png'),
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true,
    },
  });

  // Load the static export
  mainWindow.loadFile(path.join(__dirname, '../out/index.html'));

  // Show window when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Kiosk mode
  if (isKiosk) {
    mainWindow.setKiosk(true);
    mainWindow.setFullScreen(true);
    mainWindow.setMenuBarVisibility(false);
  }

  // Handle window close — minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!(app as unknown as { isQuitting: boolean }).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Enforce CSP via response headers
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
            "img-src 'self' data: blob:;",
          ],
        },
      });
    }
  );

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  // External links open in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ---------- Power Save ----------

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

// ---------- Tray ----------

function sendToRenderer(channel: string, ...args: unknown[]) {
  mainWindow?.webContents.send(channel, ...args);
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../public/icons/icon-192.png')
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
        { label: 'Home', click: () => sendToRenderer('switch-space', 'home') },
        { label: 'Work', click: () => sendToRenderer('switch-space', 'work') },
        { label: 'Focus', click: () => sendToRenderer('switch-space', 'focus') },
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
        (app as unknown as { isQuitting: boolean }).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

// ---------- Auto Updater ----------

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

  app.whenReady().then(() => {
    setTimeout(() => autoUpdater.checkForUpdates(), 5000);
  });
}

// ---------- IPC Handlers ----------

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('set-wake-lock', (_event, enabled: boolean) => {
  if (enabled) {
    enablePowerSaveBlocker();
  } else {
    disablePowerSaveBlocker();
  }
});

// ---------- App Lifecycle ----------

app.whenReady().then(() => {
  createWindow();
  createTray();
  enablePowerSaveBlocker();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

app.on('before-quit', () => {
  disablePowerSaveBlocker();
});
