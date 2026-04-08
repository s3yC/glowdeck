# GlowDeck — BLAST Master Prompt (One-Shot)

> **How to use:** Paste this ENTIRE prompt into Claude Code within AntiGravity on Windows.
> The agent will execute Protocol Zero, then walk through B → L → A → S → T sequentially.
> Approve each phase gate before the agent proceeds.

---

Note: I have Superpowers skills installed globally (obra/superpowers). Use them WITHIN each BLAST phase where relevant, but follow the BLAST framework as the primary project structure. I also have anthropics/skills with document-skills and frontend-design, and nextlevelbuilder/ui-ux-pro-max-skill installed. Use `brainstorming` during Blueprint, `writing-plans` during Architect, `subagent-driven-development` during Style/Build, and `test-driven-development` during Trigger/testing. If there is even a 1% chance a skill applies, invoke it.

---

## SYSTEM IDENTITY

You are the **System Pilot**. Your mission is to build a deterministic, self-healing application using the **B.L.A.S.T. protocol** and the **A.N.T. 3-layer architecture**. You prioritize reliability over speed and never guess at business logic. You write SOPs before code, test before shipping, and update architecture docs after every fix.

You are building **"GlowDeck"** — a StandBy-style always-on smart dashboard application inspired by Apple's iOS StandBy Mode and Android's StandBy Mode Pro. Tagline: *"Display your Tech with GlowDeck."* This is a freemium product: the free tier is **GlowDeck**, the premium tier is **GlowDeck Pro**. Genuinely useful for free, with premium customization features gated behind a subscription.

---

## PROTOCOL ZERO — Initialize Project Memory (MANDATORY FIRST STEP)

Before ANY coding or planning, create these four files at the project root:

### 1. `claude.md` — Project Constitution (LAW)
This is the single source of truth. Only update when schemas, rules, or architecture change. Initialize it with:

```markdown
# GlowDeck — Project Constitution

## Identity
- Product: GlowDeck — Always-On Smart Dashboard
- Tagline: "Display your Tech with GlowDeck"
- Free Tier: GlowDeck | Premium Tier: GlowDeck Pro
- Type: Freemium PWA + Electron Desktop App
- Stack: React 18 + Next.js (static export) + Tailwind CSS + Zustand + react-grid-layout
- Deployment: Vercel (PWA) + Electron (Windows/Mac desktop builds)

## Data Schema
(Agent defines this during Blueprint phase after Discovery Questions)

## Behavioral Rules
(Agent populates from Discovery Question #5 answers below)

## Architectural Invariants
- A.N.T. 3-Layer: Architecture (SOPs in architecture/) → Navigation (routing logic) → Tools (atomic scripts in tools/)
- SOPs are updated BEFORE code changes — never after
- Self-Annealing: Analyze stack trace → Patch → Test → Update architecture doc
- No scripts in tools/ until Blueprint is approved
- Widget Plugin Architecture: every widget is a self-contained React component with a standard interface
- Maximum 8 simultaneous iframes in any layout to prevent memory issues
- All iframe sources must be explicitly whitelisted in CSP
```

### 2. `task_plan.md` — Phases, Goals, Checklists (MEMORY)
```markdown
# GlowDeck — Task Plan

## Current Phase: Protocol Zero
- [ ] Create project memory files
- [ ] Answer Discovery Questions
- [ ] Define Data Schema in claude.md
- [ ] Get Blueprint approval

## Phase 1: Blueprint — (pending)
## Phase 2: Link — (pending)
## Phase 3: Architect — (pending)
## Phase 4: Stylize — (pending)
## Phase 5: Trigger — (pending)
```

### 3. `findings.md` — Research, Discoveries, Constraints (MEMORY)
```markdown
# GlowDeck — Findings

## Market Research
- Apple StandBy (iOS 17+): dual widget stacks, 5 clock faces, photo slideshow, night mode red tint, landscape-only
- StandBy Mode Pro (Android, 1.6M+ downloads): 100+ clocks, quad widget layout, YouTube backgrounds, Lo-fi radio, Pomodoro
- AOA Always On Display: notification reply from AOD, $6 lifetime
- Common UX patterns: landscape-first, dark/OLED backgrounds, pixel-shift burn-in protection, swipe navigation between modes, auto-launch on charge

## Freemium Benchmarks
- Median conversion rate: 2-5%, great apps: 6-8%
- Best pattern: 7-day reverse trial (full access → graceful downgrade)
- Anti-pattern: aggressive upgrade prompts (only 8% respond positively)
- Price ceiling for category: $2.99-4.99/month, $24.99-39.99/year, $59.99-79.99 lifetime

## Technical Constraints
- YouTube: use youtube-nocookie.com for privacy, react-player for unified API
- Stocks: TradingView embeddable widgets (free with branding, zero backend needed)
- Weather: Open-Meteo (free, no API key, CORS-friendly)
- Calendar: Google Calendar iframe embed or @fullcalendar/react with GCal plugin
- Music: AmplitudeJS (open-source) for local, Spotify iframe for streaming
- Screen Wake Lock API: navigator.wakeLock.request('screen') — Chrome 84+, Safari 16.4+
- Electron: powerSaveBlocker.start('prevent-display-sleep') for desktop always-on
- Security: sandbox iframes, CSP frame-src whitelist, nodeIntegration: false in Electron
```

### 4. `progress.md` — What Was Done, Errors, Tests, Results (MEMORY)
```markdown
# GlowDeck — Progress Log

## Session 1
- [ ] Protocol Zero complete
- [ ] Blueprint approved
```

**HALT RULE:** Do NOT create any files in `tools/` or write any application code until I explicitly approve the Blueprint.

---

## PHASE 1: BLUEPRINT — Discovery Questions (Pre-Answered)

### 1. North Star
**Singular desired outcome:** Build a production-quality, freemium StandBy-style always-on dashboard app that runs as both a PWA (any browser) and an Electron desktop app (Windows/Mac). Free users get a beautiful, functional clock/calendar/weather dashboard. Premium users unlock custom iframe widgets (YouTube, stocks, music, any website), unlimited layouts, and full theme customization. The app must feel premium even on the free tier — no "crippled demo" feeling.

### 2. Integrations
**External services needed:**
- **Open-Meteo API** (weather data — free, no key needed)
- **TradingView Embeddable Widgets** (stocks/crypto — free tier with branding, iframe-based, no API key)
- **YouTube iframe API** (video embeds — use youtube-nocookie.com domain)
- **Spotify Embed API** (music widget — iframe-based, no key for embed player)
- **Google Calendar** (iframe embed URL for free tier; optional Google Calendar API with OAuth for premium sync)
- **AmplitudeJS** (local audio playback — npm package, no API)
- **react-player** (unified video player — npm package)
- **No API keys needed initially** — all free-tier integrations are keyless iframe embeds or open APIs. Google Calendar OAuth is Phase 2 stretch goal.

### 3. Source of Truth
**Where primary data lives:**
- **Widget configurations:** Zustand store → persisted to IndexedDB via `zustand/middleware` (idb-keyval)
- **Layout positions:** react-grid-layout serialized JSON → IndexedDB
- **User preferences:** theme, night mode schedule, active profile → IndexedDB
- **Premium status:** local feature flag (for MVP); Stripe webhook → server-side DB (for production)
- **External data:** fetched at runtime from APIs (weather, stocks) with configurable refresh intervals
- **No backend database for MVP** — everything client-side. Backend added in Trigger phase for premium/auth.

### 4. Delivery Payload
**How and where the final result is delivered:**
- **PWA:** Deployed to Vercel with `next export` static build. Installable via browser "Add to Home Screen." Service worker for offline clock/calendar functionality.
- **Electron:** Windows `.exe` installer (via electron-builder) and macOS `.dmg`. Published to GitHub Releases initially. App Store / Microsoft Store as future milestone.
- **The app IS the payload.** There is no external data destination like Google Sheets. The user opens the app, configures their dashboard, and it runs continuously as a smart display.

### 5. Behavioral Rules
**How the system should act:**

**DO:**
- Always render in **landscape orientation** as the primary layout (portrait as secondary/responsive)
- Use **OLED-friendly pure black (#000000) backgrounds** by default
- Implement **pixel-shift burn-in protection** (subtle 1-2px shift every 60 seconds)
- Implement **Screen Wake Lock API** to prevent screen sleep (with user opt-in toggle)
- Show a **smooth loading skeleton** for every widget while data loads
- Lazy-load all iframes with `loading="lazy"`
- Apply `contain: layout style paint` CSS on every widget container for performance isolation
- Use **CSS Grid + react-grid-layout** for the dashboard grid — widgets must be draggable and resizable (premium feature)
- Provide **3 default "Spaces"** (profiles): Home, Work, Focus — each with different widget layouts
- Gate premium features with a **contextual soft paywall** — show blurred preview + PRO badge when user taps a locked widget
- Include a **7-day reverse trial** for new users (full premium access, then graceful downgrade)
- Support keyboard shortcuts for navigation (arrow keys to switch widgets, Esc for settings)
- Stagger API polling: weather every 15 min, stocks every 1-5 min, calendar every 5 min
- Persist all user data locally — zero data leaves the device unless user opts into cloud sync

**DO NOT:**
- Do NOT show more than 1 upgrade prompt per session — no nagging
- Do NOT play audio or autoplay video without explicit user action
- Do NOT use `nodeIntegration: true` in Electron — always `contextIsolation: true`
- Do NOT embed iframes from domains not in the CSP whitelist
- Do NOT exceed 8 simultaneous iframes in any single layout
- Do NOT use localStorage (use IndexedDB for persistence — larger storage, async, structured)
- Do NOT hardcode any API keys in client-side code
- Do NOT fetch external data more frequently than the minimum polling intervals above
- Do NOT skip writing/updating architecture SOPs before writing code

**CSP WHITELIST (iframe frame-src):**
```
frame-src 'self'
  https://www.youtube-nocookie.com
  https://www.youtube.com
  https://open.spotify.com
  https://s.tradingview.com
  https://www.tradingview.com
  https://calendar.google.com
  https://embed.windy.com;
```

---

Now, agent: Using the `brainstorming` skill from Superpowers, process these Discovery Question answers and do the following:

1. **Define the complete JSON Data Schema** in `claude.md` covering: Widget (type, config, position, size, tier), Layout/Space (name, widgets array, grid config), UserPreferences (theme, nightMode, trialStatus, premiumStatus), and WidgetRegistry (available widget types and their default configs).
2. **Update `task_plan.md`** with detailed checklists for all 5 BLAST phases.
3. **Update `findings.md`** with any additional technical research or GitHub repos you discover.
4. **Present the Blueprint for my approval.** Do not proceed to Phase 2 until I confirm.

**Phase Gate:** "Confirm the plan before building."

---

## PHASE 2: LINK — Connectivity

After Blueprint approval, proceed here. Connect and verify all external integrations:

1. **Create `.env.example`** with placeholder keys for future services (Google Calendar OAuth client ID, Stripe keys for premium). No secrets needed for MVP iframe integrations.
2. **Create `tools/verify-integrations.mjs`** — a Node.js script that:
   - Fetches Open-Meteo API for a sample city and confirms JSON response
   - Validates that TradingView widget script URL is reachable (HEAD request)
   - Validates YouTube nocookie embed URL returns 200
   - Validates Spotify embed URL returns 200
   - Validates Google Calendar public embed URL returns 200
   - Logs pass/fail for each service
3. **Write `architecture/integrations.md`** SOP documenting each integration: URL pattern, auth method (none/OAuth/API key), rate limits, fallback behavior, CSP entry.
4. **Update `progress.md`** with test results.

**Phase Gate:** "Show me the connected services and confirm they work."

---

## PHASE 3: ARCHITECT — A.N.T. 3-Layer Build

After Link approval, proceed here. Use the `writing-plans` skill from Superpowers to create detailed implementation plans.

### Architecture Layer (SOPs first, code second)

Create these SOP documents in `architecture/`:

1. **`architecture/widget-system.md`** — Widget Plugin Architecture SOP:
   - Standard widget interface: `{ id, type, title, tier: 'free'|'premium', component, defaultConfig, defaultSize: {w,h}, minSize: {w,h} }`
   - Widget Registry pattern (auto-discovery of widget components)
   - Widget lifecycle: mount → configure → fetch data → render → poll → unmount
   - Error boundary per widget (one crash doesn't kill the dashboard)
   - Iframe widget sandboxing rules

2. **`architecture/layout-engine.md`** — Grid & Spaces SOP:
   - react-grid-layout configuration (cols: 12, rowHeight: calculated from viewport)
   - Responsive breakpoints: desktop (1200+), tablet (768-1199), phone (480-767)
   - Space/Profile system: switching layouts, saving/loading from IndexedDB
   - Widget drag-and-drop (premium) vs fixed grid (free)
   - Pixel-shift burn-in protection implementation

3. **`architecture/freemium-gate.md`** — Monetization SOP:
   - Feature tier matrix (free vs premium for every feature)
   - Reverse trial flow: Day 0-7 all premium → Day 8 graceful downgrade with "Keep Premium?" prompt
   - Soft paywall component: blurred preview + PRO badge + one-tap upgrade
   - Premium status check utility function used by all gated components
   - Max 1 upgrade prompt per session rule enforcement

4. **`architecture/theming.md`** — Theme & Night Mode SOP:
   - Design tokens: colors, fonts, spacing, border-radius (use ui-ux-pro-max-skill to generate)
   - OLED dark mode (pure #000000 background)
   - Night mode: red-tint filter with schedule (auto-activate between user-set hours)
   - Theme persistence in IndexedDB
   - CSS custom properties for runtime theme switching

5. **`architecture/state-management.md`** — Zustand Store SOP:
   - Store slices: widgets, layouts, preferences, premium, ui
   - IndexedDB persistence middleware
   - Hydration strategy (load from IndexedDB on app start, show skeleton until ready)

6. **`architecture/electron-shell.md`** — Desktop Wrapper SOP:
   - Main process: BrowserWindow with kiosk option, powerSaveBlocker, auto-updater
   - Preload script with contextBridge for safe IPC
   - Build config: electron-builder for Windows NSIS + Mac DMG
   - Tray icon with quick actions (switch Space, toggle night mode, quit)

### Navigation Layer (Routing)

- `/` — Main dashboard view (loads active Space)
- `/settings` — Slide-over panel (not a page navigation — keeps dashboard visible underneath)
- `/onboarding` — First-run setup wizard (choose default Space, preview premium trial)
- No traditional page routing — this is a single-screen app with modal overlays

### Tools Layer (Atomic Scripts)

After SOPs are approved, build these in `tools/` and the `src/` application:

**Project scaffold:**
```
glowdeck/
├── architecture/          # SOPs (markdown)
├── tools/                 # Standalone utility scripts
│   ├── verify-integrations.mjs
│   ├── generate-widget-registry.mjs
│   └── build-electron.mjs
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── layout.tsx     # Root layout with providers
│   │   ├── page.tsx       # Main dashboard page
│   │   └── globals.css    # Tailwind + CSS custom properties
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardGrid.tsx      # react-grid-layout wrapper
│   │   │   ├── WidgetContainer.tsx    # Error boundary + loading skeleton + premium gate
│   │   │   ├── SpaceSwitcher.tsx      # Horizontal swipe/tab bar for profiles
│   │   │   └── BurnInProtection.tsx   # Pixel-shift wrapper
│   │   ├── widgets/
│   │   │   ├── ClockWidget.tsx        # FREE — analog/digital clock
│   │   │   ├── DateWidget.tsx         # FREE — date display
│   │   │   ├── CalendarWidget.tsx     # FREE — basic month view
│   │   │   ├── WeatherWidget.tsx      # FREE — Open-Meteo powered
│   │   │   ├── CountdownWidget.tsx    # FREE — countdown to date
│   │   │   ├── QuoteWidget.tsx        # FREE — daily quote
│   │   │   ├── YouTubeWidget.tsx      # PREMIUM — react-player embed
│   │   │   ├── MusicWidget.tsx        # PREMIUM — AmplitudeJS / Spotify embed
│   │   │   ├── StocksWidget.tsx       # PREMIUM — TradingView embed
│   │   │   ├── IframeWidget.tsx       # PREMIUM — custom URL iframe
│   │   │   ├── PhotoFrameWidget.tsx   # PREMIUM — slideshow from local images
│   │   │   └── PomodoroWidget.tsx     # PREMIUM — focus timer
│   │   ├── settings/
│   │   │   ├── SettingsPanel.tsx       # Slide-over settings drawer
│   │   │   ├── WidgetPicker.tsx        # Add widget modal with free/premium indicators
│   │   │   ├── ThemeSettings.tsx       # Theme + night mode config
│   │   │   └── SpaceManager.tsx        # Create/edit/delete Spaces
│   │   ├── premium/
│   │   │   ├── PremiumGate.tsx         # Soft paywall overlay (blur + PRO badge)
│   │   │   ├── UpgradePrompt.tsx       # Contextual upgrade modal (max 1/session)
│   │   │   └── TrialBanner.tsx         # "X days left in trial" banner
│   │   └── onboarding/
│   │       └── OnboardingWizard.tsx    # First-run flow
│   ├── hooks/
│   │   ├── useWakeLock.ts             # Screen Wake Lock API hook
│   │   ├── useNightMode.ts            # Auto night mode by schedule
│   │   ├── useBurnInProtection.ts     # Pixel-shift interval
│   │   └── usePremiumStatus.ts        # Trial/premium check hook
│   ├── stores/
│   │   ├── widgetStore.ts             # Zustand — widget configs
│   │   ├── layoutStore.ts             # Zustand — grid layouts per Space
│   │   ├── preferenceStore.ts         # Zustand — user preferences
│   │   └── premiumStore.ts            # Zustand — trial/premium state
│   ├── lib/
│   │   ├── widgetRegistry.ts          # Widget type registry
│   │   ├── idb.ts                     # IndexedDB persistence helpers
│   │   ├── csp.ts                     # CSP header generation
│   │   └── constants.ts               # Polling intervals, tier definitions, etc.
│   └── types/
│       ├── widget.ts                  # Widget type definitions
│       ├── layout.ts                  # Layout/Space types
│       └── preferences.ts             # User preference types
├── electron/
│   ├── main.ts                        # Electron main process
│   ├── preload.ts                     # Context bridge
│   └── electron-builder.config.js     # Build configuration
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                          # Service worker
│   └── icons/                         # App icons (multiple sizes)
├── claude.md
├── task_plan.md
├── findings.md
├── progress.md
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

Use the `subagent-driven-development` skill to parallelize front-end and back-end work where possible.

**Phase Gate:** "Show me the component tree and file structure."

---

## PHASE 4: STYLIZE — Refinement & UI

After Architect approval, proceed here.

1. **Invoke `ui-ux-pro-max-skill`** — Search for design systems matching: "dark mode dashboard," "smart display OLED," "fintech dark theme." Generate a complete design token set: color palette (OLED black primary, accent color for interactive elements, red-spectrum for night mode), typography (system font stack for performance: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`), spacing scale, border-radius, and shadow/glow effects for active widgets.

2. **Invoke `anthropics/skills frontend-design`** to ensure the UI avoids generic AI aesthetics. Apply bold, intentional design choices: asymmetric grid layouts in the default Spaces, subtle ambient animations (clock second hand, weather particles), micro-interactions on widget hover/tap (scale, glow), and distinctive typography hierarchy.

3. **Implement these specific UI details:**
   - Clock widget: at least 5 distinct styles — minimal digital, analog with sweep second hand, flip clock, binary, and word clock
   - Dashboard background: subtle gradient mesh or animated particle field (GPU-accelerated, < 5% CPU)
   - Settings panel: slide-in from right with backdrop blur, smooth spring animation
   - Widget picker: card grid with live mini-previews, PRO badges with subtle shimmer animation
   - Night mode transition: smooth 500ms fade to red-tinted monochrome
   - Onboarding: 3-step wizard (Choose your vibe → Pick your widgets → Start your free trial)
   - Empty states: friendly illustration + "Add your first widget" CTA

4. **Responsive testing:** Verify the dashboard renders correctly at: 1920x1080, 1366x768, 2560x1440, iPad landscape (1194x834), and iPhone landscape (844x390).

5. **Update all architecture SOPs** with final design decisions and component specifications.

**Phase Gate:** "Show me the homepage in the browser before continuing."

---

## PHASE 5: TRIGGER — Deployment

After Stylize approval, proceed here. Use `test-driven-development` skill from Superpowers.

### Testing
1. Write unit tests for: widgetRegistry, premium gate logic, IndexedDB persistence, layout serialization/deserialization, night mode scheduling, burn-in protection offset calculation.
2. Write integration tests for: widget lifecycle (mount → data fetch → render → error recovery), Space switching, freemium upgrade flow, reverse trial expiration.
3. Run Lighthouse audit targeting: Performance > 90, Accessibility > 95, Best Practices > 90, PWA checkmarks all green.
4. Run a security audit: verify CSP headers, iframe sandboxing, no `eval()`, no inline scripts, Electron security checklist (nodeIntegration: false, contextIsolation: true, webSecurity: true).

### PWA Deployment (Vercel)
1. Configure `next.config.js` for static export
2. Set up PWA manifest with app name, icons, theme color, display: standalone, orientation: landscape
3. Implement service worker for offline clock/calendar (cache-first for static assets, network-first for API data)
4. Deploy to Vercel — verify installability on Chrome and Safari

### Electron Build
1. Configure electron-builder for Windows (NSIS installer) and Mac (DMG)
2. Set up auto-updater pointing to GitHub Releases
3. Test: kiosk mode, power save blocker, tray icon, auto-launch on startup option
4. Build and publish to GitHub Releases

### Finalize
1. Update `claude.md` with final architecture, deployment URLs, and version number
2. Update `progress.md` with all test results and deployment confirmations
3. Create `README.md` with: product description, screenshots, installation instructions, development setup, contribution guidelines

**Phase Gate:** "Run a security and SEO audit before deploying."

---

## CONTEXT RECOVERY PROMPT

If you open a new conversation and need to continue this project, use:

> "Read claude.md, task_plan.md, findings.md, progress.md, and the architecture/ folder, then continue from where we left off."

---

## SELF-ANNEALING PROTOCOL

When any tool, script, or component fails:
1. **Analyze** — Read the full stack trace. Do not guess.
2. **Patch** — Fix the specific failing file
3. **Test** — Verify the fix works in isolation AND integration
4. **Update Architecture** — Update the matching SOP in `architecture/` with the new learning so the error never repeats
5. **Log** — Record the error and fix in `progress.md`

---

**BEGIN PROTOCOL ZERO NOW.** Create the four memory files, process the Discovery Question answers, define the Data Schema, and present the Blueprint for my approval.
