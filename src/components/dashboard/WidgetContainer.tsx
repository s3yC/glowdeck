'use client';

import React, { Suspense, useState, useCallback } from 'react';
import type { Widget } from '@/types';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { usePremiumStore, useLayoutStore, usePreferenceStore } from '@/stores';
import { PremiumGate } from '@/components/premium/PremiumGate';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetSettings } from './WidgetSettings';

interface WidgetContainerProps {
  widget: Widget;
  onUpgrade: () => void;
}

export function WidgetContainer({ widget, onUpgrade }: WidgetContainerProps) {
  const registryEntry = widgetRegistry[widget.type as keyof typeof widgetRegistry];
  const canAccessFeature = usePremiumStore((s) => s.canAccessFeature);
  const canAccess = canAccessFeature(widget.tier);
  const activeSpaceId = usePreferenceStore((s) => s.activeSpaceId);
  const updateWidgetConfig = useLayoutStore((s) => s.updateWidgetConfig);
  const removeWidget = useLayoutStore((s) => s.removeWidget);

  const [showSettings, setShowSettings] = useState(false);

  // Skip rendering if widget type was removed from registry
  if (!registryEntry) {
    return null;
  }

  const Component = registryEntry.component;

  const handleConfigChange = useCallback(
    (config: Record<string, unknown>) => {
      updateWidgetConfig(activeSpaceId, widget.id, config);
    },
    [updateWidgetConfig, activeSpaceId, widget.id],
  );

  const handleRemove = useCallback(() => {
    removeWidget(activeSpaceId, widget.id);
  }, [removeWidget, activeSpaceId, widget.id]);

  const handleSettingsSave = useCallback(
    (config: Record<string, unknown>) => {
      handleConfigChange(config);
      setShowSettings(false);
    },
    [handleConfigChange],
  );

  return (
    <div
      className="widget-container w-full h-full group/widget"
      style={{ contain: 'layout style paint', position: 'relative' }}
    >
      {!canAccess ? (
        <PremiumGate
          widgetType={widget.type}
          displayName={registryEntry.displayName}
          description={registryEntry.description}
          onUpgrade={onUpgrade}
        />
      ) : (
        <WidgetErrorBoundary
          widgetId={widget.id}
          widgetType={widget.type}
        >
          <Suspense fallback={<WidgetSkeleton />}>
            <Component
              widget={widget}
              onConfigChange={handleConfigChange}
            />
          </Suspense>
        </WidgetErrorBoundary>
      )}

      {/* Hover toolbar — pointer devices only, rendered via CSS @media(hover:hover) */}
      {canAccess && (
        <div className="widget-toolbar">
          {/* Gear icon — settings */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
            className="flex items-center justify-center w-6 h-6 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Widget settings"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* X icon — remove */}
          <button
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            className="flex items-center justify-center w-6 h-6 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Remove widget"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Settings overlay */}
      {showSettings && (
        <WidgetSettings
          widgetType={widget.type}
          currentConfig={widget.config}
          onSave={handleSettingsSave}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
