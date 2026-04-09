'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GridLayout, noCompactor } from 'react-grid-layout';
import type { Layout, LayoutItem } from 'react-grid-layout';
import { useLayoutStore, usePreferenceStore, usePremiumStore } from '@/stores';
import { widgetRegistry } from '@/lib/widgetRegistry';
import {
  GRID_COLS,
  GRID_ROWS,
  GRID_MARGIN,
  GRID_PADDING,
  HEADER_HEIGHT,
  MAX_IFRAMES,
} from '@/lib/constants';
import { WidgetContainer } from './WidgetContainer';

import 'react-grid-layout/css/styles.css';

interface DashboardGridProps {
  onUpgrade: () => void;
}

export function DashboardGrid({ onUpgrade }: DashboardGridProps) {
  const activeSpaceId = usePreferenceStore((s) => s.activeSpaceId);
  const spaces = useLayoutStore((s) => s.spaces);
  const updateWidgetPosition = useLayoutStore((s) => s.updateWidgetPosition);
  const updateWidgetSize = useLayoutStore((s) => s.updateWidgetSize);
  const canAccessFeature = usePremiumStore((s) => s.canAccessFeature);

  const isPremium = canAccessFeature('premium');
  const activeSpace = useMemo(
    () => spaces.find((s) => s.id === activeSpaceId),
    [spaces, activeSpaceId]
  );
  const widgets = activeSpace?.widgets ?? [];

  // Track iframe count
  const iframeCount = useMemo(() => {
    return widgets.filter((w) => {
      const entry = widgetRegistry[w.type];
      return entry.maxIframes && entry.maxIframes > 0;
    }).length;
  }, [widgets]);

  useEffect(() => {
    if (iframeCount > MAX_IFRAMES) {
      console.warn(
        `[DashboardGrid] Active iframe widget count (${iframeCount}) exceeds maximum (${MAX_IFRAMES}). Performance may be degraded.`
      );
    }
  }, [iframeCount]);

  // Responsive row height calculation
  const [rowHeight, setRowHeight] = useState(120);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    function recalculate() {
      const vh = window.innerHeight;
      setRowHeight(Math.floor((vh - HEADER_HEIGHT) / GRID_ROWS));
      setContainerWidth(window.innerWidth);
    }

    recalculate();

    let timeoutId: ReturnType<typeof setTimeout>;
    function debouncedRecalculate() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(recalculate, 200);
    }

    window.addEventListener('resize', debouncedRecalculate);
    return () => {
      window.removeEventListener('resize', debouncedRecalculate);
      clearTimeout(timeoutId);
    };
  }, []);

  // Build RGL layout from widgets
  const layout: Layout = useMemo(
    () =>
      widgets.map((widget) => {
        const entry = widgetRegistry[widget.type];
        return {
          i: widget.id,
          x: widget.position.x,
          y: widget.position.y,
          w: widget.size.w,
          h: widget.size.h,
          minW: entry.minSize.w,
          minH: entry.minSize.h,
          static: !isPremium,
        };
      }),
    [widgets, isPremium]
  );

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      newLayout.forEach((item: LayoutItem) => {
        const widget = widgets.find((w) => w.id === item.i);
        if (!widget) return;

        // Only update if position or size actually changed
        if (widget.position.x !== item.x || widget.position.y !== item.y) {
          updateWidgetPosition(activeSpaceId, item.i, {
            x: item.x,
            y: item.y,
          });
        }
        if (widget.size.w !== item.w || widget.size.h !== item.h) {
          updateWidgetSize(activeSpaceId, item.i, {
            w: item.w,
            h: item.h,
          });
        }
      });
    },
    [widgets, activeSpaceId, updateWidgetPosition, updateWidgetSize]
  );

  // Don't render until we have container width (avoids flash)
  if (!containerWidth) {
    return null;
  }

  return (
    <GridLayout
      className="dashboard-grid"
      width={containerWidth}
      gridConfig={{
        cols: GRID_COLS,
        rowHeight,
        margin: GRID_MARGIN,
        containerPadding: GRID_PADDING,
      }}
      dragConfig={{
        enabled: isPremium,
      }}
      resizeConfig={{
        enabled: isPremium,
      }}
      compactor={noCompactor}
      layout={layout}
      onLayoutChange={handleLayoutChange}
    >
      {widgets.map((widget) => (
        <div key={widget.id}>
          <WidgetContainer widget={widget} onUpgrade={onUpgrade} />
        </div>
      ))}
    </GridLayout>
  );
}
