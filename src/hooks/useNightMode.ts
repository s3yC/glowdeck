'use client';
import { useEffect } from 'react';
import { usePreferenceStore } from '@/stores';

/**
 * Check if the current time falls within the night mode schedule.
 * Handles midnight crossing (e.g., 22:00 to 07:00).
 */
function isInSchedule(startTime: string, endTime: string): boolean {
  const now = new Date();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Same-day range (e.g., 09:00 to 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Overnight range (e.g., 22:00 to 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function useNightMode() {
  const { enabled, autoSchedule, startTime, endTime } = usePreferenceStore(
    (s) => s.nightMode
  );

  useEffect(() => {
    const apply = () => {
      const active = enabled && (!autoSchedule || isInSchedule(startTime, endTime));
      document.documentElement.classList.toggle('night-mode', active);
    };

    apply();
    const interval = setInterval(apply, 60_000);
    return () => clearInterval(interval);
  }, [enabled, autoSchedule, startTime, endTime]);
}
