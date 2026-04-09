'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config types                                                       */
/* ------------------------------------------------------------------ */
type ClockStyle = 'minimal-digital' | 'analog' | 'flip-clock' | 'binary' | 'word-clock';
interface ClockConfig {
  style: ClockStyle;
  format: '12h' | '24h';
  showSeconds: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatHour(h: number, fmt: '12h' | '24h'): number {
  if (fmt === '24h') return h;
  const h12 = h % 12;
  return h12 === 0 ? 12 : h12;
}

function ampm(h: number): string {
  return h >= 12 ? 'PM' : 'AM';
}

/* ------------------------------------------------------------------ */
/*  Word-clock helpers                                                 */
/* ------------------------------------------------------------------ */
const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];

function numberToWords(n: number): string {
  if (n === 0) return 'twelve';
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? '-' + ones[o] : '');
}

function timeToWords(h: number, m: number, fmt: '12h' | '24h'): string {
  const displayH = fmt === '12h' ? (h % 12 || 12) : h;
  const hourWord = numberToWords(displayH);
  if (m === 0) return `${hourWord} o'clock`;
  const minWord = m < 10 ? `oh ${numberToWords(m)}` : numberToWords(m);
  return `${hourWord} ${minWord}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MinimalDigital({ now, config }: { now: Date; config: ClockConfig }) {
  const h = formatHour(now.getHours(), config.format);
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const period = config.format === '12h' ? ampm(now.getHours()) : '';

  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(now);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1 select-none">
      <div className="flex items-baseline gap-0.5">
        <span className="text-[clamp(2rem,8vw,5rem)] font-extralight tracking-tight"
          style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {pad(h)}:{m}
          {config.showSeconds && <span className="text-[0.5em] opacity-60">:{s}</span>}
        </span>
        {period && (
          <span className="text-[clamp(0.6rem,2vw,1.1rem)] font-medium opacity-50 ml-1"
            style={{ color: 'var(--text-secondary)' }}>{period}</span>
        )}
      </div>
      <span className="text-[clamp(0.55rem,1.5vw,0.85rem)] tracking-widest uppercase opacity-40"
        style={{ color: 'var(--text-secondary)' }}>{dateStr}</span>
    </div>
  );
}

function AnalogClock({ now, config }: { now: Date; config: ClockConfig }) {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();

  const secAngle = (s + ms / 1000) * 6;
  const minAngle = (m + s / 60) * 6;
  const hourAngle = (h + m / 60) * 30;

  const markers = Array.from({ length: 12 }, (_, i) => i);
  const minuteMarkers = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center h-full select-none p-2">
      <svg viewBox="0 0 200 200" className="w-full h-full max-w-[min(100%,100%)]" style={{ maxHeight: '100%' }}>
        {/* Face */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="var(--border)" strokeWidth="1.5" />

        {/* Minute tick marks */}
        {minuteMarkers.map((i) => {
          if (i % 5 === 0) return null;
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const x1 = 100 + 89 * Math.cos(angle);
          const y1 = 100 + 89 * Math.sin(angle);
          const x2 = 100 + 92 * Math.cos(angle);
          const y2 = 100 + 92 * Math.sin(angle);
          return <line key={`m${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" strokeWidth="0.5" />;
        })}

        {/* Hour markers */}
        {markers.map((i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x1 = 100 + 84 * Math.cos(angle);
          const y1 = 100 + 84 * Math.sin(angle);
          const x2 = 100 + 92 * Math.cos(angle);
          const y2 = 100 + 92 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />;
        })}

        {/* Hour hand */}
        <line x1="100" y1="100"
          x2={100 + 50 * Math.cos((hourAngle - 90) * Math.PI / 180)}
          y2={100 + 50 * Math.sin((hourAngle - 90) * Math.PI / 180)}
          stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />

        {/* Minute hand */}
        <line x1="100" y1="100"
          x2={100 + 70 * Math.cos((minAngle - 90) * Math.PI / 180)}
          y2={100 + 70 * Math.sin((minAngle - 90) * Math.PI / 180)}
          stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />

        {/* Second hand */}
        {config.showSeconds && (
          <line x1={100 - 15 * Math.cos((secAngle - 90) * Math.PI / 180)}
            y1={100 - 15 * Math.sin((secAngle - 90) * Math.PI / 180)}
            x2={100 + 78 * Math.cos((secAngle - 90) * Math.PI / 180)}
            y2={100 + 78 * Math.sin((secAngle - 90) * Math.PI / 180)}
            stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
        )}

        {/* Center dot */}
        <circle cx="100" cy="100" r="3" fill="var(--accent)" />
      </svg>
    </div>
  );
}

function FlipDigit({ value, prevValue }: { value: string; prevValue: string }) {
  const changed = value !== prevValue;

  return (
    <div className="relative inline-flex flex-col items-center mx-[1px]"
      style={{ width: 'clamp(1.4rem, 4vw, 2.8rem)', height: 'clamp(2rem, 5.5vw, 3.8rem)' }}>
      {/* Static base card */}
      <div className="absolute inset-0 rounded-md flex items-center justify-center text-[clamp(1rem,3.5vw,2.2rem)] font-semibold"
        style={{
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        }}>
        {value}
      </div>
      {/* Divider line */}
      <div className="absolute left-0 right-0 top-1/2 h-[1px] z-10" style={{ background: 'rgba(0,0,0,0.3)' }} />
      {/* Flip animation overlay */}
      {changed && (
        <div className="absolute inset-0 rounded-md flex items-center justify-center text-[clamp(1rem,3.5vw,2.2rem)] font-semibold z-20"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            animation: 'flipDown 0.6s ease-in-out',
          }}>
          {value}
        </div>
      )}
    </div>
  );
}

function FlipClock({ now, config, prev }: { now: Date; config: ClockConfig; prev: Date }) {
  const h = formatHour(now.getHours(), config.format);
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ph = formatHour(prev.getHours(), config.format);
  const pm = prev.getMinutes();
  const ps = prev.getSeconds();
  const period = config.format === '12h' ? ampm(now.getHours()) : '';

  const digits = [pad(h)[0], pad(h)[1], pad(m)[0], pad(m)[1]];
  const prevDigits = [pad(ph)[0], pad(ph)[1], pad(pm)[0], pad(pm)[1]];
  if (config.showSeconds) {
    digits.push(pad(s)[0], pad(s)[1]);
    prevDigits.push(pad(ps)[0], pad(ps)[1]);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
      <style>{`
        @keyframes flipDown {
          0% { transform: perspective(300px) rotateX(-90deg); opacity: 0; }
          50% { transform: perspective(300px) rotateX(10deg); opacity: 1; }
          100% { transform: perspective(300px) rotateX(0deg); opacity: 1; }
        }
      `}</style>
      <div className="flex items-center gap-0.5">
        <FlipDigit value={digits[0]} prevValue={prevDigits[0]} />
        <FlipDigit value={digits[1]} prevValue={prevDigits[1]} />
        <span className="text-[clamp(1rem,3vw,2rem)] font-light opacity-40 mx-0.5" style={{ color: 'var(--text-primary)' }}>:</span>
        <FlipDigit value={digits[2]} prevValue={prevDigits[2]} />
        <FlipDigit value={digits[3]} prevValue={prevDigits[3]} />
        {config.showSeconds && (
          <>
            <span className="text-[clamp(1rem,3vw,2rem)] font-light opacity-40 mx-0.5" style={{ color: 'var(--text-primary)' }}>:</span>
            <FlipDigit value={digits[4]} prevValue={prevDigits[4]} />
            <FlipDigit value={digits[5]} prevValue={prevDigits[5]} />
          </>
        )}
        {period && (
          <span className="text-[clamp(0.5rem,1.5vw,0.9rem)] font-medium opacity-40 ml-2 self-end mb-1"
            style={{ color: 'var(--text-secondary)' }}>{period}</span>
        )}
      </div>
    </div>
  );
}

function BinaryClock({ now, config }: { now: Date; config: ClockConfig }) {
  const h = formatHour(now.getHours(), config.format);
  const m = now.getMinutes();
  const s = now.getSeconds();

  const columns: { value: number; bits: number; label: string }[] = [
    { value: Math.floor(h / 10), bits: 2, label: '' },
    { value: h % 10, bits: 4, label: 'H' },
    { value: Math.floor(m / 10), bits: 3, label: '' },
    { value: m % 10, bits: 4, label: 'M' },
  ];
  if (config.showSeconds) {
    columns.push(
      { value: Math.floor(s / 10), bits: 3, label: '' },
      { value: s % 10, bits: 4, label: 'S' },
    );
  }

  const maxBits = 4;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 select-none p-3">
      <div className="flex items-end gap-[clamp(0.3rem,1.2vw,0.8rem)]">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col items-center gap-[clamp(0.2rem,0.8vw,0.4rem)]">
            {Array.from({ length: maxBits }, (_, bi) => {
              const bitIndex = maxBits - 1 - bi;
              const isActive = bitIndex < col.bits && ((col.value >> bitIndex) & 1) === 1;
              const isVisible = bitIndex < col.bits;
              return (
                <div key={bi}
                  className="rounded-full transition-colors duration-200"
                  style={{
                    width: 'clamp(0.5rem, 1.8vw, 1rem)',
                    height: 'clamp(0.5rem, 1.8vw, 1rem)',
                    background: !isVisible ? 'transparent' : isActive ? 'var(--accent)' : 'var(--bg-tertiary)',
                    boxShadow: isActive ? '0 0 6px var(--accent)' : 'none',
                  }} />
              );
            })}
            {col.label && (
              <span className="text-[clamp(0.35rem,0.9vw,0.55rem)] uppercase tracking-wider opacity-40 mt-0.5"
                style={{ color: 'var(--text-secondary)' }}>{col.label}</span>
            )}
          </div>
        ))}
      </div>
      <div className="text-[clamp(0.5rem,1.3vw,0.75rem)] opacity-30 tabular-nums tracking-wider mt-1"
        style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
        {pad(h)}:{pad(m)}{config.showSeconds ? `:${pad(s)}` : ''}
      </div>
    </div>
  );
}

function WordClock({ now, config }: { now: Date; config: ClockConfig }) {
  const h = now.getHours();
  const m = now.getMinutes();
  const period = config.format === '12h' ? ` ${ampm(h).toLowerCase()}` : '';
  const words = timeToWords(h, m, config.format);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 select-none text-center">
      <span className="text-[clamp(1.2rem,4.5vw,2.8rem)] font-extralight leading-tight"
        style={{ color: 'var(--text-primary)' }}>
        {words}
      </span>
      {config.format === '12h' && (
        <span className="text-[clamp(0.5rem,1.5vw,0.9rem)] font-light opacity-30 mt-2 tracking-widest uppercase"
          style={{ color: 'var(--text-secondary)' }}>
          {period.trim()}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function ClockWidget({ widget, onConfigChange }: WidgetProps) {
  const config: ClockConfig = {
    style: 'minimal-digital',
    format: '12h',
    showSeconds: true,
    ...(widget.config as Partial<ClockConfig>),
  };

  const [now, setNow] = useState(() => new Date());
  const prevRef = useRef(new Date());
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Use rAF for analog (smooth second sweep), setInterval for others
    if (config.style === 'analog') {
      const tick = () => {
        prevRef.current = now;
        setNow(new Date());
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    } else {
      const tick = () => {
        setNow((prev) => {
          prevRef.current = prev;
          return new Date();
        });
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => {
        if (intervalRef.current !== null) clearInterval(intervalRef.current);
      };
    }
  }, [config.style]);

  switch (config.style) {
    case 'analog':
      return <AnalogClock now={now} config={config} />;
    case 'flip-clock':
      return <FlipClock now={now} config={config} prev={prevRef.current} />;
    case 'binary':
      return <BinaryClock now={now} config={config} />;
    case 'word-clock':
      return <WordClock now={now} config={config} />;
    case 'minimal-digital':
    default:
      return <MinimalDigital now={now} config={config} />;
  }
}
