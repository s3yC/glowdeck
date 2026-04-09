'use client';

import { useEffect, useCallback, useState } from 'react';
import { ThemeSettings } from './ThemeSettings';
import { SpaceManager } from './SpaceManager';
import { WidgetPicker } from './WidgetPicker';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'theme' | 'spaces' | 'widgets';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');

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

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'theme', label: 'Theme' },
    { id: 'spaces', label: 'Spaces' },
    { id: 'widgets', label: 'Widgets' },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'opacity 350ms ease 50ms',
        }}
        onClick={onClose}
      />

      {/* Slide-in drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-full overflow-y-auto"
        style={{
          width: '400px',
          maxWidth: '90vw',
          backgroundColor: 'rgba(17, 17, 17, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderLeft: '1px solid var(--border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: isOpen
            ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab navigation */}
        <div
          className="flex px-5 pt-3 gap-1 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-2 text-sm font-medium transition-colors"
              style={{
                color:
                  activeTab === tab.id
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
                borderBottom:
                  activeTab === tab.id
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 py-5">
          {activeTab === 'theme' && <ThemeSettings />}
          {activeTab === 'spaces' && <SpaceManager />}
          {activeTab === 'widgets' && <WidgetPicker onClose={onClose} />}
        </div>
      </div>
    </>
  );
}
