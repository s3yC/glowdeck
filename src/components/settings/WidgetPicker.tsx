'use client';

import { nanoid } from 'nanoid';
import { widgetRegistry, getWidgetsByTier } from '@/lib/widgetRegistry';
import { useLayoutStore, usePreferenceStore, usePremiumStore } from '@/stores';
import type { WidgetRegistryEntry, Widget } from '@/types';

interface WidgetPickerProps {
  onClose?: () => void;
}

export function WidgetPicker({ onClose }: WidgetPickerProps) {
  const activeSpaceId = usePreferenceStore((s) => s.activeSpaceId);
  const addWidget = useLayoutStore((s) => s.addWidget);
  const canAccessFeature = usePremiumStore((s) => s.canAccessFeature);

  const allWidgets = Object.values(widgetRegistry);

  const handleAddWidget = (entry: WidgetRegistryEntry) => {
    const widget: Widget = {
      id: nanoid(),
      type: entry.type,
      title: entry.displayName,
      tier: entry.tier,
      config: { ...entry.defaultConfig },
      position: { x: 0, y: 0 },
      size: { w: entry.defaultSize.w, h: entry.defaultSize.h },
    };

    addWidget(activeSpaceId, widget);
    onClose?.();
  };

  return (
    <div className="space-y-4">
      <h3
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Add Widget
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {allWidgets.map((entry) => {
          const isPremiumWidget = entry.tier === 'premium';
          const canAdd = canAccessFeature(entry.tier);

          return (
            <button
              key={entry.type}
              onClick={() => handleAddWidget(entry)}
              className="flex flex-col items-start gap-1.5 p-3 rounded-xl text-left transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg">{entry.icon}</span>
                <span
                  className="text-sm font-medium flex-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {entry.displayName}
                </span>
                {isPremiumWidget && (
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    }}
                  >
                    PRO
                  </span>
                )}
              </div>
              <span
                className="text-xs leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                {entry.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
