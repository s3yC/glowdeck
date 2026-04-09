'use client';

import { useState, useCallback } from 'react';
import type { WidgetType } from '@/types';

/* ------------------------------------------------------------------ */
/*  Settings field definitions                                         */
/* ------------------------------------------------------------------ */
interface SettingsFieldBase {
  key: string;
  label: string;
}

interface SelectField extends SettingsFieldBase {
  type: 'select';
  options: string[];
}

interface ToggleField extends SettingsFieldBase {
  type: 'toggle';
}

interface TextField extends SettingsFieldBase {
  type: 'text';
}

interface NumberField extends SettingsFieldBase {
  type: 'number';
}

interface DatetimeField extends SettingsFieldBase {
  type: 'datetime';
}

type SettingsField = SelectField | ToggleField | TextField | NumberField | DatetimeField;

const widgetSettingsConfig: Partial<Record<WidgetType, SettingsField[]>> = {
  clock: [
    { key: 'style', label: 'Style', type: 'select', options: ['minimal-digital', 'analog', 'flip-clock', 'binary', 'word-clock'] },
    { key: 'format', label: 'Format', type: 'select', options: ['12h', '24h'] },
    { key: 'showSeconds', label: 'Show Seconds', type: 'toggle' },
  ],
  date: [
    { key: 'format', label: 'Format', type: 'select', options: ['full', 'short', 'minimal'] },
  ],
  calendar: [
    { key: 'startOnMonday', label: 'Start on Monday', type: 'toggle' },
  ],
  weather: [
    { key: 'latitude', label: 'Latitude', type: 'number' },
    { key: 'longitude', label: 'Longitude', type: 'number' },
    { key: 'units', label: 'Units', type: 'select', options: ['fahrenheit', 'celsius'] },
  ],
  countdown: [
    { key: 'targetDate', label: 'Target Date', type: 'datetime' },
    { key: 'label', label: 'Label', type: 'text' },
  ],
  quote: [
    { key: 'category', label: 'Category', type: 'select', options: ['inspirational', 'tech', 'stoic'] },
  ],
  youtube: [
    { key: 'videoUrl', label: 'YouTube URL', type: 'text' },
    { key: 'loop', label: 'Loop', type: 'toggle' },
  ],
  music: [
    { key: 'spotifyUrl', label: 'Spotify URL', type: 'text' },
  ],
  stocks: [
    { key: 'symbols', label: 'Symbols (comma-separated)', type: 'text' },
    { key: 'chartType', label: 'Chart Type', type: 'select', options: ['mini', 'advanced', 'ticker'] },
  ],
  'photo-frame': [
    { key: 'interval', label: 'Slide Interval (ms)', type: 'number' },
    { key: 'transition', label: 'Transition', type: 'select', options: ['fade', 'slide'] },
  ],
  pomodoro: [
    { key: 'workMinutes', label: 'Work (min)', type: 'number' },
    { key: 'breakMinutes', label: 'Break (min)', type: 'number' },
    { key: 'longBreakMinutes', label: 'Long Break (min)', type: 'number' },
    { key: 'sessionsBeforeLongBreak', label: 'Sessions before Long Break', type: 'number' },
  ],
  'alarm-clock': [
    { key: 'alarmTime', label: 'Alarm Time (HH:MM)', type: 'text' },
    { key: 'enabled', label: 'Enabled', type: 'toggle' },
    { key: 'sound', label: 'Sound', type: 'select', options: ['classic', 'gentle', 'digital'] },
    { key: 'label', label: 'Label', type: 'text' },
  ],
  'wifi-usage': [
    { key: 'pollInterval', label: 'Poll Interval (ms)', type: 'number' },
  ],
  'cpu-usage': [
    { key: 'pollInterval', label: 'Poll Interval (ms)', type: 'number' },
    { key: 'displayMode', label: 'Display Mode', type: 'select', options: ['gauge', 'bar'] },
  ],
  'memory-usage': [
    { key: 'pollInterval', label: 'Poll Interval (ms)', type: 'number' },
  ],
  'storage-usage': [
    { key: 'pollInterval', label: 'Poll Interval (ms)', type: 'number' },
  ],
  'eth-usage': [
    { key: 'pollInterval', label: 'Poll Interval (ms)', type: 'number' },
    { key: 'resetOnSwitch', label: 'Reset on Space Switch', type: 'toggle' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface WidgetSettingsProps {
  widgetType: WidgetType;
  currentConfig: Record<string, unknown>;
  onSave: (config: Record<string, unknown>) => void;
  onCancel: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function WidgetSettings({
  widgetType,
  currentConfig,
  onSave,
  onCancel,
}: WidgetSettingsProps) {
  const fields = widgetSettingsConfig[widgetType] ?? [];
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...currentConfig });

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    onSave(draft);
  };

  if (fields.length === 0) {
    return (
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      >
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          No configurable settings for this widget.
        </p>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Settings
        </span>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {fields.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={draft[field.key]}
            onChange={(val) => handleFieldChange(field.key, val)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field renderer                                                     */
/* ------------------------------------------------------------------ */
function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: SettingsField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const labelStyle = { color: 'var(--text-secondary)' };
  const inputStyle = {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  };

  switch (field.type) {
    case 'select':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium" style={labelStyle}>{field.label}</span>
          <select
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-md px-2 py-1.5 text-xs outline-none"
            style={inputStyle}
          >
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      );

    case 'toggle':
      return (
        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="text-[11px] font-medium" style={labelStyle}>{field.label}</span>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            onClick={() => onChange(!value)}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{
              backgroundColor: value ? 'var(--accent)' : 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform"
              style={{
                backgroundColor: 'var(--text-primary)',
                transform: value ? 'translateX(16px)' : 'translateX(0)',
              }}
            />
          </button>
        </label>
      );

    case 'text':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium" style={labelStyle}>{field.label}</span>
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-md px-2 py-1.5 text-xs outline-none"
            style={inputStyle}
          />
        </label>
      );

    case 'number':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium" style={labelStyle}>{field.label}</span>
          <input
            type="number"
            value={value !== undefined && value !== null ? Number(value) : ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className="rounded-md px-2 py-1.5 text-xs outline-none"
            style={inputStyle}
          />
        </label>
      );

    case 'datetime':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium" style={labelStyle}>{field.label}</span>
          <input
            type="datetime-local"
            value={value ? String(value).slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="rounded-md px-2 py-1.5 text-xs outline-none"
            style={{
              ...inputStyle,
              colorScheme: 'dark',
            }}
          />
        </label>
      );

    default:
      return null;
  }
}
