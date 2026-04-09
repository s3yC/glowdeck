'use client';

import { useState, useEffect, useRef } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
interface CPUConfig {
  pollInterval: number;
  displayMode: 'gauge' | 'bar';
}

/* ------------------------------------------------------------------ */
/*  CPU estimation via main-thread blocking heuristic                  */
/* ------------------------------------------------------------------ */
function estimateCPU(callback: (usage: number) => void, interval: number) {
  let lastTime = performance.now();
  let frameCount = 0;
  let animId: number;

  const targetFPS = 60;

  const measure = () => {
    frameCount++;
    const now = performance.now();
    const elapsed = now - lastTime;

    if (elapsed >= interval) {
      const actualFPS = (frameCount / elapsed) * 1000;
      // If browser can hit 60fps, CPU is ~idle. Lower FPS = higher estimated load.
      const usage = Math.max(0, Math.min(100, Math.round((1 - actualFPS / targetFPS) * 100)));
      callback(usage);
      frameCount = 0;
      lastTime = now;
    }

    animId = requestAnimationFrame(measure);
  };

  animId = requestAnimationFrame(measure);
  return () => cancelAnimationFrame(animId);
}

/* ------------------------------------------------------------------ */
/*  Circular gauge                                                     */
/* ------------------------------------------------------------------ */
function CircularGauge({ value }: { value: number }) {
  const radius = 36;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color = value > 80 ? '#ef4444' : value > 50 ? '#f59e0b' : 'var(--accent)';

  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle
        cx="45" cy="45" r={radius}
        fill="none"
        stroke="var(--bg-tertiary)"
        strokeWidth={stroke}
      />
      <circle
        cx="45" cy="45" r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dashoffset 500ms ease' }}
      />
      <text
        x="45" y="45"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize="16"
        fontWeight="300"
        fontFamily="inherit"
      >
        {value}%
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Bar display                                                        */
/* ------------------------------------------------------------------ */
function BarDisplay({ value }: { value: number }) {
  const color = value > 80 ? '#ef4444' : value > 50 ? '#f59e0b' : 'var(--accent)';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[clamp(0.5rem,1vw,0.7rem)]" style={{ color: 'var(--text-muted)' }}>CPU Load</span>
        <span className="text-[clamp(0.6rem,1.3vw,0.85rem)] font-medium" style={{ color: 'var(--text-primary)' }}>{value}%</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CPUUsageWidget({ widget }: WidgetProps) {
  const config: CPUConfig = {
    pollInterval: 2000,
    displayMode: 'gauge',
    ...(widget.config as Partial<CPUConfig>),
  };

  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0;
  const [usage, setUsage] = useState(0);

  useEffect(() => {
    const cancel = estimateCPU(setUsage, config.pollInterval);
    return cancel;
  }, [config.pollInterval]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 px-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[clamp(0.6rem,1.2vw,0.85rem)]">{'\u{1F9E0}'}</span>
        <span className="text-[clamp(0.4rem,0.9vw,0.6rem)] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          CPU ({cores} cores)
        </span>
      </div>

      {/* Display */}
      {config.displayMode === 'gauge' ? (
        <CircularGauge value={usage} />
      ) : (
        <div className="w-full px-2">
          <BarDisplay value={usage} />
        </div>
      )}

      {/* Disclaimer */}
      <span className="text-[clamp(0.3rem,0.6vw,0.4rem)] opacity-40" style={{ color: 'var(--text-muted)' }}>
        Browser estimation only
      </span>
    </div>
  );
}
