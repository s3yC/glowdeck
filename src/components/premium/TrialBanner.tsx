'use client';

import { usePremiumStatus } from '@/hooks/usePremiumStatus';

export function TrialBanner() {
  const { tier, daysRemaining } = usePremiumStatus();

  if (tier !== 'trial') return null;

  return (
    <div
      className="flex items-center justify-center py-1.5 text-xs font-medium"
      style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#ffffff',
      }}
    >
      <span>
        🎉 {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left in your
        free trial
      </span>
    </div>
  );
}
