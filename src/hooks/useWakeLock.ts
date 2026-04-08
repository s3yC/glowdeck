'use client';
import { useEffect, useRef } from 'react';
import { usePreferenceStore } from '@/stores';

export function useWakeLock() {
  const enabled = usePreferenceStore((s) => s.wakeLock);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let active = true;

    const request = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          if (active) request(); // re-acquire on release (e.g., tab switch)
        });
      } catch {
        /* user denied or not supported */
      }
    };

    request();

    return () => {
      active = false;
      wakeLockRef.current?.release();
    };
  }, [enabled]);
}
