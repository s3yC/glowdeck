#!/usr/bin/env node

/**
 * GlowDeck — Integration Verification Script
 * Tests connectivity to all external services used by the app.
 * Run: node tools/verify-integrations.mjs
 */

const SERVICES = [
  {
    name: 'Open-Meteo API',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true',
    method: 'GET',
    expectJson: true,
    description: 'Weather data (free, no API key)',
  },
  {
    name: 'TradingView Widget',
    url: 'https://s.tradingview.com/widgetembed/?hideideas=1&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&symbol=AAPL',
    method: 'HEAD',
    expectJson: false,
    description: 'Stock/crypto charts (iframe embed)',
  },
  {
    name: 'YouTube Nocookie Embed',
    url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    method: 'HEAD',
    expectJson: false,
    description: 'Video embeds (privacy-enhanced)',
  },
  {
    name: 'Spotify Embed',
    url: 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT',
    method: 'HEAD',
    expectJson: false,
    description: 'Music player (iframe embed)',
  },
  {
    name: 'Google Calendar Embed',
    url: 'https://calendar.google.com/calendar/embed?src=en.usa%23holiday%40group.v.calendar.google.com',
    method: 'HEAD',
    expectJson: false,
    description: 'Calendar display (public iframe embed)',
  },
];

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

async function testService(service) {
  const start = performance.now();
  try {
    const response = await fetch(service.url, {
      method: service.method,
      headers: { 'User-Agent': 'GlowDeck-IntegrationTest/1.0' },
      redirect: 'follow',
    });

    const elapsed = Math.round(performance.now() - start);
    const ok = response.status >= 200 && response.status < 400;

    let jsonValid = null;
    if (service.expectJson && ok) {
      try {
        const data = await response.json();
        jsonValid = data && typeof data === 'object';
      } catch {
        jsonValid = false;
      }
    }

    return {
      name: service.name,
      description: service.description,
      status: ok ? 'PASS' : 'FAIL',
      httpStatus: response.status,
      elapsed,
      jsonValid,
      error: null,
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    return {
      name: service.name,
      description: service.description,
      status: 'FAIL',
      httpStatus: null,
      elapsed,
      jsonValid: null,
      error: err.message,
    };
  }
}

async function main() {
  console.log(`\n${COLORS.bold}${COLORS.cyan}GlowDeck — Integration Verification${COLORS.reset}\n`);
  console.log(`${COLORS.dim}Testing ${SERVICES.length} external services...${COLORS.reset}\n`);

  const results = await Promise.all(SERVICES.map(testService));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  for (const r of results) {
    const icon = r.status === 'PASS' ? `${COLORS.green}PASS` : `${COLORS.red}FAIL`;
    const status = r.httpStatus ? `HTTP ${r.httpStatus}` : 'NO RESPONSE';
    const json = r.jsonValid !== null ? (r.jsonValid ? ' | JSON valid' : ' | JSON INVALID') : '';
    const error = r.error ? ` | Error: ${r.error}` : '';

    console.log(`  ${icon}${COLORS.reset}  ${r.name}`);
    console.log(`       ${COLORS.dim}${r.description}${COLORS.reset}`);
    console.log(`       ${COLORS.dim}${status} | ${r.elapsed}ms${json}${error}${COLORS.reset}\n`);
  }

  console.log(`${COLORS.bold}Results: ${COLORS.green}${passed} passed${COLORS.reset}${COLORS.bold}, ${failed > 0 ? COLORS.red : COLORS.dim}${failed} failed${COLORS.reset}\n`);

  // Output machine-readable summary for progress.md
  console.log(`${COLORS.dim}--- Machine-readable summary ---${COLORS.reset}`);
  for (const r of results) {
    console.log(`${r.status} | ${r.name} | HTTP ${r.httpStatus || 'N/A'} | ${r.elapsed}ms`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
