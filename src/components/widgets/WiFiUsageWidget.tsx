'use client';

import { useState, useEffect } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
interface WiFiConfig {
  pollInterval: number;
}

/* ------------------------------------------------------------------ */
/*  Network info types (Network Information API)                       */
/* ------------------------------------------------------------------ */
interface NetworkInfo {
  type: string;          // 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'
  downlink: number;      // Mbps
  effectiveType: string; // '4g' | '3g' | '2g' | 'slow-2g'
  rtt: number;           // round-trip time in ms
}

interface NavigatorConnection {
  type?: string;
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
}

function getNetworkInfo(): NetworkInfo | null {
  const nav = navigator as Navigator & { connection?: NavigatorConnection };
  const conn = nav.connection;
  if (!conn) return null;
  return {
    type: conn.type ?? 'unknown',
    downlink: conn.downlink ?? 0,
    effectiveType: conn.effectiveType ?? 'unknown',
    rtt: conn.rtt ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Stat row                                                           */
/* ------------------------------------------------------------------ */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[clamp(0.4rem,0.9vw,0.6rem)] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-[clamp(0.55rem,1.2vw,0.8rem)] font-medium" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function WiFiUsageWidget({ widget }: WidgetProps) {
  const config: WiFiConfig = {
    pollInterval: 5000,
    ...(widget.config as Partial<WiFiConfig>),
  };

  const [info, setInfo] = useState<NetworkInfo | null>(() => getNetworkInfo());

  useEffect(() => {
    const poll = () => setInfo(getNetworkInfo());
    poll();
    const interval = setInterval(poll, config.pollInterval);
    return () => clearInterval(interval);
  }, [config.pollInterval]);

  if (!info) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <span className="text-[clamp(1rem,3vw,1.6rem)]" style={{ color: 'var(--text-muted)' }}>
          {'\u{1F4F6}'}
        </span>
        <span className="text-[clamp(0.5rem,1.1vw,0.75rem)]" style={{ color: 'var(--text-secondary)' }}>
          Network info not available in this browser
        </span>
      </div>
    );
  }

  const typeLabel = info.type.charAt(0).toUpperCase() + info.type.slice(1);

  return (
    <div className="flex flex-col justify-center h-full gap-2 px-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[clamp(0.7rem,1.5vw,1rem)]">{'\u{1F4F6}'}</span>
        <span className="text-[clamp(0.5rem,1.1vw,0.75rem)] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Network
        </span>
      </div>

      <div className="space-y-1.5">
        <StatRow label="Type" value={typeLabel} />
        <StatRow label="Speed" value={`${info.downlink} Mbps`} />
        <StatRow label="Effective" value={info.effectiveType.toUpperCase()} />
        <StatRow label="RTT" value={`${info.rtt} ms`} />
      </div>
    </div>
  );
}
