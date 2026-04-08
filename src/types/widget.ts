import React from 'react';

export type WidgetType =
  | 'clock' | 'date' | 'calendar' | 'weather' | 'countdown' | 'quote'
  | 'youtube' | 'music' | 'stocks' | 'iframe' | 'photo-frame' | 'pomodoro';

export type WidgetTier = 'free' | 'premium';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  tier: WidgetTier;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { w: number; h: number };
}

export interface WidgetRegistryEntry {
  type: WidgetType;
  displayName: string;
  description: string;
  tier: WidgetTier;
  icon: string;
  component: React.LazyExoticComponent<React.ComponentType<WidgetProps>>;
  defaultConfig: Record<string, unknown>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxIframes?: number;
}

export interface WidgetProps {
  widget: Widget;
  onConfigChange: (config: Record<string, unknown>) => void;
}
