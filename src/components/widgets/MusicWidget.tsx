'use client';

import { useState, useCallback, useMemo } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config type                                                        */
/* ------------------------------------------------------------------ */
interface MusicConfig {
  mode: 'spotify';
  spotifyUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
/**
 * Extract Spotify embed URL from a user-pasted Spotify link.
 *
 * Accepted formats:
 *   - https://open.spotify.com/track/ID
 *   - https://open.spotify.com/album/ID
 *   - https://open.spotify.com/playlist/ID
 *   - https://open.spotify.com/episode/ID
 *   - https://open.spotify.com/show/ID
 *   - spotify:track:ID  (URI format)
 *
 * Returns embed URL: https://open.spotify.com/embed/{type}/{id}?theme=0
 */
function extractSpotifyEmbed(url: string): string | null {
  if (!url) return null;

  // Handle Spotify URI format: spotify:track:ID
  const uriMatch = url.match(
    /^spotify:(track|album|playlist|episode|show):([a-zA-Z0-9]+)/,
  );
  if (uriMatch) {
    return `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}?theme=0`;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('spotify.com')) return null;

    // Already an embed URL
    if (parsed.pathname.startsWith('/embed/')) {
      // Normalize: ensure theme=0
      parsed.searchParams.set('theme', '0');
      return parsed.toString();
    }

    // Extract type and ID from path: /track/ID, /album/ID, etc.
    const segments = parsed.pathname.split('/').filter(Boolean);
    // Handle optional locale prefix like /intl-pt/track/ID
    let typeIdx = 0;
    if (segments[0]?.startsWith('intl-') || segments[0]?.startsWith('intl_')) {
      typeIdx = 1;
    }
    const type = segments[typeIdx];
    const id = segments[typeIdx + 1];

    if (
      type &&
      id &&
      ['track', 'album', 'playlist', 'episode', 'show'].includes(type)
    ) {
      return `https://open.spotify.com/embed/${type}/${id}?theme=0`;
    }
  } catch {
    // invalid URL
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MusicWidget({ widget, onConfigChange }: WidgetProps) {
  const config: MusicConfig = {
    mode: 'spotify',
    spotifyUrl: '',
    ...(widget.config as Partial<MusicConfig>),
  };

  const [inputUrl, setInputUrl] = useState(config.spotifyUrl);
  const [loadError, setLoadError] = useState(false);

  const embedUrl = useMemo(
    () => extractSpotifyEmbed(config.spotifyUrl),
    [config.spotifyUrl],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const embed = extractSpotifyEmbed(inputUrl);
      if (embed) {
        setLoadError(false);
        onConfigChange({ ...config, spotifyUrl: inputUrl });
      }
    },
    [inputUrl, config, onConfigChange],
  );

  const handleClear = useCallback(() => {
    setLoadError(false);
    setInputUrl('');
    onConfigChange({ ...config, spotifyUrl: '' });
  }, [config, onConfigChange]);

  /* ---- URL input screen ---- */
  if (!embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15s1.5-2 4-2 4 2 4 2" />
          <path d="M7 11s2-3 5-3 5 3 5 3" />
          <path d="M6 7.5S8.5 4 12 4s6 3.5 6 3.5" />
        </svg>
        <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
          Paste a Spotify link (track, album, or playlist)
        </span>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
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
      </div>
    );
  }

  /* ---- Error state ---- */
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Could not load Spotify content
        </span>
        <button
          onClick={() => setLoadError(false)}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          Retry
        </button>
        <button
          onClick={handleClear}
          className="text-xs opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          Change link
        </button>
      </div>
    );
  }

  /* ---- Spotify embed ---- */
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ contain: 'layout style paint' }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        allow="encrypted-media"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer"
        style={{ border: 'none', borderRadius: '0.75rem' }}
        title="Spotify Player"
        onError={() => setLoadError(true)}
      />

      {/* Top-right controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity">
        {/* Repeat info button */}
        <span
          className="rounded-full px-2 py-1 text-[10px] font-medium select-none"
          style={{
            background: 'rgba(0,0,0,0.6)',
            color: 'rgba(255,255,255,0.7)',
          }}
          title="Use Spotify's built-in controls for repeat"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="inline-block mr-1 align-[-2px]"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          Use Spotify controls
        </span>

        {/* Change link */}
        <button
          onClick={handleClear}
          className="rounded-full p-1.5"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          aria-label="Change Spotify link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
