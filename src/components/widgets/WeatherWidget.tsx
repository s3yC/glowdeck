'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WidgetProps } from '@/types';
import { POLLING_WEATHER_MS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Config types                                                       */
/* ------------------------------------------------------------------ */
interface WeatherConfig {
  latitude: number;
  longitude: number;
  units: 'fahrenheit' | 'celsius';
  pollInterval: number;
}

/* ------------------------------------------------------------------ */
/*  WMO weather-code mapping                                           */
/* ------------------------------------------------------------------ */
interface WeatherCondition {
  label: string;
  icon: string;
}

function wmoToCondition(code: number): WeatherCondition {
  if (code === 0) return { label: 'Clear', icon: '\u2600\uFE0F' };
  if (code <= 3) return { label: 'Cloudy', icon: '\u26C5' };
  if (code <= 48) return { label: 'Fog', icon: '\uD83C\uDF2B\uFE0F' };
  if (code <= 67) return { label: 'Rain', icon: '\uD83C\uDF27\uFE0F' };
  if (code <= 77) return { label: 'Snow', icon: '\u2744\uFE0F' };
  if (code <= 82) return { label: 'Showers', icon: '\uD83C\uDF26\uFE0F' };
  if (code <= 99) return { label: 'Thunderstorm', icon: '\u26C8\uFE0F' };
  return { label: 'Unknown', icon: '\uD83C\uDF24\uFE0F' };
}

/* ------------------------------------------------------------------ */
/*  Data types                                                         */
/* ------------------------------------------------------------------ */
interface WeatherData {
  currentTemp: number;
  weatherCode: number;
  highTemp: number;
  lowTemp: number;
  fetchedAt: number; // Date.now()
}

function celsiusToF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

function formatTemp(c: number, units: 'fahrenheit' | 'celsius'): string {
  const val = units === 'fahrenheit' ? celsiusToF(c) : Math.round(c);
  return `${val}\u00B0`;
}

function buildUrl(lat: number, lon: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
}

function stalenessText(fetchedAt: number): string {
  const mins = Math.floor((Date.now() - fetchedAt) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function WeatherWidget({ widget, onConfigChange }: WidgetProps) {
  const config: WeatherConfig = {
    latitude: 40.7128,
    longitude: -74.006,
    units: 'fahrenheit',
    pollInterval: POLLING_WEATHER_MS,
    ...(widget.config as Partial<WeatherConfig>),
  };

  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchWeather = useCallback(async () => {
    // Abort any in-flight request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(buildUrl(config.latitude, config.longitude), {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const weatherData: WeatherData = {
        currentTemp: json.current_weather?.temperature ?? 0,
        weatherCode: json.current_weather?.weathercode ?? 0,
        highTemp: json.daily?.temperature_2m_max?.[0] ?? 0,
        lowTemp: json.daily?.temperature_2m_min?.[0] ?? 0,
        fetchedAt: Date.now(),
      };

      setData(weatherData);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  }, [config.latitude, config.longitude]);

  useEffect(() => {
    setIsLoading(true);
    fetchWeather();
    const interval = setInterval(fetchWeather, config.pollInterval);
    return () => {
      clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [fetchWeather, config.pollInterval]);

  // Force staleness text to update every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  /* --- Loading state --- */
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-20 rounded" style={{ background: 'var(--bg-tertiary)' }} />
          <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-tertiary)' }} />
        </div>
      </div>
    );
  }

  /* --- Error state --- */
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
        <span className="text-[clamp(0.6rem,1.5vw,0.85rem)] opacity-60" style={{ color: 'var(--text-secondary)' }}>
          Weather unavailable
        </span>
        <span className="text-[clamp(0.45rem,1vw,0.65rem)] opacity-40" style={{ color: 'var(--text-muted)' }}>
          {error}
        </span>
        <button
          onClick={() => { setIsLoading(true); setError(null); fetchWeather(); }}
          className="px-3 py-1 rounded-md text-[clamp(0.45rem,1vw,0.65rem)] font-medium transition-colors"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const condition = wmoToCondition(data.weatherCode);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-3 select-none gap-1">
      {/* Condition icon + label */}
      <div className="flex items-center gap-2">
        <span className="text-[clamp(1.4rem,4vw,2.4rem)]">{condition.icon}</span>
        <span className="text-[clamp(0.55rem,1.4vw,0.8rem)] font-medium tracking-wide opacity-60"
          style={{ color: 'var(--text-secondary)' }}>
          {condition.label}
        </span>
      </div>

      {/* Current temp (large) */}
      <span className="text-[clamp(1.8rem,6vw,3.5rem)] font-extralight leading-none"
        style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {formatTemp(data.currentTemp, config.units)}
      </span>

      {/* High / Low */}
      <div className="flex items-center gap-3 text-[clamp(0.5rem,1.2vw,0.75rem)]"
        style={{ color: 'var(--text-secondary)' }}>
        <span className="opacity-70">
          H: {formatTemp(data.highTemp, config.units)}
        </span>
        <span className="opacity-70">
          L: {formatTemp(data.lowTemp, config.units)}
        </span>
      </div>

      {/* Staleness + error indicator */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[clamp(0.35rem,0.8vw,0.5rem)] tracking-wider opacity-30"
          style={{ color: 'var(--text-muted)' }}>
          {stalenessText(data.fetchedAt)}
        </span>
        {error && (
          <button
            onClick={() => { setIsLoading(true); setError(null); fetchWeather(); }}
            className="text-[clamp(0.35rem,0.8vw,0.5rem)] opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--accent)' }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
