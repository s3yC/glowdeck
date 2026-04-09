'use client';

import { useState, useEffect, useRef } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
interface EthConfig {
  pollInterval: number;
  resetOnSwitch: boolean;
}

/* ------------------------------------------------------------------ */
/*  Network stats                                                      */
/* ------------------------------------------------------------------ */
interface NetStats {
  totalBytes: number;
  requestCount: number;
  avgLatency: number;
  rate: number; // bytes per second (recent)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRate(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
}

/* ------------------------------------------------------------------ */
/*  Stat row                                                           */
/* ------------------------------------------------------------------ */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[clamp(0.35rem,0.8vw,0.55rem)] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-[clamp(0.5rem,1.1vw,0.75rem)] font-medium" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function EthUsageWidget({ widget }: WidgetProps) {
  const config: EthConfig = {
    pollInterval: 3000,
    resetOnSwitch: false,
    ...(widget.config as Partial<EthConfig>),
  };

  const [stats, setStats] = useState<NetStats>({
    totalBytes: 0,
    requestCount: 0,
    avgLatency: 0,
    rate: 0,
  });

  const accRef = useRef({
    totalBytes: 0,
    requestCount: 0,
    totalLatency: 0,
    lastSnapshot: 0,
    lastBytes: 0,
  });

  // Use PerformanceObserver to track resource timing
  useEffect(() => {
    const acc = accRef.current;
    acc.lastSnapshot = performance.now();

    // Process existing entries
    const existing = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    for (const entry of existing) {
      acc.totalBytes += entry.transferSize || 0;
      acc.requestCount++;
      const latency = entry.responseEnd - entry.requestStart;
      if (latency > 0) acc.totalLatency += latency;
    }

    // Observe new entries
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        for (const entry of entries) {
          acc.totalBytes += entry.transferSize || 0;
          acc.requestCount++;
          const latency = entry.responseEnd - entry.requestStart;
          if (latency > 0) acc.totalLatency += latency;
        }
      });
      observer.observe({ type: 'resource', buffered: false });
    } catch {
      // PerformanceObserver not supported
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  // Poll and compute stats
  useEffect(() => {
    const interval = setInterval(() => {
      const acc = accRef.current;
      const now = performance.now();
      const elapsed = (now - acc.lastSnapshot) / 1000; // seconds
      const bytesDelta = acc.totalBytes - acc.lastBytes;
      const rate = elapsed > 0 ? bytesDelta / elapsed : 0;

      acc.lastSnapshot = now;
      acc.lastBytes = acc.totalBytes;

      setStats({
        totalBytes: acc.totalBytes,
        requestCount: acc.requestCount,
        avgLatency: acc.requestCount > 0 ? Math.round(acc.totalLatency / acc.requestCount) : 0,
        rate,
      });
    }, config.pollInterval);

    return () => clearInterval(interval);
  }, [config.pollInterval]);

  return (
    <div className="flex flex-col justify-center h-full gap-2 px-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[clamp(0.6rem,1.2vw,0.85rem)]">{'\u{1F310}'}</span>
        <span className="text-[clamp(0.4rem,0.9vw,0.6rem)] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Network Traffic
        </span>
      </div>

      <div className="space-y-1.5">
        <StatRow label="Transferred" value={formatBytes(stats.totalBytes)} />
        <StatRow label="Requests" value={String(stats.requestCount)} />
        <StatRow label="Avg Latency" value={`${stats.avgLatency} ms`} />
        <StatRow label="Rate" value={formatRate(stats.rate)} />
      </div>

      <span className="text-[clamp(0.3rem,0.55vw,0.38rem)] opacity-40 mt-1" style={{ color: 'var(--text-muted)' }}>
        Since page load
      </span>
    </div>
  );
}
