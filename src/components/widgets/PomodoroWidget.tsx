'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config type                                                        */
/* ------------------------------------------------------------------ */
interface PomodoroConfig {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type TimerState = 'idle' | 'working' | 'break' | 'longBreak';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PomodoroWidget({ widget, onConfigChange }: WidgetProps) {
  const config: PomodoroConfig = {
    workMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    ...(widget.config as Partial<PomodoroConfig>),
  };

  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(config.workMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Derived values ---- */
  function getTotalSeconds(): number {
    switch (timerState) {
      case 'working':
        return config.workMinutes * 60;
      case 'break':
        return config.breakMinutes * 60;
      case 'longBreak':
        return config.longBreakMinutes * 60;
      default:
        return config.workMinutes * 60;
    }
  }

  const totalSeconds = getTotalSeconds();
  const progress = timerState === 'idle' ? 0 : 1 - secondsLeft / totalSeconds;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  function getStateLabel(): string {
    switch (timerState) {
      case 'working': return 'Focus';
      case 'break': return 'Break';
      case 'longBreak': return 'Long Break';
      default: return 'Ready';
    }
  }

  function getStateColor(): string {
    switch (timerState) {
      case 'working': return 'var(--accent, #ef4444)';
      case 'break': return '#22c55e';
      case 'longBreak': return '#3b82f6';
      default: return 'var(--text-muted, #6b7280)';
    }
  }

  /* ---- Timer tick ---- */
  useEffect(() => {
    if (timerState === 'idle' || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer complete — advance to next phase
          if (timerState === 'working') {
            const nextSession = completedSessions + 1;
            setCompletedSessions(nextSession);

            if (nextSession >= config.sessionsBeforeLongBreak) {
              setTimerState('longBreak');
              return config.longBreakMinutes * 60;
            } else {
              setTimerState('break');
              return config.breakMinutes * 60;
            }
          } else {
            // Break or long break complete — back to work
            if (timerState === 'longBreak') {
              setCompletedSessions(0);
            }
            setTimerState('working');
            return config.workMinutes * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, isPaused, completedSessions, config]);

  /* ---- Actions ---- */
  const handleStart = useCallback(() => {
    if (timerState === 'idle') {
      setTimerState('working');
      setSecondsLeft(config.workMinutes * 60);
      setCompletedSessions(0);
      setIsPaused(false);
    } else if (isPaused) {
      setIsPaused(false);
    }
  }, [timerState, isPaused, config.workMinutes]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleReset = useCallback(() => {
    setTimerState('idle');
    setSecondsLeft(config.workMinutes * 60);
    setIsPaused(false);
    setCompletedSessions(0);
  }, [config.workMinutes]);

  /* ---- SVG progress ring ---- */
  const size = 140;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-4 select-none" style={{ contain: 'layout style paint' }}>
      {/* Circular progress ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-tertiary, #1f2937)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStateColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>

        {/* Timer display (centered over the ring) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-light tracking-wide"
            style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
          >
            {display}
          </span>
          <span
            className="text-xs font-medium tracking-wider uppercase mt-0.5"
            style={{ color: getStateColor() }}
          >
            {getStateLabel()}
          </span>
        </div>
      </div>

      {/* Session counter */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: config.sessionsBeforeLongBreak }, (_, i) => (
          <div
            key={i}
            className="rounded-full transition-colors duration-300"
            style={{
              width: 8,
              height: 8,
              background: i < completedSessions ? getStateColor() : 'var(--bg-tertiary, #1f2937)',
              boxShadow: i < completedSessions ? `0 0 4px ${getStateColor()}` : 'none',
            }}
          />
        ))}
        <span className="text-xs opacity-50 ml-1" style={{ color: 'var(--text-secondary)' }}>
          {completedSessions}/{config.sessionsBeforeLongBreak}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {timerState === 'idle' ? (
          <button
            onClick={handleStart}
            className="rounded-full px-5 py-2 text-sm font-medium transition-colors"
            style={{
              background: 'var(--accent, #ef4444)',
              color: 'var(--text-primary)',
            }}
          >
            Start
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={handleStart}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: 'var(--accent, #ef4444)',
                  color: 'var(--text-primary)',
                }}
              >
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: 'var(--bg-tertiary, #1f2937)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
