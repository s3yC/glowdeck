'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useLayoutStore, usePreferenceStore, usePremiumStore } from '@/stores';
import { defaultWidgetsBySpaceId } from '@/stores/layoutStore';
import type { GridConfig } from '@/types';
import { GRID_COLS, GRID_MARGIN, GRID_PADDING } from '@/lib/constants';

interface SpaceSwitcherProps {
  onOpenSettings?: () => void;
}

export function SpaceSwitcher({ onOpenSettings }: SpaceSwitcherProps) {
  const spaces = useLayoutStore((s) => s.spaces);
  const activeSpaceId = usePreferenceStore((s) => s.activeSpaceId);
  const setActiveSpaceId = usePreferenceStore((s) => s.setActiveSpaceId);
  const setActiveSpace = useLayoutStore((s) => s.setActiveSpace);
  const createSpace = useLayoutStore((s) => s.createSpace);
  const updateSpace = useLayoutStore((s) => s.updateSpace);
  const canAccessPremium = usePremiumStore((s) => s.canAccessFeature);

  const isPremium = canAccessPremium('premium');

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSwitchSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    setActiveSpace(spaceId);
  };

  const handleCreateSpace = () => {
    if (!isPremium) return;
    const customCount = spaces.filter((s) => !s.isDefault).length + 1;
    const icons = ['\u{1F3AE}', '\u{1F4DA}', '\u{1F3B5}', '\u{1F9D8}', '\u{1F319}', '\u{2B50}', '\u{1F525}', '\u{1F680}'];
    const defaultGridConfig: GridConfig = {
      cols: GRID_COLS,
      rowHeight: 120,
      margin: GRID_MARGIN,
      padding: GRID_PADDING,
    };
    const newSpace = {
      id: nanoid(),
      name: `Custom ${customCount}`,
      icon: icons[customCount % icons.length],
      widgets: [],
      gridConfig: defaultGridConfig,
      isDefault: false,
      createdAt: Date.now(),
    };
    createSpace(newSpace);
    handleSwitchSpace(newSpace.id);
  };

  const handleResetSpace = () => {
    setShowResetConfirm(true);
  };

  const confirmResetSpace = () => {
    // Reset to default widgets for this space (or empty if no defaults exist)
    const defaults = defaultWidgetsBySpaceId[activeSpaceId] ?? [];
    updateSpace(activeSpaceId, { widgets: [...defaults] });
    setShowResetConfirm(false);
  };

  const handleClearSpace = () => {
    setShowClearConfirm(true);
  };

  const confirmClearSpace = () => {
    updateSpace(activeSpaceId, { widgets: [] });
    setShowClearConfirm(false);
  };

  const handleSaveLayout = () => {
    // Layout is auto-saved via IndexedDB — show visual confirmation
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  return (
    <div
      className="flex items-center justify-between px-3 border-b"
      style={{
        height: '48px',
        minHeight: '48px',
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Space tabs */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {spaces.map((space) => {
          const isActive = space.id === activeSpaceId;
          return (
            <button
              key={space.id}
              onClick={() => handleSwitchSpace(space.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <span>{space.icon}</span>
              <span>{space.name}</span>
            </button>
          );
        })}

        {/* Add space button (premium only) */}
        {isPremium && (
          <button
            onClick={handleCreateSpace}
            className="flex items-center justify-center w-7 h-7 rounded-md text-sm transition-colors"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'transparent',
            }}
            title="Create new Space"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-1">
        {/* Reset Space */}
        <button
          onClick={handleResetSpace}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Reset Space"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>

        {/* Clear Space */}
        <button
          onClick={handleClearSpace}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Clear Space"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>

        {/* Save Layout */}
        <button
          onClick={handleSaveLayout}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Save Layout"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>

        {/* Settings gear */}
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Settings"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="rounded-xl p-6 max-w-sm mx-4"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Load Defaults?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Are you sure? This will replace all current widgets with the default layout for this space.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmResetSpace}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: '#fff', backgroundColor: '#ef4444' }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="rounded-xl p-6 max-w-sm mx-4"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Clear Space?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Are you sure? This will remove all widgets from this space.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmClearSpace}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: '#fff', backgroundColor: '#ef4444' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save toast */}
      {showSavedToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--accent)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-modal)',
          }}
        >
          Layout saved!
        </div>
      )}
    </div>
  );
}
