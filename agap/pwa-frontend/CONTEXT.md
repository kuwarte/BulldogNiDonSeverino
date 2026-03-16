# RescueNow PWA — Project Context

> Single source of truth for any developer or AI agent working on this codebase.
> Read this entire file before making any changes.

---

## What This Project Is

RescueNow is a Progressive Web App (PWA) built for flood and disaster victims in the Philippines. A victim opens the app on their mobile phone during a disaster, speaks or types a distress message in Filipino or English, and the app captures their GPS coordinates and sends a rescue request to an operations center dashboard in real time. The app is designed to work fully offline — requests are queued locally and broadcast automatically when connectivity returns.

---

## Who Uses This App

The app is designed for all of the following simultaneously:

- Elderly users with limited smartphone experience
- Users in panic under physical and emotional stress
- Users with visual impairments relying on screen readers
- Users with motor impairments needing large touch targets (min 44×44px)
- Users on low-end Android devices with screens as narrow as 320px
- Users who do not speak English fluently — primary language is Filipino (Tagalog)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI Components | shadcn/ui on Radix UI primitives |
| Styling | Tailwind CSS v4 |
| Body Font | Plus Jakarta Sans (`--font-sans`) via `next/font/google` |
| Mono Font | IBM Plex Mono (`--font-mono`) via `next/font/google` — IDs, coords, timestamps only |
| Voice Input | Web Speech API — browser built-in, no SDK |
| GPS | Geolocation API — browser built-in |
| Network Detection | Network Information API + `navigator.onLine` |
| Data Bridge | `BroadcastChannel` + `localStorage` — no backend |
| PWA Install | `beforeinstallprompt` event |
| Offline Shell | Service worker at `/public/sw.js` |
| Toast Notifications | Sonner |
| Icons | Lucide React |

---

## Project Structure

```
pwa-frontend/
├── public/
│   ├── manifest.json          PWA manifest
│   ├── sw.js                  Service worker
│   └── icons/
│       └── icon.svg           App icon (192×192 and 512×512 maskable)
├── src/
│   ├── app/
│   │   ├── layout.tsx         Root layout — fonts, metadata, viewport, ServiceWorkerRegister
│   │   ├── globals.css        Tailwind imports, CSS variables, neumorphic utilities
│   │   ├── page.tsx           Root redirect → /rescue
│   │   └── rescue/
│   │       └── page.tsx       Main PWA page — all screens in one component
│   ├── components/
│   │   ├── ui/                shadcn/ui components (alert, badge, button, card, progress, separator, sonner, textarea)
│   │   ├── ServiceWorkerRegister.tsx   Registers /public/sw.js on mount
│   │   ├── SiriWave.tsx       Canvas-based pixelated waveform animation for listening screen
│   │   └── PixelSOSButton.tsx Canvas-based circular pixelated SOS button with ripple animation
│   ├── hooks/
│   │   ├── useGeolocation.ts  GPS capture with fallback to Manila coords
│   │   ├── useSpeech.ts       Web Speech API wrapper (fil-PH, interim results)
│   │   ├── useOnlineStatus.ts Network Information API + online/offline events
│   │   └── usePWAInstall.ts   beforeinstallprompt capture and install trigger
│   ├── lib/
│   │   ├── intentDetect.ts    Keyword scoring for Filipino + English emergency phrases
│   │   ├── rescueStore.ts     BroadcastChannel + localStorage data layer
│   │   └── utils.ts           shadcn cn() utility
│   └── types/
│       ├── rescue.ts          RescueRequest, RescueStatus, StatsSnapshot, StoreMessage
│       └── global.d.ts        Window type extensions for SpeechRecognition
```

---

## Routing

Single route: `/rescue`

`src/app/page.tsx` immediately redirects to `/rescue` via `next/navigation` redirect.

All screens are managed by a `screen` state variable inside `rescue/page.tsx`. There are no sub-routes and no page navigation.

```ts
type Screen = 'idle' | 'listening' | 'confirmed' | 'offline-queued'
```

A separate `showTextInput: boolean` overlays the idle screen with the text input panel.

---

## Screens

### Idle (default)
The main screen. Contains:
- Status bar: current time (left), network badge + GPS badge (right)
- Optional install-to-home-screen banner (only when `canInstall` is true)
- App header: "RescueNow" label, "Humingi ng Tulong" heading, subtitle
- `PixelSOSButton` — the dominant interactive element, triggers voice recognition
- Stats row: people count, priority score, GPS status
- People counter stepper (minus / number / plus)
- "Type your message instead" secondary action button
- Footer hint text in Filipino and English

### Listening
Shown while the microphone is active. Contains:
- "● Recording" indicator
- "Nakikinig…" heading with English subtitle
- `SiriWave` canvas animation (pixelated waveform, active mode)
- Live transcript preview (updates on interim speech results)
- Cancel button

Behavior on speech result:
- Emergency detected (score ≥ 3) → submit immediately → confirmed or offline-queued
- Non-empty non-emergency → pre-fill text input → return to idle with overlay open
- Empty or no-speech → return to idle silently

### Confirmed (online)
Shown after a successful request submission. Contains:
- CheckCircle2 icon in emerald
- "Naipadala na!" heading
- Request detail card: ID, status badge, priority progress bar, coordinates, people count
- Blue safety advisory: "Manatili sa pwesto"
- "Send another request" button → resets all state

### Offline Queued
Shown when the device is offline at submission time. Contains:
- Amber offline warning: "Walang Signal"
- Queued request card: ID, QUEUED badge, GPS coordinates, people count
- Amber advisory: "Huwag isara ang app"
- "Try again" button → resets all state

### Text Input Overlay (Screen 1b)
Fixed overlay on top of idle. Contains:
- "Describe your emergency" heading with "Ano ang nangyayari?" subtitle
- Close (X) button
- Textarea (max 300 chars) with character counter
- Live keyword detection pills (updates on every keystroke)
- Priority level progress bar (shown when score > 0)
- "Request Rescue · Humingi ng Saklolo" submit button (disabled when empty)

---

## Components

### `PixelSOSButton`
**File:** `src/components/PixelSOSButton.tsx`

A canvas-drawn circular button with animated pixelated ripple rings.

- `buildDots()` pre-computes all grid cells (5px dots, 3px gaps) that fall inside a 220px circle using a distance check, storing each dot's `dist` and `angle`.
- Each animation frame evaluates three layered sine waves per dot: two radial ripples travelling outward at different speeds, and one angular shimmer rotating around the circle.
- Colour shifts from deep red (hue 2°) at the centre to orange-red (hue 20°) at the edge using `hsl()`.
- Press feedback: `onPointerDown/Up/Leave` lerps `pressScaleRef` toward 0.93 on press and back to 1 on release, applied via `ctx.scale()`.
- A neumorphic outer ring `div` sits behind the canvas via `position: absolute`.
- The "SOS" label and sublabel are rendered **above** the canvas in a separate `div` — not inside the canvas — so they stay crisp at all screen densities.

Props:
```ts
{
  onClick: () => void
  label?: string       // default "SOS"
  sublabel?: string    // default "Tap to speak"
}
```

### `SiriWave`
**File:** `src/components/SiriWave.tsx`

A canvas-based pixelated waveform used on the listening screen.

- Grid of 5px square dots (40 columns × 12 rows, 4px gap).
- Three layered sine waves per column: fast radial, medium radial, slow radial.
- Bell-curve amplitude envelope — quiet at edges, loud in the centre.
- Colour: red (hue 0°) → orange-red (hue 22°) across columns.
- `active` prop controls animation speed and amplitude (fast + full when `true`, slow + dim when `false`).

Props:
```ts
{ active?: boolean }  // default true
```

---

## Hooks

### `useGeolocation`
**File:** `src/hooks/useGeolocation.ts`

Wraps `navigator.geolocation.getCurrentPosition`.

- High accuracy mode, 8s timeout, no cached position (`maximumAge: 0`).
- Pre-warms on mount via `setTimeout(() => capture(), 0)`.
- On any failure: falls back to Manila coords `{ lat: 14.5995, lng: 120.9842 }`.
- Returns: `{ coords, error, loading, status, capture }`
  - `status`: `'acquiring' | 'ready' | 'failed'`

### `useSpeech`
**File:** `src/hooks/useSpeech.ts`

Wraps `window.SpeechRecognition` / `window.webkitSpeechRecognition`.

- Language: `fil-PH`. Interim results enabled. Max 3 alternatives. Not continuous.
- Interim results update `transcript` state in real time.
- On final result: runs `detectIntent`, calls `onResult(result, finalTranscript)`.
- `no-speech` error is swallowed silently.
- `not-allowed` sets a bilingual error message.
- Returns: `{ listening, error, transcript, start, stop }`

### `useOnlineStatus`
**File:** `src/hooks/useOnlineStatus.ts`

- Reads `navigator.onLine`, `navigator.connection.type`, `navigator.connection.effectiveType`.
- Listens to `window` `online`/`offline` events and `navigator.connection` `change` event.
- Cleans up all listeners on unmount.
- Returns: `{ online, type, effectiveType }`

### `usePWAInstall`
**File:** `src/hooks/usePWAInstall.ts`

- Captures `beforeinstallprompt`, prevents default, stores deferred prompt.
- `canInstall` is `true` when the prompt is ready.
- `installed` is `true` after `appinstalled` fires.
- `install()` triggers the native install dialog.
- Returns: `{ canInstall, installed, install }`

---

## Library Functions

### `detectIntent`
**File:** `src/lib/intentDetect.ts`

Scores a raw transcript string against a bilingual keyword table.

Keyword score table:
| Category | Keywords | Score |
|---|---|---|
| Distress triggers | tulong, help, rescue, sagipin, sos | 3 |
| Disaster types | baha, flood, sunog, fire, lindol, stranded, naiipit, trapped | 2 |
| Children | bata, baby, sanggol | 2 |
| Elderly | matanda, lola, lolo, elderly | 2 |
| Injury / death | sugatan, injured, patay, dead, unconscious | 3 |
| Crowd multipliers | marami, pamilya, many, family | 1 |

- Emergency threshold: total score ≥ 3
- Priority capped at 5
- Keywords deduplicated in output

Returns: `{ isEmergency: boolean, priority: number, detectedKeywords: string[] }`

### `rescueStore`
**File:** `src/lib/rescueStore.ts`

No-backend data layer using `BroadcastChannel` (channel name: `rescue_channel`) and `localStorage` (key: `rescue_requests`).

| Function | Description |
|---|---|
| `generateRequestId()` | Returns `USR-XXXX` with zero-padded counter from localStorage |
| `publishRequest(request)` | Saves to localStorage array + broadcasts `NEW_REQUEST` message |
| `publishStatusUpdate(id, status)` | Updates localStorage entry + broadcasts `UPDATE_STATUS` message |
| `loadPersistedRequests()` | Reads and parses localStorage array, returns `RescueRequest[]` |
| `subscribeToStore(onMessage)` | Opens BroadcastChannel listener, returns cleanup function |

All localStorage operations are wrapped in try/catch.

---

## Types

**File:** `src/types/rescue.ts`

```ts
type RescueStatus = 'waiting' | 'rescued' | 'critical'

interface RescueRequest {
  id: string               // USR-XXXX format
  lat: number
  lng: number
  message: string
  status: RescueStatus
  priority: number         // 0–5
  peopleCount: number
  distressKeywords: string[]
  createdAt: string        // ISO string
  rescuedAt?: string       // ISO string, set when status → rescued
  area?: string
}

interface StatsSnapshot {
  total: number
  waiting: number
  rescued: number
  critical: number
}

type StoreMessage =
  | { type: 'NEW_REQUEST'; payload: RescueRequest }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: RescueStatus } }
```

---

## Business Logic Rules

### Request ID
Format: `USR-` + zero-padded 4-digit counter incremented per session in localStorage.
Examples: `USR-0001`, `USR-0002`.

### Status Derivation
- Priority 4 or 5 → `critical`
- Priority 1, 2, or 3 → `waiting`
- After rescuer action → `rescued` (set by dashboard, not this app)

### People Count Priority Boost
If `peopleCount > 1`, add 1 to the computed priority before capping at 5.

### GPS Fallback
If GPS fails for any reason, fall back to `{ lat: 14.5995, lng: 120.9842 }` (Metro Manila center). Submission is never blocked by GPS failure.

### Network Label Mapping
| `type` | `effectiveType` | Display |
|---|---|---|
| `wifi` | any | Wi-Fi |
| cellular | `4g` | 4G |
| cellular | `3g` | 3G |
| cellular | `2g` / `slow-2g` | Weak |
| offline | — | Offline |
| unknown | — | Online |

---

## PWA Configuration

### Manifest (`/public/manifest.json`)
- Name: `RescueNow — Emergency Help`
- Short name: `RescueNow`
- Start URL: `/rescue`
- Display: `standalone`
- Orientation: `portrait`
- Theme color: `#ef4444`
- Background color: `#ffffff`
- Icon: `/icons/icon.svg` (192×192 and 512×512, maskable)
- Shortcut: "Request Rescue" → `/rescue`

### Service Worker (`/public/sw.js`)
- Cache name: `rescuenow-v1`
- Pre-caches: `/rescue`, `/manifest.json`, `/icons/icon.svg`, `/`
- Activate: deletes all stale caches
- Navigation requests: cache-first, fallback to network
- Static assets (style, script, image): cache-first
- All other requests: network-first, fallback to cache
- `skipWaiting()` + `clients.claim()` for immediate activation

### Layout (`src/app/layout.tsx`)
- `<html lang="fil">` — primary language is Filipino
- Viewport: `width=device-width`, `initialScale=1`, `maximumScale=1`
- Theme color: `#ef4444`
- `ServiceWorkerRegister` component mounts the service worker on client

---

## Design System

### Theme
Light neumorphic. Background: `#e8edf3`. All surfaces use two shadow utilities:

```css
/* Raised surface */
.nmCard  → box-shadow: 6px 6px 14px rgba(0,0,0,0.10), -5px -5px 12px rgba(255,255,255,0.85)
           border: 1px solid rgba(255,255,255,0.60)

/* Pressed / inset surface */
.nmInset → box-shadow: inset 4px 4px 10px rgba(0,0,0,0.09), inset -4px -4px 10px rgba(255,255,255,0.80)
```

These are applied as inline Tailwind arbitrary values in `rescue/page.tsx` via the `nmCard` and `nmInset` string constants.

Additional utilities in `globals.css`:
- `.sos-ring` — pulsing red glow keyframe animation
- `.stat-card` — semi-transparent glass card (used in dark mode contexts)
- `.glass-panel` — backdrop-blur glass surface
- `.neumorphic-surface` / `.neumorphic-pressed` / `.neumorphic-outline` — legacy neumorphic classes

### Typography
- Body: Plus Jakarta Sans (`font-sans`)
- IDs, coordinates, timestamps: IBM Plex Mono (`font-mono`)
- Minimum body text: 16px. Minimum label: 14px. Never below 12px.
- Max two font weights per screen: regular (400) and semibold (600).

### Colour Semantics
| Colour | Meaning |
|---|---|
| Red (`red-500`) | SOS button, offline, critical, error |
| Emerald (`emerald-500`) | Success, online, GPS ready |
| Amber (`amber-500`) | Queued, weak signal, waiting |
| Blue (`blue-500`) | Active listening, informational |
| Slate | Neutral text, labels, icons |

Color is never the sole conveyor of meaning — every colored element also carries a text label.

### Touch Targets
- Minimum: 44×44px for all interactive elements (WCAG 2.5.5)
- SOS button: 220×220px canvas
- People counter buttons: 36×36px (meets minimum with padding)
- No two interactive elements within 8px of each other

---

## Accessibility Requirements

Every item below is a hard requirement, not a suggestion.

- SOS button: `aria-label` in Filipino and English
- People count display: `aria-live="polite"`
- Live transcript: `aria-live="polite"`
- Offline alert: `role="alert"`
- Network and GPS badges: `aria-label` describing current state
- All icon-only buttons: `aria-label` required
- Request detail card: `aria-label="Rescue request details"`
- Priority progress bar: `aria-label` + `aria-valuenow`
- Textarea: `aria-describedby` pointing to character counter element
- Focus ring: 3px solid, 2px offset, semantic color, `:focus-visible` only
- Tab order follows visual reading order top to bottom
- No focus trap — user can tab through all elements freely

---

## Animation Rules

- Every animation must be wrapped in `@media (prefers-reduced-motion: reduce)`.
- When reduced motion is preferred, all animations are removed entirely.
- The only animations in the app are:
  1. `SiriWave` canvas animation on the listening screen
  2. `PixelSOSButton` canvas ripple on the idle screen
  3. `sos-ring` CSS pulse on the SOS button
- No decorative animation anywhere else.

---

## What Must NOT Be Done

- No SMS — explicitly excluded from this version
- No backend API calls — data flows through BroadcastChannel only
- No routing between pages — everything is one page with state
- No inline styles where Tailwind classes exist
- No font weights above 600
- No text below 12px
- No skipping aria attributes listed above
- No animation other than the three listed above
- No hardcoded colors outside Tailwind utilities or shadcn tokens
- Never assume the user has internet — always check `online` before broadcasting or queuing

---

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

App runs at `http://localhost:3000` and redirects to `http://localhost:3000/rescue`.

---

## Current State (as of last update)

- All four screens implemented and functional
- `PixelSOSButton` — canvas ripple animation, label above, neumorphic ring
- `SiriWave` — canvas pixelated waveform, active/idle modes
- Light neumorphic design applied consistently across all screens
- Voice recognition in `fil-PH` with interim transcript display
- GPS pre-warmed on mount with Manila fallback
- BroadcastChannel + localStorage data layer fully wired
- PWA manifest and service worker in place
- Offline queue flow functional
- Install banner shown when `canInstall` is true
- Responsive layout: `max-w-md mx-auto` centers content on wider screens
- Text input overlay uses `fixed inset-0` to cover full viewport on scroll
