'use client';
import { useState, useEffect } from 'react';
import { usePreferenceStore } from '@/stores';
import { BURN_IN_SHIFT_PX, BURN_IN_INTERVAL_MS } from '@/lib/constants';

export function useBurnInProtection() {
  const enabled = usePreferenceStore((s) => s.burnInProtection);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const interval = setInterval(() => {
      setOffset({
        x: Math.round((Math.random() - 0.5) * 2 * BURN_IN_SHIFT_PX),
        y: Math.round((Math.random() - 0.5) * 2 * BURN_IN_SHIFT_PX),
      });
    }, BURN_IN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled]);

  return offset;
}
