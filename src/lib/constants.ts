// Trial
export const TRIAL_DURATION_DAYS = 21;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

// Polling intervals
export const POLLING_WEATHER_MS = 900_000;   // 15 min
export const POLLING_STOCKS_MS = 60_000;     // 1 min default
export const POLLING_CALENDAR_MS = 300_000;  // 5 min

// Iframe limits
export const MAX_IFRAMES = 8;

// Burn-in protection
export const BURN_IN_SHIFT_PX = 2;
export const BURN_IN_INTERVAL_MS = 60_000;

// Persistence
export const PERSIST_DEBOUNCE_MS = 500;

// Grid
export const GRID_COLS = 12;
export const GRID_MARGIN: [number, number] = [8, 8];
export const GRID_PADDING: [number, number] = [8, 8];

// Widget tier arrays
export const FREE_WIDGET_TYPES = [
  'clock', 'date', 'calendar', 'weather', 'countdown', 'quote',
] as const;

export const PREMIUM_WIDGET_TYPES = [
  'youtube', 'music', 'stocks', 'iframe', 'photo-frame', 'pomodoro',
] as const;

// CSP whitelist
export const CSP_FRAME_SRC = [
  "'self'",
  'https://www.youtube-nocookie.com',
  'https://www.youtube.com',
  'https://open.spotify.com',
  'https://s.tradingview.com',
  'https://www.tradingview.com',
  'https://calendar.google.com',
  'https://embed.windy.com',
];
