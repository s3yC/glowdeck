'use client';

import type { WidgetType } from '@/types';
import { usePremiumStore } from '@/stores';

interface PremiumGateProps {
  widgetType: WidgetType;
  displayName: string;
  description: string;
  onUpgrade: () => void;
}

function getBenefitText(widgetType: WidgetType): string {
  const benefits: Partial<Record<WidgetType, string>> = {
    youtube: 'Watch videos right on your dashboard',
    music: 'Play music without leaving your dashboard',
    stocks: 'Track your portfolio in real-time',
    'photo-frame': 'Display your favorite photos in a slideshow',
    pomodoro: 'Stay focused with timed work sessions',
    'cpu-usage': 'Monitor CPU utilization in real-time',
    'memory-usage': 'Track JavaScript heap memory usage',
  };
  return benefits[widgetType] ?? 'Unlock this widget with GlowDeck PRO';
}

export function PremiumGate({
  widgetType,
  displayName,
  description,
  onUpgrade,
}: PremiumGateProps) {
  const canShowUpgradePrompt = usePremiumStore((s) => s.canShowUpgradePrompt);
  const trialStartDate = usePremiumStore((s) => s.trialStartDate);

  const benefitText = getBenefitText(widgetType);
  const hasTrialed = trialStartDate !== null;

  const handleClick = () => {
    if (canShowUpgradePrompt()) {
      onUpgrade();
    }
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Blurred background layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: 0.6,
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-3 p-4 text-center">
        {/* PRO badge */}
        <span
          className="pro-badge-shimmer px-3 py-1 rounded-full text-xs font-bold text-white"
        >
          PRO
        </span>

        {/* Widget name */}
        <h3
          className="font-semibold"
          style={{
            color: 'var(--text-primary)',
            fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
          }}
        >
          {displayName}
        </h3>

        {/* Benefit text */}
        <p
          className="text-sm max-w-[200px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {benefitText}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleClick}
          className="px-6 py-2 rounded-lg font-medium text-white text-sm transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
          }}
        >
          {hasTrialed ? 'Upgrade to Pro' : 'Start Free Trial'}
        </button>
      </div>
    </div>
  );
}
