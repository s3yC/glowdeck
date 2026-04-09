'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
interface AlarmConfig {
  alarmTime: string;  // 'HH:MM'
  enabled: boolean;
  sound: 'classic' | 'gentle' | 'digital';
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Audio helpers — Web Audio API tone generator                       */
/* ------------------------------------------------------------------ */
function createAlarmOscillator(
  ctx: AudioContext,
  sound: AlarmConfig['sound'],
): { start: () => void; stop: () => void } {
  let oscillator: OscillatorNode | null = null;
  let gain: GainNode | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const freqMap = { classic: 800, gentle: 440, digital: 1000 };
  const freq = freqMap[sound];

  const start = () => {
    // Beep pattern: on 200ms, off 300ms
    let on = false;
    const toggle = () => {
      on = !on;
      if (on) {
        oscillator = ctx.createOscillator();
        gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
      } else {
        oscillator?.stop();
        oscillator?.disconnect();
        gain?.disconnect();
        oscillator = null;
        gain = null;
      }
    };
    toggle(); // start immediately with a beep
    intervalId = setInterval(toggle, on ? 200 : 300);
  };

  const stop = () => {
    if (intervalId) clearInterval(intervalId);
    oscillator?.stop();
    oscillator?.disconnect();
    gain?.disconnect();
    oscillator = null;
    gain = null;
  };

  return { start, stop };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function timeUntilAlarm(alarmTime: string): string {
  const [h, m] = alarmTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hrs}h ${pad(mins)}m`;
}

function isAlarmTime(alarmTime: string): boolean {
  const [h, m] = alarmTime.split(':').map(Number);
  const now = new Date();
  return now.getHours() === h && now.getMinutes() === m;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function AlarmClockWidget({ widget, onConfigChange }: WidgetProps) {
  const config: AlarmConfig = {
    alarmTime: '07:00',
    enabled: false,
    sound: 'classic',
    label: 'Wake Up',
    ...(widget.config as Partial<AlarmConfig>),
  };

  const [ringing, setRinging] = useState(false);
  const [remaining, setRemaining] = useState(() =>
    config.enabled ? timeUntilAlarm(config.alarmTime) : '',
  );
  const audioRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  // Check alarm every second
  useEffect(() => {
    if (!config.enabled) {
      setRinging(false);
      return;
    }

    const tick = () => {
      setRemaining(timeUntilAlarm(config.alarmTime));
      if (isAlarmTime(config.alarmTime) && !ringing) {
        setRinging(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [config.enabled, config.alarmTime, ringing]);

  // Play sound when ringing
  useEffect(() => {
    if (!ringing) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const alarm = createAlarmOscillator(ctx, config.sound);
    audioRef.current = alarm;
    alarm.start();

    return () => {
      alarm.stop();
      ctx.close();
    };
  }, [ringing, config.sound]);

  const handleDismiss = useCallback(() => {
    audioRef.current?.stop();
    if (ctxRef.current) ctxRef.current.close();
    setRinging(false);
  }, []);

  const toggleEnabled = useCallback(() => {
    onConfigChange({ ...config, enabled: !config.enabled });
  }, [config, onConfigChange]);

  /* --- Ringing state --- */
  if (ringing) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
        <span className="text-[clamp(1.5rem,4vw,2.5rem)] animate-pulse" style={{ color: 'var(--accent)' }}>
          {'\u{23F0}'}
        </span>
        <span className="text-[clamp(0.7rem,1.5vw,1rem)] font-medium" style={{ color: 'var(--text-primary)' }}>
          {config.label}
        </span>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  /* --- Normal state --- */
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 px-4 select-none">
      <span className="text-[clamp(0.8rem,2vw,1.2rem)]">{'\u{23F0}'}</span>

      <span
        className="text-[clamp(1rem,3vw,2rem)] font-light"
        style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
      >
        {config.alarmTime}
      </span>

      {config.label && (
        <span className="text-[clamp(0.4rem,0.9vw,0.6rem)] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {config.label}
        </span>
      )}

      {config.enabled && (
        <span className="text-[clamp(0.4rem,0.9vw,0.6rem)]" style={{ color: 'var(--text-secondary)' }}>
          in {remaining}
        </span>
      )}

      <button
        onClick={toggleEnabled}
        className="mt-1 px-3 py-1 rounded-full text-[clamp(0.4rem,0.8vw,0.6rem)] font-medium transition-colors"
        style={{
          backgroundColor: config.enabled ? 'var(--accent)' : 'var(--bg-tertiary)',
          color: config.enabled ? '#fff' : 'var(--text-muted)',
          border: `1px solid ${config.enabled ? 'var(--accent)' : 'var(--border)'}`,
        }}
      >
        {config.enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
