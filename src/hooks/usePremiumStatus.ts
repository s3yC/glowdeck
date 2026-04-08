'use client';
import { useEffect } from 'react';
import { usePremiumStore } from '@/stores';

export function usePremiumStatus() {
  const checkTrialExpiry = usePremiumStore((s) => s.checkTrialExpiry);
  const tier = usePremiumStore((s) => s.tier);
  const trialEndDate = usePremiumStore((s) => s.trialEndDate);

  useEffect(() => {
    checkTrialExpiry();
  }, [checkTrialExpiry]);

  const daysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate - Date.now()) / 86_400_000))
    : 0;

  return { tier, daysRemaining };
}
