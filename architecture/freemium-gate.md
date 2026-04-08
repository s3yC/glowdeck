# GlowDeck -- Monetization & Freemium Gate SOP

## Overview

GlowDeck uses a freemium model with a 21-day reverse trial. New users get full premium access for 21 days, then gracefully downgrade to the free tier. Premium features are gated with a soft paywall -- blurred previews with PRO badges -- that respects the user's attention (max 1 upgrade prompt per session, never interrupts active use).

---

## 1. Feature Tier Matrix

### Free Tier

| Feature | Details |
|---------|---------|
| Clock widget | 5 styles: minimal-digital, analog, flip, word, binary |
| Date widget | Long, short, relative formats |
| Calendar widget | Built-in month view (Google Calendar iframe also free) |
| Weather widget | Current conditions + forecast via Open-Meteo |
| Countdown widget | Timer to a target date |
| Quote widget | Rotating inspirational quotes |
| 3 default Spaces | Home, Work, Focus (pre-configured layouts) |
| OLED dark mode | Pure black (#000000) background |
| Dark mode | Dark gray background |
| Night mode | Red tint filter, manual toggle or auto-schedule |
| Wake lock | Screen stays on (user opt-in) |
| Burn-in protection | 1-2px pixel shift every 60 seconds |
| Keyboard shortcuts | Navigate widgets, switch Spaces, open Settings |

### Premium Tier (GlowDeck PRO)

| Feature | Details |
|---------|---------|
| YouTube widget | Embed YouTube videos (nocookie domain) |
| Music widget | Spotify embed player |
| Stocks widget | TradingView stock/crypto charts |
| Custom Iframe widget | Embed any CSP-whitelisted website |
| Photo Frame widget | Rotating photo slideshow |
| Pomodoro widget | Focus timer with work/break cycles |
| Drag & resize widgets | Move and resize any widget on the grid |
| Custom Spaces | Create, rename, delete additional Spaces |
| Custom accent colors | Choose any accent color for the theme |
| Unlimited layouts | Unlimited widget arrangements per Space |

---

## 2. 21-Day Reverse Trial Flow

The reverse trial gives every new user the full premium experience before asking for payment. This builds habit and demonstrates value before any paywall appears.

### Timeline

| Day | Tier | User Experience | System Action |
|-----|------|----------------|---------------|
| **0** | `trial` | Install and onboard. Full PRO unlocked. No payment asked. | `startTrial()`: set `tier: 'trial'`, record `trialStartDate` and `trialEndDate` |
| **1--20** | `trial` | Full premium experience. Subtle "X days left" banner in SpaceSwitcher. No upgrade prompts. | `checkTrialExpiry()` on each app launch. Show `TrialBanner` with days remaining. |
| **21** | `free` | Trial ends. One "Keep Premium?" prompt. Graceful downgrade. Premium widgets blur. | `checkTrialExpiry()` detects expiry, sets `tier: 'free'`. Show one `UpgradePrompt`. |
| **22+** | `free` | Free tier. PRO widgets show `PremiumGate` (blur + badge). Dashboard fully usable. | Max 1 upgrade prompt per session. Never interrupt active dashboard use. |

### Trial State Machine

```
[New User] --startTrial()--> [Trial Active]
[Trial Active] --21 days pass--> [Trial Expired]
[Trial Expired] --checkTrialExpiry()--> [Free Tier]
[Free Tier] --user purchases--> [Premium]
[Trial Active] --user purchases--> [Premium]
```

### startTrial()

Called during onboarding (after the user completes the OnboardingWizard).

```typescript
function startTrial(): void {
  const now = Date.now();
  premiumStore.setState({
    tier: 'trial',
    trialStartDate: now,
    trialEndDate: now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
    upgradePromptsShown: 0,
    lastPromptSessionId: null,
  });
}
```

### checkTrialExpiry()

Called on every app launch (in the root layout component's `useEffect`).

```typescript
function checkTrialExpiry(): void {
  const state = premiumStore.getState();

  // Only check if currently in trial
  if (state.tier !== 'trial') return;

  // Trial has ended
  if (state.trialEndDate && Date.now() >= state.trialEndDate) {
    premiumStore.setState({ tier: 'free' });
  }
}
```

### TrialBanner

Shown during the trial period (days 1-20). Positioned at the top of the SpaceSwitcher bar.

```
[PRO Trial] 14 days remaining
```

The banner:
- Shows the number of remaining days (calculated from `trialEndDate - Date.now()`)
- Uses the accent gradient background
- Is dismissible per session but returns on next app launch
- Never shows an upgrade CTA during the trial period

---

## 3. Access Control Functions

### canAccessFeature()

The primary gating function. Used by `WidgetContainer` to decide whether to render the widget or the `PremiumGate`.

```typescript
// src/lib/premiumUtils.ts

function canAccessFeature(tier: WidgetTier): boolean {
  if (tier === 'free') return true;

  const status = premiumStore.getState();
  return status.tier === 'premium' || status.tier === 'trial';
}
```

Usage:

```typescript
// In WidgetContainer
const canAccess = canAccessFeature(widget.tier);
if (!canAccess) return <PremiumGate ... />;
```

### canShowUpgradePrompt()

Controls whether the app is allowed to show an upgrade modal in the current session. Enforces the "max 1 prompt per session" rule.

```typescript
function canShowUpgradePrompt(currentSessionId: string): boolean {
  const status = premiumStore.getState();

  // Never show during trial or if already premium
  if (status.tier === 'trial' || status.tier === 'premium') return false;

  // Already shown a prompt this session
  if (status.lastPromptSessionId === currentSessionId) return false;

  return true;
}
```

### recordUpgradePrompt()

Called after showing an upgrade prompt to mark this session as "prompted."

```typescript
function recordUpgradePrompt(sessionId: string): void {
  premiumStore.setState({
    upgradePromptsShown: premiumStore.getState().upgradePromptsShown + 1,
    lastPromptSessionId: sessionId,
  });
}
```

### Session ID

A unique session ID is generated with `nanoid()` on each app launch and stored in memory (not persisted). This ensures the "max 1 prompt per session" rule resets when the user restarts the app.

```typescript
// src/app/layout.tsx (or a provider component)

const sessionId = useRef(nanoid()).current;
```

---

## 4. Soft Paywall Component (PremiumGate)

When a free-tier user encounters a premium widget, the widget area shows a `PremiumGate` overlay instead of the widget content.

### Visual Design

```
+---------------------------------------+
|                                       |
|     [Blurred preview of widget]       |
|                                       |
|          [PRO badge gradient]         |
|                                       |
|    "Track your portfolio in           |
|     real-time"                        |
|                                       |
|    [  Start Free Trial  ]  or         |
|    [     Upgrade PRO    ]             |
|                                       |
+---------------------------------------+
```

### PremiumGate Component Specification

```typescript
// src/components/premium/PremiumGate.tsx

interface PremiumGateProps {
  widgetType: WidgetType;
  displayName: string;
  description: string;
}

function PremiumGate({ widgetType, displayName, description }: PremiumGateProps) {
  const sessionId = useSessionId();
  const canPrompt = canShowUpgradePrompt(sessionId);
  const premiumStatus = usePremiumStore();

  const handleUpgradeClick = () => {
    if (canPrompt) {
      recordUpgradePrompt(sessionId);
      // Show UpgradePrompt modal
      openUpgradeModal();
    }
  };

  // Contextual benefit text per widget type
  const benefitText = getBenefitText(widgetType);

  return (
    <div className="premium-gate relative w-full h-full overflow-hidden">
      {/* Blurred background */}
      <div
        className="absolute inset-0 filter blur-lg opacity-30"
        style={{ background: 'var(--bg-tertiary)' }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
        {/* PRO badge */}
        <span
          className="px-3 py-1 rounded-full text-xs font-bold text-white mb-3"
          style={{ background: 'var(--accent-gradient)' }}
        >
          PRO
        </span>

        <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-1">
          {displayName}
        </h3>

        <p className="text-[var(--text-secondary)] text-sm mb-4">
          {benefitText}
        </p>

        <button
          onClick={handleUpgradeClick}
          className="px-6 py-2 rounded-lg font-medium text-white"
          style={{ background: 'var(--accent-gradient)' }}
        >
          {premiumStatus.trialStartDate ? 'Upgrade PRO' : 'Start Free Trial'}
        </button>
      </div>
    </div>
  );
}
```

### Contextual Benefit Text

Each widget type has a specific benefit message that explains the value:

```typescript
function getBenefitText(widgetType: WidgetType): string {
  const benefits: Partial<Record<WidgetType, string>> = {
    youtube:       'Watch videos right on your dashboard',
    music:         'Play music without leaving your dashboard',
    stocks:        'Track your portfolio in real-time',
    iframe:        'Embed any website on your dashboard',
    'photo-frame': 'Display your favorite photos in a slideshow',
    pomodoro:      'Stay focused with timed work sessions',
  };
  return benefits[widgetType] ?? 'Unlock this widget with GlowDeck PRO';
}
```

---

## 5. UpgradePrompt Modal

A full-screen modal shown when a free user taps the CTA button on a PremiumGate (and `canShowUpgradePrompt()` returns true). Also shown once on Day 21 when the trial expires.

### Design

```
+--------------------------------------------------+
|                                                  |
|         Keep Your Premium Experience?            |
|                                                  |
|   [icon] Drag & resize widgets                   |
|   [icon] YouTube, Spotify, Stocks widgets         |
|   [icon] Custom Spaces & accent colors            |
|   [icon] Pomodoro timer & Photo Frame             |
|                                                  |
|   [    Upgrade to PRO — $X/month    ]            |
|                                                  |
|          Maybe later                              |
|                                                  |
+--------------------------------------------------+
```

### Rules

1. **Max 1 per session** -- After showing one UpgradePrompt, `canShowUpgradePrompt()` returns false for the rest of the session.
2. **Never interrupt** -- The prompt only appears in response to a user action (tapping a PremiumGate CTA or on trial expiry at app launch). It never pops up while the user is viewing the dashboard.
3. **Never auto-dismiss** -- The user must explicitly close the modal ("Maybe later" or X button).
4. **Never time-gate** -- No countdown timers or "offer expires" urgency tactics.
5. **Never hide free features** -- The prompt never blocks access to free-tier functionality.
6. **Dismissible** -- "Maybe later" closes the modal. The user returns to their dashboard.

---

## 6. Premium Status Data Model

```typescript
// src/types/preferences.ts

interface PremiumStatus {
  tier:                  'free' | 'trial' | 'premium';
  trialStartDate:        number | null;      // Unix timestamp ms
  trialEndDate:          number | null;      // trialStartDate + 21 * 86400000
  upgradePromptsShown:   number;             // Lifetime count
  lastPromptSessionId:   string | null;      // Session ID of last prompt
}
```

### Default State (New User Before Onboarding)

```typescript
const defaultPremiumStatus: PremiumStatus = {
  tier: 'free',
  trialStartDate: null,
  trialEndDate: null,
  upgradePromptsShown: 0,
  lastPromptSessionId: null,
};
```

The trial does not start until the user completes onboarding. This means a user who visits the site but does not complete onboarding stays on the free tier and sees premium widgets blurred.

---

## 7. Integration Points

### WidgetContainer

Calls `canAccessFeature(widget.tier)` to decide whether to render the widget component or `PremiumGate`.

### SpaceSwitcher

Shows `TrialBanner` when `tier === 'trial'`. Shows "+ New Space" button only when `canAccessFeature('premium')`.

### DashboardGrid

Sets `static: !canAccessFeature('premium')` on all layout items to gate drag/resize.

### SettingsPanel

Shows "Custom accent color" picker only when `canAccessFeature('premium')`. Shows "Create Space" only when premium.

### App Layout (Root)

Calls `checkTrialExpiry()` on mount. Generates `sessionId` with `nanoid()`. Passes `sessionId` via context or ref.

---

## 8. File Structure

```
src/
  components/
    premium/
      PremiumGate.tsx            # Blur overlay with PRO badge and CTA
      UpgradePrompt.tsx          # Full-screen upgrade modal
      TrialBanner.tsx            # "X days left" banner during trial
  lib/
    premiumUtils.ts              # canAccessFeature, canShowUpgradePrompt, etc.
    constants.ts                 # TRIAL_DURATION_DAYS = 21
  stores/
    premiumStore.ts              # Zustand slice for PremiumStatus
  types/
    preferences.ts               # PremiumStatus interface
```
