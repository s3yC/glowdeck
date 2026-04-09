'use client';

import { useState, useEffect } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
interface MemoryConfig {
  pollInterval: number;
}

/* ------------------------------------------------------------------ */
/*  Types for performance.memory (Chrome)                              */
/* ------------------------------------------------------------------ */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryData {
  used: number;
  total: number;
  limit: number;
  percent: number;
}

function getMemoryData(): MemoryData | null {
  const perf = performance as Performance & { memory?: PerformanceMemory };
  if (!perf.memory) return null;
  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = perf.memory;
  return {
    used: usedJSHeapSize,
    total: totalJSHeapSize,
    limit: jsHeapSizeLimit,
    percent: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100),
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Progress bar                                                       */
/* ------------------------------------------------------------------ */
function MemBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : 'var(--accent)';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[clamp(0.35rem,0.8vw,0.55rem)] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="text-[clamp(0.4rem,0.9vw,0.6rem)]" style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {formatBytes(value)}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MemoryUsageWidget({ widget }: WidgetProps) {
  const config: MemoryConfig = {
    pollInterval: 3000,
    ...(widget.config as Partial<MemoryConfig>),
  };

  const [data, setData] = useState<MemoryData | null>(() => getMemoryData());

  useEffect(() => {
    const poll = () => setData(getMemoryData());
    poll();
    const interval = setInterval(poll, config.pollInterval);
    return () => clearInterval(interval);
  }, [config.pollInterval]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <span className="text-[clamp(1rem,3vw,1.6rem)]" style={{ color: 'var(--text-muted)' }}>
          {'\u{1F4BE}'}
        </span>
        <span className="text-[clamp(0.5rem,1.1vw,0.75rem)]" style={{ color: 'var(--text-secondary)' }}>
          Memory info not available in this browser
        </span>
        <span className="text-[clamp(0.35rem,0.7vw,0.5rem)] opacity-40" style={{ color: 'var(--text-muted)' }}>
          Requires Chromium-based browser
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[clamp(0.6rem,1.2vw,0.85rem)]">{'\u{1F4BE}'}</span>
        <span className="text-[clamp(0.4rem,0.9vw,0.6rem)] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Memory
        </span>
      </div>

      {/* Percentage */}
      <span className="text-[clamp(1.2rem,3.5vw,2.5rem)] font-light" style={{ color: 'var(--text-primary)' }}>
        {data.percent}%
      </span>

      {/* Bars */}
      <div className="w-full space-y-2 px-1">
        <MemBar label="Used Heap" value={data.used} max={data.limit} />
        <MemBar label="Total Heap" value={data.total} max={data.limit} />
      </div>

      <span className="text-[clamp(0.3rem,0.6vw,0.4rem)] opacity-40" style={{ color: 'var(--text-muted)' }}>
        Limit: {formatBytes(data.limit)}
      </span>
    </div>
  );
}
