# GlowDeck — Task Plan

## Current Phase: Protocol Zero (COMPLETE)
- [x] Create project memory files (claude.md, task_plan.md, findings.md, progress.md)
- [x] Process Discovery Questions via brainstorming
- [x] Define Data Schema in claude.md
- [x] Write design spec (docs/superpowers/specs/2026-04-08-glowdeck-blueprint-design.md)
- [x] Spec review passed
- [ ] Get Blueprint approval from user

## Phase 1: Blueprint — Design Approval
- [ ] Present Blueprint summary for user approval
- [ ] User confirms → proceed to Link phase

## Phase 2: Link — Connectivity
- [ ] Create `.env.example` with placeholder keys
- [ ] Create `tools/verify-integrations.mjs` — test all external services
  - [ ] Open-Meteo API fetch test
  - [ ] TradingView widget URL reachable
  - [ ] YouTube nocookie embed URL returns 200
  - [ ] Spotify embed URL returns 200
  - [ ] Google Calendar public embed URL returns 200
- [ ] Write `architecture/integrations.md` SOP
- [ ] Run verification script and log results
- [ ] Update progress.md with test results
- [ ] Phase Gate: show connected services, confirm they work

## Phase 3: Architect — A.N.T. 3-Layer Build
### Architecture Layer (SOPs)
- [ ] Write `architecture/widget-system.md` — Widget Plugin Architecture SOP
- [ ] Write `architecture/layout-engine.md` — Grid & Spaces SOP
- [ ] Write `architecture/freemium-gate.md` — Monetization SOP
- [ ] Write `architecture/theming.md` — Theme & Night Mode SOP
- [ ] Write `architecture/state-management.md` — Zustand Store SOP
- [ ] Write `architecture/electron-shell.md` — Desktop Wrapper SOP

### Navigation Layer
- [ ] Configure Next.js single-route app (/ only)
- [ ] Implement modal/drawer state management (settings, onboarding)

### Tools Layer (after SOP approval)
- [ ] Scaffold project: Next.js + Tailwind + TypeScript
- [ ] Implement types/ (widget.ts, layout.ts, preferences.ts)
- [ ] Implement lib/ (widgetRegistry.ts, idb.ts, csp.ts, constants.ts)
- [ ] Implement stores/ (widgetStore, layoutStore, preferenceStore, premiumStore)
- [ ] Implement hooks/ (useWakeLock, useNightMode, useBurnInProtection, usePremiumStatus)
- [ ] Implement dashboard components (DashboardGrid, WidgetContainer, SpaceSwitcher, BurnInProtection)
- [ ] Implement 6 free widgets (Clock, Date, Calendar, Weather, Countdown, Quote)
- [ ] Implement 6 premium widgets (YouTube, Music, Stocks, Iframe, PhotoFrame, Pomodoro)
- [ ] Implement settings components (SettingsPanel, WidgetPicker, ThemeSettings, SpaceManager)
- [ ] Implement premium components (PremiumGate, UpgradePrompt, TrialBanner)
- [ ] Implement OnboardingWizard
- [ ] Create tools/ scripts (verify-integrations.mjs, generate-widget-registry.mjs, build-electron.mjs)
- [ ] Phase Gate: show component tree and file structure

## Phase 4: Stylize — Refinement & UI
- [ ] Generate design tokens via ui-ux-pro-max skill (OLED palette, typography, spacing)
- [ ] Apply frontend-design skill for distinctive UI
- [ ] Implement 5 clock styles (minimal digital, analog, flip, binary, word)
- [ ] Implement dashboard background (gradient mesh or particles, <5% CPU)
- [ ] Implement settings slide-in with backdrop blur + spring animation
- [ ] Implement widget picker with live mini-previews + PRO shimmer badges
- [ ] Implement night mode transition (500ms red-tint fade)
- [ ] Implement onboarding wizard (3 steps: vibe → widgets → trial)
- [ ] Implement empty states with illustration + CTA
- [ ] Responsive testing: 1920x1080, 1366x768, 2560x1440, iPad landscape, iPhone landscape
- [ ] Update architecture SOPs with final design decisions
- [ ] Phase Gate: show homepage in browser

## Phase 5: Trigger — Deployment
### Testing
- [ ] Unit tests: widgetRegistry, premium gate, IndexedDB persistence, layout serialization, night mode scheduling, burn-in offset
- [ ] Integration tests: widget lifecycle, Space switching, freemium upgrade flow, trial expiration
- [ ] Lighthouse audit: Performance >90, A11y >95, Best Practices >90, PWA green
- [ ] Security audit: CSP headers, iframe sandboxing, no eval(), Electron checklist

### PWA Deployment
- [ ] Configure next.config.js for static export
- [ ] Set up PWA manifest (landscape, standalone, icons)
- [ ] Implement service worker (cache-first static, network-first API)
- [ ] Deploy to Vercel, verify installability

### Electron Build
- [ ] Configure electron-builder (Windows NSIS + Mac DMG)
- [ ] Set up auto-updater (GitHub Releases)
- [ ] Test: kiosk mode, power save blocker, tray icon, auto-launch
- [ ] Build and publish to GitHub Releases

### Finalize
- [ ] Update claude.md with final architecture + version
- [ ] Update progress.md with all test results
- [ ] Create README.md
- [ ] Phase Gate: security and SEO audit
