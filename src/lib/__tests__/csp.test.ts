import { describe, it, expect } from 'vitest';
import { isAllowedIframeSrc, getCSPMetaContent } from '../csp';

describe('isAllowedIframeSrc()', () => {
  it('allows whitelisted YouTube Nocookie domain', () => {
    expect(isAllowedIframeSrc('https://www.youtube-nocookie.com/embed/abc123')).toBe(true);
  });

  it('allows whitelisted YouTube domain', () => {
    expect(isAllowedIframeSrc('https://www.youtube.com/embed/abc123')).toBe(true);
  });

  it('allows whitelisted Spotify domain', () => {
    expect(isAllowedIframeSrc('https://open.spotify.com/embed/track/123')).toBe(true);
  });

  it('allows whitelisted TradingView domain (s.tradingview.com)', () => {
    expect(isAllowedIframeSrc('https://s.tradingview.com/widgetembed/')).toBe(true);
  });

  it('allows whitelisted TradingView domain (www.tradingview.com)', () => {
    expect(isAllowedIframeSrc('https://www.tradingview.com/chart/')).toBe(true);
  });

  it('allows whitelisted Google Calendar domain', () => {
    expect(isAllowedIframeSrc('https://calendar.google.com/calendar/embed')).toBe(true);
  });

  it('allows whitelisted Windy domain', () => {
    expect(isAllowedIframeSrc('https://embed.windy.com/embed2.html')).toBe(true);
  });

  it('rejects non-whitelisted domain', () => {
    expect(isAllowedIframeSrc('https://evil.example.com/malware')).toBe(false);
  });

  it('rejects plain HTTP URLs', () => {
    expect(isAllowedIframeSrc('http://www.youtube.com/embed/abc123')).toBe(false);
  });

  it('rejects javascript: protocol', () => {
    expect(isAllowedIframeSrc('javascript:alert(1)')).toBe(false);
  });

  it('handles malformed URLs gracefully (returns false)', () => {
    expect(isAllowedIframeSrc('')).toBe(false);
    expect(isAllowedIframeSrc('not-a-url')).toBe(false);
    expect(isAllowedIframeSrc('://missing-protocol')).toBe(false);
  });

  it('rejects "self" as a URL (self is CSP directive, not a domain)', () => {
    expect(isAllowedIframeSrc("'self'")).toBe(false);
  });
});

describe('getCSPMetaContent()', () => {
  it('returns a valid CSP string starting with "frame-src"', () => {
    const csp = getCSPMetaContent();
    expect(csp).toMatch(/^frame-src /);
    expect(csp).toMatch(/;$/);
  });

  it('includes self directive', () => {
    const csp = getCSPMetaContent();
    expect(csp).toContain("'self'");
  });

  it('includes all whitelisted domains', () => {
    const csp = getCSPMetaContent();
    expect(csp).toContain('https://www.youtube-nocookie.com');
    expect(csp).toContain('https://www.youtube.com');
    expect(csp).toContain('https://open.spotify.com');
    expect(csp).toContain('https://s.tradingview.com');
    expect(csp).toContain('https://www.tradingview.com');
    expect(csp).toContain('https://calendar.google.com');
    expect(csp).toContain('https://embed.windy.com');
  });
});
