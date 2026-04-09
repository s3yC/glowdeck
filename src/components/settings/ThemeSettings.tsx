'use client';

import { usePreferenceStore, usePremiumStore } from '@/stores';

const ACCENT_PRESETS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0',
];

export function ThemeSettings() {
  const theme = usePreferenceStore((s) => s.theme);
  const setTheme = usePreferenceStore((s) => s.setTheme);
  const nightMode = usePreferenceStore((s) => s.nightMode);
  const setNightMode = usePreferenceStore((s) => s.setNightMode);
  const wakeLock = usePreferenceStore((s) => s.wakeLock);
  const toggleWakeLock = usePreferenceStore((s) => s.toggleWakeLock);
  const burnInProtection = usePreferenceStore((s) => s.burnInProtection);
  const toggleBurnInProtection = usePreferenceStore(
    (s) => s.toggleBurnInProtection
  );
  const canAccessFeature = usePremiumStore((s) => s.canAccessFeature);
  const isPremium = canAccessFeature('premium');

  return (
    <div className="space-y-6">
      <h3
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Theme
      </h3>

      {/* Dark / OLED toggle */}
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            OLED Mode
          </span>
          <button
            onClick={() =>
              setTheme({
                ...theme,
                mode: theme.mode === 'oled' ? 'dark' : 'oled',
              })
            }
            className="relative w-10 h-5 rounded-full transition-colors"
            style={{
              backgroundColor:
                theme.mode === 'oled' ? 'var(--accent)' : 'var(--bg-tertiary)',
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{
                transform:
                  theme.mode === 'oled' ? 'translateX(20px)' : 'translateX(0)',
              }}
            />
          </button>
        </label>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {theme.mode === 'oled'
            ? 'Pure black background for OLED screens'
            : 'Dark gray background'}
        </p>
      </div>

      {/* Night mode */}
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Night Mode
          </span>
          <button
            onClick={() => setNightMode({ enabled: !nightMode.enabled })}
            className="relative w-10 h-5 rounded-full transition-colors"
            style={{
              backgroundColor: nightMode.enabled
                ? 'var(--accent)'
                : 'var(--bg-tertiary)',
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{
                transform: nightMode.enabled
                  ? 'translateX(20px)'
                  : 'translateX(0)',
              }}
            />
          </button>
        </label>

        {nightMode.enabled && (
          <div className="space-y-3 pl-2">
            {/* Auto schedule toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <span
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Auto Schedule
              </span>
              <button
                onClick={() =>
                  setNightMode({ autoSchedule: !nightMode.autoSchedule })
                }
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{
                  backgroundColor: nightMode.autoSchedule
                    ? 'var(--accent)'
                    : 'var(--bg-tertiary)',
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{
                    transform: nightMode.autoSchedule
                      ? 'translateX(20px)'
                      : 'translateX(0)',
                  }}
                />
              </button>
            </label>

            {nightMode.autoSchedule && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Start
                  </span>
                  <input
                    type="time"
                    value={nightMode.startTime}
                    onChange={(e) =>
                      setNightMode({ startTime: e.target.value })
                    }
                    className="rounded px-2 py-1 text-sm border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    End
                  </span>
                  <input
                    type="time"
                    value={nightMode.endTime}
                    onChange={(e) => setNightMode({ endTime: e.target.value })}
                    className="rounded px-2 py-1 text-sm border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accent color picker (premium) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Accent Color
          </span>
          {!isPremium && (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white"
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
              }}
            >
              PRO
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => {
                if (isPremium) setTheme({ ...theme, accentColor: color });
              }}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor:
                  theme.accentColor === color
                    ? 'var(--text-primary)'
                    : 'transparent',
                opacity: isPremium ? 1 : 0.5,
                cursor: isPremium ? 'pointer' : 'not-allowed',
              }}
            />
          ))}
        </div>
      </div>

      {/* Wake lock */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Keep Screen On
        </span>
        <button
          onClick={toggleWakeLock}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{
            backgroundColor: wakeLock
              ? 'var(--accent)'
              : 'var(--bg-tertiary)',
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{
              transform: wakeLock ? 'translateX(20px)' : 'translateX(0)',
            }}
          />
        </button>
      </label>

      {/* Burn-in protection */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Burn-in Protection
        </span>
        <button
          onClick={toggleBurnInProtection}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{
            backgroundColor: burnInProtection
              ? 'var(--accent)'
              : 'var(--bg-tertiary)',
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{
              transform: burnInProtection
                ? 'translateX(20px)'
                : 'translateX(0)',
            }}
          />
        </button>
      </label>
    </div>
  );
}
