'use client';

export function WidgetSkeleton() {
  return (
    <div className="w-full h-full p-4 animate-pulse">
      <div
        className="h-4 rounded w-1/3 mb-3"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
      <div
        className="h-3 rounded w-2/3 mb-2"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
      <div
        className="h-3 rounded w-1/2"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
    </div>
  );
}
