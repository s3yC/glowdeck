'use client';

import React, { Suspense } from 'react';
import type { Widget } from '@/types';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { usePremiumStore, useLayoutStore, usePreferenceStore } from '@/stores';
import { PremiumGate } from '@/components/premium/PremiumGate';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { WidgetSkeleton } from './WidgetSkeleton';

interface WidgetContainerProps {
  widget: Widget;
  onUpgrade: () => void;
}

export function WidgetContainer({ widget, onUpgrade }: WidgetContainerProps) {
  const registryEntry = widgetRegistry[widget.type];
  const canAccessFeature = usePremiumStore((s) => s.canAccessFeature);
  const canAccess = canAccessFeature(widget.tier);
  const activeSpaceId = usePreferenceStore((s) => s.activeSpaceId);
  const updateWidgetConfig = useLayoutStore((s) => s.updateWidgetConfig);

  const Component = registryEntry.component;

  const handleConfigChange = (config: Record<string, unknown>) => {
    updateWidgetConfig(activeSpaceId, widget.id, config);
  };

  return (
    <div
      className="widget-container w-full h-full"
      style={{ contain: 'layout style paint' }}
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
    </div>
  );
}
