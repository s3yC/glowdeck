'use client';

import { useState, useMemo, useCallback } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0 = Sun
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CalendarWidget({ widget }: WidgetProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const isToday = useCallback(
    (day: number) =>
      day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear(),
    [viewMonth, viewYear, today],
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  );

  // Build cell array: leading blanks, days, trailing blanks
  const cells: { day: number; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevMonthDays - firstDay + 1 + i, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true });
  }
  // Fill to complete last row
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, isCurrentMonth: false });
  }

  return (
    <div className="flex flex-col h-full px-3 py-2 select-none" style={{ color: 'var(--text-primary)' }}>
      {/* Header: nav + month/year */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Previous month"
        >
          &#x276E;
        </button>

        <button
          onClick={goToToday}
          className="text-[clamp(0.65rem,1.6vw,0.9rem)] font-medium tracking-wide hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-primary)' }}
        >
          {MONTH_NAMES[viewMonth]} {viewYear}
        </button>

        <button
          onClick={nextMonth}
          className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Next month"
        >
          &#x276F;
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[clamp(0.4rem,1vw,0.6rem)] font-medium uppercase tracking-wider py-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0 flex-1">
        {cells.map((cell, i) => {
          const todayMatch = cell.isCurrentMonth && isToday(cell.day);
          return (
            <div
              key={i}
              className="flex items-center justify-center aspect-square text-[clamp(0.4rem,1.2vw,0.75rem)]"
              style={{
                color: !cell.isCurrentMonth
                  ? 'var(--text-muted)'
                  : todayMatch
                  ? 'var(--bg-primary)'
                  : 'var(--text-primary)',
                background: todayMatch ? 'var(--accent)' : 'transparent',
                borderRadius: todayMatch ? '50%' : undefined,
                fontWeight: todayMatch ? 600 : 400,
                opacity: cell.isCurrentMonth ? 1 : 0.3,
              }}
            >
              {cell.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
