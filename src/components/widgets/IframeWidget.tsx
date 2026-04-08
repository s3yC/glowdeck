'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isAllowedIframeSrc } from '@/lib/csp';
import { CSP_FRAME_SRC } from '@/lib/constants';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config type                                                        */
/* ------------------------------------------------------------------ */
interface IframeConfig {
  url: string;
  refreshInterval?: number; // ms — 0 or undefined = no auto-refresh
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
/** Friendly list of allowed domains for the error message. */
function getAllowedDomains(): string[] {
  return CSP_FRAME_SRC
    .filter((src) => src !== "'self'")
    .map((src) => {
      try {
        return new URL(src).hostname;
      } catch {
        return src;
      }
    });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function IframeWidget({ widget, onConfigChange }: WidgetProps) {
  const config: IframeConfig = {
    url: '',
    refreshInterval: undefined,
    ...(widget.config as Partial<IframeConfig>),
  };

  const [inputUrl, setInputUrl] = useState(config.url);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Auto-refresh ---- */
  useEffect(() => {
    if (!config.url || !config.refreshInterval || config.refreshInterval <= 0) return;

    refreshRef.current = setInterval(() => {
      setIframeKey((k) => k + 1);
    }, config.refreshInterval);

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [config.url, config.refreshInterval]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputUrl.trim();
      if (!trimmed) return;

      if (!isAllowedIframeSrc(trimmed)) {
        setValidationError(
          `This URL is not in the allowed whitelist. Allowed domains: ${getAllowedDomains().join(', ')}`,
        );
        return;
      }

      setValidationError(null);
      onConfigChange({ ...config, url: trimmed });
    },
    [inputUrl, config, onConfigChange],
  );

  const handleClear = useCallback(() => {
    setInputUrl('');
    setValidationError(null);
    onConfigChange({ ...config, url: '' });
  }, [config, onConfigChange]);

  /* ---- Check if current URL is still valid ---- */
  const isCurrentUrlValid = config.url ? isAllowedIframeSrc(config.url) : false;

  /* ---- URL input screen ---- */
  if (!config.url || !isCurrentUrlValid) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
          Enter a URL to embed
        </span>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => { setInputUrl(e.target.value); setValidationError(null); }}
            placeholder="https://..."
            className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: `1px solid ${validationError ? 'var(--accent)' : 'var(--border)'}`,
            }}
          />
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-primary)',
            }}
          >
            Load
          </button>
        </form>

        {validationError && (
          <div className="text-xs max-w-md text-center px-2" style={{ color: '#ef4444' }}>
            {validationError}
          </div>
        )}

        <div className="text-xs opacity-40 max-w-md text-center" style={{ color: 'var(--text-secondary)' }}>
          Allowed domains: {getAllowedDomains().join(', ')}
        </div>
      </div>
    );
  }

  /* ---- Iframe ---- */
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ contain: 'layout style paint' }}>
      <iframe
        key={iframeKey}
        src={config.url}
        width="100%"
        height="100%"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        style={{ border: 'none' }}
        title="Custom embed"
      />

      {/* Change URL button (top-right) */}
      <button
        onClick={handleClear}
        className="absolute top-2 right-2 z-20 rounded-full p-1.5 opacity-0 hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        aria-label="Change URL"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
