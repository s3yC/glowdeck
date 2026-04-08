'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config type                                                        */
/* ------------------------------------------------------------------ */
interface StocksConfig {
  symbols: string[];
  chartType: 'mini' | 'advanced' | 'ticker';
  pollInterval: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const LOAD_TIMEOUT_MS = 10_000;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function StocksWidget({ widget, onConfigChange }: WidgetProps) {
  const config: StocksConfig = {
    symbols: ['AAPL', 'GOOGL'],
    chartType: 'mini',
    pollInterval: 60_000,
    ...(widget.config as Partial<StocksConfig>),
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSymbol = config.symbols[activeIndex] || config.symbols[0] || 'AAPL';

  const iframeUrl = useMemo(() => {
    const sym = encodeURIComponent(activeSymbol);
    return `https://s.tradingview.com/widgetembed/?symbol=${sym}&locale=en`;
  }, [activeSymbol]);

  /* ---- Load timeout ---- */
  useEffect(() => {
    if (!loading) return;

    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(true);
      }
    }, LOAD_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading, iframeKey]);

  /* ---- Poll interval (re-render / reload iframe) ---- */
  useEffect(() => {
    if (config.pollInterval <= 0) return;

    pollRef.current = setInterval(() => {
      setLoading(true);
      setError(false);
      setIframeKey((k) => k + 1);
    }, config.pollInterval);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [config.pollInterval]);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    setIframeKey((k) => k + 1);
  }, []);

  /* ---- Symbol input ---- */
  const [inputSymbol, setInputSymbol] = useState('');

  const handleAddSymbol = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const sym = inputSymbol.trim().toUpperCase();
      if (sym && !config.symbols.includes(sym)) {
        onConfigChange({ ...config, symbols: [...config.symbols, sym] });
      }
      setInputSymbol('');
    },
    [inputSymbol, config, onConfigChange],
  );

  const handleRemoveSymbol = useCallback(
    (sym: string) => {
      const updated = config.symbols.filter((s) => s !== sym);
      onConfigChange({ ...config, symbols: updated.length ? updated : ['AAPL'] });
      if (activeIndex >= updated.length) setActiveIndex(0);
    },
    [config, onConfigChange, activeIndex],
  );

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Stocks unavailable
        </span>
        <button
          onClick={handleRetry}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ contain: 'layout style paint' }}>
      {/* Symbol tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {config.symbols.map((sym, i) => (
          <button
            key={sym}
            onClick={() => {
              setActiveIndex(i);
              setLoading(true);
              setError(false);
              setIframeKey((k) => k + 1);
            }}
            className="relative rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap group"
            style={{
              background: i === activeIndex ? 'var(--accent)' : 'transparent',
              color: 'var(--text-primary)',
              opacity: i === activeIndex ? 1 : 0.6,
            }}
          >
            {sym}
            {config.symbols.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); handleRemoveSymbol(sym); }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                x
              </span>
            )}
          </button>
        ))}

        {/* Add symbol */}
        <form onSubmit={handleAddSymbol} className="flex items-center ml-1">
          <input
            type="text"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value)}
            placeholder="+"
            className="w-16 rounded px-2 py-1 text-xs outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        </form>
      </div>

      {/* Chart area */}
      <div className="relative flex-1 min-h-0">
        {/* Loading shimmer */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--bg-secondary)' }}>
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="h-4 w-24 rounded" style={{ background: 'var(--bg-tertiary)' }} />
              <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-tertiary)' }} />
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={iframeUrl}
          width="100%"
          height="100%"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
          referrerPolicy="no-referrer"
          style={{ border: 'none' }}
          title={`TradingView ${activeSymbol}`}
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}
