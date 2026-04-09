'use client';

import { useState, useCallback } from 'react';
import { usePreferenceStore, useLayoutStore, usePremiumStore } from '@/stores';

const SPACE_OPTIONS = [
  {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    description: 'Relaxed ambient display with clock, weather, and media',
  },
  {
    id: 'work',
    name: 'Work',
    icon: '💼',
    description: 'Productivity cockpit with stocks, pomodoro, and calendar',
  },
  {
    id: 'focus',
    name: 'Focus',
    icon: '🎯',
    description: 'Minimal distraction-free view with clock and quotes',
  },
];

const TRIAL_BENEFITS = [
  'Drag & resize all widgets to build your perfect layout',
  'Access YouTube, Spotify, Stocks, and more premium widgets',
  'Create custom Spaces and choose accent colors',
  'Full Pomodoro timer and Photo Frame slideshow',
];

export function OnboardingWizard() {
  const onboardingComplete = usePreferenceStore((s) => s.onboardingComplete);
  const setOnboardingComplete = usePreferenceStore(
    (s) => s.setOnboardingComplete
  );
  const setActiveSpaceId = usePreferenceStore((s) => s.setActiveSpaceId);
  const setActiveSpace = useLayoutStore((s) => s.setActiveSpace);
  const startTrial = usePremiumStore((s) => s.startTrial);

  const [step, setStep] = useState(0);
  const [selectedSpace, setSelectedSpace] = useState('home');

  const handleNext = useCallback(() => {
    if (step === 0) {
      // Apply selected space
      setActiveSpaceId(selectedSpace);
      setActiveSpace(selectedSpace);
    }
    if (step < 2) {
      setStep(step + 1);
    }
  }, [step, selectedSpace, setActiveSpaceId, setActiveSpace]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleFinish = useCallback(() => {
    startTrial();
    setOnboardingComplete();
  }, [startTrial, setOnboardingComplete]);

  const handleSkip = useCallback(() => {
    setOnboardingComplete();
  }, [setOnboardingComplete]);

  if (onboardingComplete) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl p-8 border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor:
                  i === step ? 'var(--accent)' : 'var(--bg-tertiary)',
                transform: i === step ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Step content with transition */}
        <div
          className="min-h-[300px] flex flex-col"
          style={{
            opacity: 1,
            transition: 'opacity 200ms ease',
          }}
        >
          {/* Step 0: Choose your vibe */}
          {step === 0 && (
            <div className="flex-1 flex flex-col">
              <h2
                className="text-2xl font-bold text-center mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Choose your vibe
              </h2>
              <p
                className="text-sm text-center mb-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pick a starting Space for your dashboard
              </p>

              <div className="space-y-3 flex-1">
                {SPACE_OPTIONS.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => setSelectedSpace(space.id)}
                    className="flex items-center gap-4 w-full p-4 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor:
                        selectedSpace === space.id
                          ? 'var(--bg-tertiary)'
                          : 'transparent',
                      border:
                        selectedSpace === space.id
                          ? '1px solid var(--accent)'
                          : '1px solid var(--border)',
                    }}
                  >
                    <span className="text-2xl">{space.icon}</span>
                    <div>
                      <div
                        className="font-semibold text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {space.name}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {space.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Pick your widgets */}
          {step === 1 && (
            <div className="flex-1 flex flex-col">
              <h2
                className="text-2xl font-bold text-center mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Pick your widgets
              </h2>
              <p
                className="text-sm text-center mb-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                Your {SPACE_OPTIONS.find((s) => s.id === selectedSpace)?.name}{' '}
                Space comes pre-configured. You can customize it anytime from
                Settings.
              </p>

              <div
                className="flex-1 flex flex-col items-center justify-center gap-4 p-6 rounded-xl"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px dashed var(--border)',
                }}
              >
                <span className="text-4xl">
                  {SPACE_OPTIONS.find((s) => s.id === selectedSpace)?.icon}
                </span>
                <div className="text-center">
                  <div
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {SPACE_OPTIONS.find((s) => s.id === selectedSpace)?.name}{' '}
                    Space
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Includes pre-configured widgets ready to use
                  </div>
                </div>
                <p
                  className="text-xs text-center max-w-[280px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Tap the gear icon at the top-right to add, remove, or
                  rearrange widgets at any time.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Start your free trial */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <h2
                className="text-2xl font-bold text-center mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Start your free trial
              </h2>
              <p
                className="text-sm text-center mb-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                Get 21 days of full premium access -- no payment required
              </p>

              <ul className="space-y-4 flex-1">
                {TRIAL_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #667eea, #764ba2)',
                      }}
                    >
                      ✓
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Back
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Skip
            </button>
          )}

          {step < 2 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
              }}
            >
              Start Free Trial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
