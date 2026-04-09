'use client';

import { useState, useCallback, useMemo } from 'react';
import ReactPlayer from 'react-player';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config type                                                        */
/* ------------------------------------------------------------------ */
interface YouTubeConfig {
  videoUrl: string;
  autoplay: false;
  loop: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
/**
 * Extract a YouTube video ID from any common URL format:
 *   - youtube.com/watch?v=ID
 *   - youtu.be/ID
 *   - youtube.com/embed/ID
 *   - youtube.com/shorts/ID
 *   - youtube.com/live/ID
 */
function extractVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // youtu.be/ID
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    // youtube.com or youtube-nocookie.com
    if (
      parsed.hostname.includes('youtube.com') ||
      parsed.hostname.includes('youtube-nocookie.com')
    ) {
      // /watch?v=ID
      const v = parsed.searchParams.get('v');
      if (v) return v;
      // /embed/ID, /shorts/ID, /live/ID
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (
        segments.length >= 2 &&
        ['embed', 'shorts', 'live', 'v'].includes(segments[0])
      ) {
        return segments[1];
      }
    }
  } catch {
    // not a valid URL — try bare video ID (11 chars alphanumeric)
    const match = url.match(/^[\w-]{11}$/);
    if (match) return match[0];
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function YouTubeWidget({ widget, onConfigChange }: WidgetProps) {
  const config: YouTubeConfig = {
    videoUrl: '',
    autoplay: false,
    loop: false,
    ...(widget.config as Partial<YouTubeConfig>),
  };

  const [inputUrl, setInputUrl] = useState(config.videoUrl);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  const videoId = useMemo(() => extractVideoId(config.videoUrl), [config.videoUrl]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const id = extractVideoId(inputUrl);
      if (id) {
        setError(false);
        setPlaying(false);
        onConfigChange({ ...config, videoUrl: inputUrl });
      }
    },
    [inputUrl, config, onConfigChange],
  );

  const handleClear = useCallback(() => {
    setPlaying(false);
    setError(false);
    setInputUrl('');
    onConfigChange({ ...config, videoUrl: '' });
  }, [config, onConfigChange]);

  const handleToggleLoop = useCallback(() => {
    onConfigChange({ ...config, loop: !config.loop });
  }, [config, onConfigChange]);

  /* ---- URL input screen ---- */
  if (!videoId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
        </svg>
        <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
          Paste a YouTube URL
        </span>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
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
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Video unavailable
        </span>
        <button
          onClick={() => { setError(false); setPlaying(false); }}
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
          Change video
        </button>
      </div>
    );
  }

  /* ---- Player ---- */
  const nocookieUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ contain: 'layout style paint' }}>
      <ReactPlayer
        src={nocookieUrl}
        playing={playing}
        loop={config.loop}
        controls
        width="100%"
        height="100%"
        config={{
          youtube: {
            rel: 0,
          },
        }}
        onError={() => setError(true)}
      />

      {/* Play button overlay — shown until user clicks play */}
      {!playing && (
        <button
          onClick={() => setPlaying(true)}
          className="absolute inset-0 flex items-center justify-center z-10 transition-opacity hover:opacity-90"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          aria-label="Play video"
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
          >
            <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <polygon points="26,20 26,44 46,32" fill="white" />
          </svg>
        </button>
      )}

      {/* Top-right controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity">
        {/* Loop toggle */}
        <button
          onClick={handleToggleLoop}
          className="rounded-full p-1.5 transition-colors"
          style={{
            background: config.loop ? 'rgba(99,102,241,0.85)' : 'rgba(0,0,0,0.6)',
          }}
          aria-label={config.loop ? 'Disable loop' : 'Enable loop'}
          title={config.loop ? 'Loop on' : 'Loop off'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>

        {/* Change video */}
        <button
          onClick={handleClear}
          className="rounded-full p-1.5"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          aria-label="Change video"
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
