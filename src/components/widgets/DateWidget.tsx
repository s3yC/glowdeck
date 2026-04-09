'use client';

import { useState, useEffect } from 'react';
import type { WidgetProps } from '@/types';

export default function DateWidget({ widget }: WidgetProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now);
  const dayNum = now.getDate();
  const year = now.getFullYear();

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 select-none text-center gap-1">
      {/* Day of week - prominent */}
      <span
        className="text-[clamp(1.2rem,4vw,2.4rem)] font-extralight tracking-widest uppercase"
        style={{ color: 'var(--text-primary)' }}
      >
        {dayOfWeek}
      </span>

      {/* Thin accent divider */}
      <div
        className="w-8 h-[1px] my-1 rounded-full"
        style={{ background: 'var(--accent)', opacity: 0.5 }}
      />

      {/* Full date below */}
      <span
        className="text-[clamp(0.6rem,1.8vw,1rem)] tracking-wider opacity-50"
        style={{ color: 'var(--text-secondary)' }}
      >
        {month} {dayNum}, {year}
      </span>
    </div>
  );
}
