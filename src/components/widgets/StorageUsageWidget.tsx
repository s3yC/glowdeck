'use client';

import { useState, useEffect } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
interface StorageConfig {
  pollInterval: number;
}

/* ------------------------------------------------------------------ */
/*  Data types                                                         */
/* ------------------------------------------------------------------ */
interface StorageData {
  usage: number;
  quota: number;
  percent: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/* ------------------------------------------------------------------ */
/*  Circular gauge                                                     */
/* ------------------------------------------------------------------ */
function StorageGauge({ percent }: { percent: number }) {
  const radius = 36;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent > 85 ? '#ef4444' : percent > 60 ? '#f59e0b' : 'var(--accent)';

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
        x="45" y="42"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize="16"
        fontWeight="300"
        fontFamily="inherit"
      >
        {percent}%
      </text>
      <text
        x="45" y="56"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-muted)"
        fontSize="7"
        fontFamily="inherit"
      >
        used
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function StorageUsageWidget({ widget }: WidgetProps) {
  const config: StorageConfig = {
    pollInterval: 10000,
    ...(widget.config as Partial<StorageConfig>),
  };

  const [data, setData] = useState<StorageData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        if (!navigator.storage?.estimate) {
          setError(true);
          return;
        }
        const estimate = await navigator.storage.estimate();
        if (!active) return;
        const usage = estimate.usage ?? 0;
        const quota = estimate.quota ?? 0;
        setData({
          usage,
          quota,
          percent: quota > 0 ? Math.round((usage / quota) * 100) : 0,
        });
      } catch {
        if (active) setError(true);
      }
    };

    poll();
    const interval = setInterval(poll, config.pollInterval);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [config.pollInterval]);

  if (error || (!data && typeof navigator !== 'undefined' && !navigator.storage?.estimate)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <span className="text-[clamp(1rem,3vw,1.6rem)]" style={{ color: 'var(--text-muted)' }}>
          {'\u{1F4E6}'}
        </span>
        <span className="text-[clamp(0.5rem,1.1vw,0.75rem)]" style={{ color: 'var(--text-secondary)' }}>
          Storage estimation not available
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[clamp(0.5rem,1vw,0.7rem)]" style={{ color: 'var(--text-muted)' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 px-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[clamp(0.6rem,1.2vw,0.85rem)]">{'\u{1F4E6}'}</span>
        <span className="text-[clamp(0.4rem,0.9vw,0.6rem)] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Storage
        </span>
      </div>

      <StorageGauge percent={data.percent} />

      <div className="text-center">
        <span className="text-[clamp(0.4rem,0.8vw,0.55rem)]" style={{ color: 'var(--text-secondary)' }}>
          {formatBytes(data.usage)} / {formatBytes(data.quota)}
        </span>
      </div>
    </div>
  );
}
