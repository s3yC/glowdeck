'use client';

import { useState, useEffect, useMemo } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
interface CountdownConfig {
  targetDate: string; // ISO 8601
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // ms remaining
}

function calcTimeLeft(target: Date): TimeLeft {
  const total = target.getTime() - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/* ------------------------------------------------------------------ */
/*  Segment box                                                        */
/* ------------------------------------------------------------------ */
function Segment({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="rounded-lg flex items-center justify-center px-2 py-1"
        style={{
          background: 'var(--bg-tertiary)',
          minWidth: 'clamp(1.6rem, 5vw, 3.2rem)',
        }}
      >
        <span
          className="text-[clamp(1rem,3.5vw,2.2rem)] font-light"
          style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </span>
      </div>
      <span
        className="text-[clamp(0.3rem,0.8vw,0.5rem)] uppercase tracking-widest font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CountdownWidget({ widget, onConfigChange }: WidgetProps) {
  const config: CountdownConfig = {
    targetDate: '',
    label: 'Countdown',
    ...(widget.config as Partial<CountdownConfig>),
  };

  const targetDate = useMemo(() => {
    if (!config.targetDate) return null;
    const d = new Date(config.targetDate);
    return isNaN(d.getTime()) ? null : d;
  }, [config.targetDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    targetDate ? calcTimeLeft(targetDate) : null,
  );

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => setTimeLeft(calcTimeLeft(targetDate));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  /* --- No target configured --- */
  if (!targetDate) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <span className="text-[clamp(1rem,3vw,1.6rem)]" style={{ color: 'var(--text-muted)' }}>
          {'\u23F3'}
        </span>
        <span className="text-[clamp(0.55rem,1.3vw,0.8rem)] opacity-50" style={{ color: 'var(--text-secondary)' }}>
          Set a target date in widget settings
        </span>
      </div>
    );
  }

  /* --- Complete --- */
  if (timeLeft && timeLeft.total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <span className="text-[clamp(1rem,3vw,1.8rem)]" style={{ color: 'var(--accent)' }}>
          {'\u2713'}
        </span>
        <span className="text-[clamp(0.7rem,1.8vw,1.1rem)] font-light"
          style={{ color: 'var(--text-primary)' }}>
          Complete!
        </span>
        {config.label && (
          <span className="text-[clamp(0.45rem,1vw,0.65rem)] opacity-40"
            style={{ color: 'var(--text-secondary)' }}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-3 select-none">
      {/* Label */}
      {config.label && (
        <span
          className="text-[clamp(0.5rem,1.3vw,0.8rem)] font-medium tracking-wider uppercase opacity-50"
          style={{ color: 'var(--text-secondary)' }}
        >
          {config.label}
        </span>
      )}

      {/* Segments */}
      <div className="flex items-center gap-[clamp(0.25rem,1vw,0.6rem)]">
        <Segment value={timeLeft.days.toString()} label="days" />
        <span className="text-[clamp(0.8rem,2vw,1.4rem)] font-extralight opacity-30 self-start mt-[clamp(0.4rem,1.2vw,0.8rem)]"
          style={{ color: 'var(--text-muted)' }}>:</span>
        <Segment value={pad(timeLeft.hours)} label="hrs" />
        <span className="text-[clamp(0.8rem,2vw,1.4rem)] font-extralight opacity-30 self-start mt-[clamp(0.4rem,1.2vw,0.8rem)]"
          style={{ color: 'var(--text-muted)' }}>:</span>
        <Segment value={pad(timeLeft.minutes)} label="min" />
        <span className="text-[clamp(0.8rem,2vw,1.4rem)] font-extralight opacity-30 self-start mt-[clamp(0.4rem,1.2vw,0.8rem)]"
          style={{ color: 'var(--text-muted)' }}>:</span>
        <Segment value={pad(timeLeft.seconds)} label="sec" />
      </div>
    </div>
  );
}
