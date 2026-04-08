import type { Widget } from './widget';

export interface GridConfig {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  padding: [number, number];
}

export interface Space {
  id: string;
  name: string;
  icon: string;
  widgets: Widget[];
  gridConfig: GridConfig;
  isDefault: boolean;
  createdAt: number;
}
