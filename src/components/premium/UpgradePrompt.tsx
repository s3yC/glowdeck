'use client';

import { useEffect, useCallback } from 'react';
import { usePremiumStore } from '@/stores';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const benefits = [
  { icon: '🎛️', text: 'Drag & resize widgets to build your perfect layout' },
  { icon: '🎬', text: 'YouTube, Spotify, and Stocks widgets' },
  { icon: '🎨', text: 'Custom Spaces & accent colors' },
  { icon: '🍅', text: 'Pomodoro timer & Photo Frame slideshow' },
];

export function UpgradePrompt({ isOpen, onClose }: UpgradePromptProps) {
  const recordUpgradePrompt = usePremiumStore((s) => s.recordUpgradePrompt);

  useEffect(() => {
    if (isOpen) {
      recordUpgradePrompt();
    }
  }, [isOpen, recordUpgradePrompt]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Backdrop click area */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-8 border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Keep Your Premium Experience?
        </h2>
        <p
          className="text-center text-sm mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Unlock the full GlowDeck experience
        </p>

        {/* Benefits list */}
        <ul className="space-y-4 mb-8">
          {benefits.map((benefit) => (
            <li key={benefit.text} className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{benefit.icon}</span>
              <span
                className="text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                {benefit.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <button
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
            }}
          >
            Upgrade to Pro
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium text-sm transition-colors"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'transparent',
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
