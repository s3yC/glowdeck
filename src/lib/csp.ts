import { CSP_FRAME_SRC } from './constants';

/**
 * Check if a URL is allowed as an iframe source per the CSP whitelist.
 */
export function isAllowedIframeSrc(url: string): boolean {
  try {
    const parsed = new URL(url);
    const origin = `${parsed.protocol}//${parsed.host}`;
    return CSP_FRAME_SRC.some(
      (src) => src !== "'self'" && origin.startsWith(src)
    );
  } catch {
    return false;
  }
}

/**
 * Generate a CSP meta tag content string for frame-src.
 */
export function getCSPMetaContent(): string {
  return `frame-src ${CSP_FRAME_SRC.join(' ')};`;
}
