'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Config type                                                        */
/* ------------------------------------------------------------------ */
interface PhotoFrameConfig {
  images: string[];      // base64 data URLs
  interval: number;      // ms between slides (default 10000)
  transition: 'fade' | 'slide';
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PhotoFrameWidget({ widget, onConfigChange }: WidgetProps) {
  const config: PhotoFrameConfig = {
    images: [],
    interval: 10_000,
    transition: 'fade',
    ...(widget.config as Partial<PhotoFrameConfig>),
  };

  // Also accept "photos" key from the registry default config
  const images: string[] = config.images.length
    ? config.images
    : ((widget.config as Record<string, unknown>).photos as string[] | undefined) || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Slideshow cycling ---- */
  useEffect(() => {
    if (images.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setPrevIndex((prev) => prev); // capture current as prev
      setIsTransitioning(true);
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % images.length;
      });

      // Reset transition flag after animation
      const timer = setTimeout(() => setIsTransitioning(false), 800);
      return () => clearTimeout(timer);
    }, config.interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [images.length, config.interval]);

  /* ---- File upload handler ---- */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setWarning(null);
      const newImages: string[] = [];
      const tooLarge: string[] = [];

      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          tooLarge.push(file.name);
          continue;
        }
        try {
          const dataUrl = await readFileAsDataUrl(file);
          newImages.push(dataUrl);
        } catch {
          // skip failed reads
        }
      }

      if (tooLarge.length > 0) {
        setWarning(
          `Skipped ${tooLarge.length} file(s) exceeding ${MAX_FILE_SIZE_MB}MB: ${tooLarge.join(', ')}`,
        );
      }

      if (newImages.length > 0) {
        const updated = [...images, ...newImages];
        onConfigChange({ ...config, images: updated });
      }

      // Reset input so the same files can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [images, config, onConfigChange],
  );

  const handleClearAll = useCallback(() => {
    setCurrentIndex(0);
    setPrevIndex(0);
    setWarning(null);
    onConfigChange({ ...config, images: [] });
  }, [config, onConfigChange]);

  const handleRemoveCurrent = useCallback(() => {
    const updated = images.filter((_, i) => i !== currentIndex);
    setCurrentIndex(0);
    setPrevIndex(0);
    onConfigChange({ ...config, images: updated });
  }, [images, currentIndex, config, onConfigChange]);

  /* ---- Empty state ---- */
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-xl px-8 py-6 transition-colors"
          style={{
            background: 'var(--bg-tertiary)',
            border: '2px dashed var(--border)',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Add Photos
          </span>
          <span className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>
            Select images to create a slideshow
          </span>
        </button>

        {warning && (
          <div className="text-xs text-center px-4" style={{ color: '#f59e0b' }}>
            {warning}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  /* ---- Slideshow ---- */
  const safeIndex = currentIndex < images.length ? currentIndex : 0;
  const safePrevIndex = prevIndex < images.length ? prevIndex : 0;

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ contain: 'layout style paint' }}>
      {/* Transition styles */}
      <style>{`
        @keyframes photoFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes photoSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0%); }
        }
        @keyframes photoSlideOut {
          from { transform: translateX(0%); }
          to { transform: translateX(-100%); }
        }
      `}</style>

      {/* Previous image (for transition) */}
      {config.transition === 'slide' && isTransitioning && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${images[safePrevIndex]})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'black',
            animation: 'photoSlideOut 0.7s ease-in-out forwards',
          }}
        />
      )}

      {/* Current image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${images[safeIndex]})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'black',
          animation: isTransitioning
            ? config.transition === 'fade'
              ? 'photoFadeIn 0.7s ease-in-out'
              : 'photoSlideIn 0.7s ease-in-out'
            : 'none',
        }}
      />

      {/* Image counter */}
      {images.length > 1 && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs"
          style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)' }}
        >
          {safeIndex + 1} / {images.length}
        </div>
      )}

      {/* Controls (top-right) */}
      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
        {/* Add more photos */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full p-1.5"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          aria-label="Add photos"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Remove current photo */}
        <button
          onClick={handleRemoveCurrent}
          className="rounded-full p-1.5"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          aria-label="Remove current photo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>

        {/* Clear all */}
        <button
          onClick={handleClearAll}
          className="rounded-full p-1.5"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          aria-label="Clear all photos"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {warning && (
        <div className="absolute top-2 left-2 z-20 text-xs rounded px-2 py-1" style={{ background: 'rgba(0,0,0,0.7)', color: '#f59e0b' }}>
          {warning}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
