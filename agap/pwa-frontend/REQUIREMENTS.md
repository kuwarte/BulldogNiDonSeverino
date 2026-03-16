# RescueNow PWA — Agent Requirements

> Read this entire file before writing any code.
> This is the single source of truth for the victim-facing PWA.

---

## What this app does

A Progressive Web App for flood and disaster victims in the Philippines.
The user opens the app on their mobile phone during a disaster, speaks or
types a distress message in Filipino or English, and the app captures their
GPS location and sends a rescue request to the operations center dashboard
in real time. The app must work with or without internet. It must be
installable on Android home screen.

---

## Who uses this app

Design and build for all of these user types simultaneously:

- Elderly users with limited smartphone experience
- Users in panic under physical and emotional stress
- Users with visual impairments who rely on screen readers
- Users with motor impairments who need large touch targets
- Users on low-end Android devices with small screens (320px wide minimum)
- Users who do not speak English fluently

---

## Route

Single route: `/rescue`

All screens are managed by a state variable inside one page component.
No sub-routes. No navigation between pages.

---

## Tech stack

| Layer | Decision |
|---|---|
| Framework | Next.js 14, App Router |
| Language | TypeScript, strict mode |
| UI components | shadcn/ui built on Radix UI primitives |
| Styling | Tailwind CSS (shadcn default config) |
| Body font | Plus Jakarta Sans via next/font/google |
| Mono font | IBM Plex Mono via next/font/google (IDs, coords, timestamps only) |
| Voice input | Web Speech API — browser built-in, no SDK |
| GPS | Geolocation API — browser built-in |
| Network detection | Network Information API + navigator.onLine |
| Data bridge | BroadcastChannel + localStorage (prototype, no backend) |
| PWA install | beforeinstallprompt event |
| Offline shell | Service worker in /public/sw.js |
| SMS | Not included in this version |

---

## File structure to create

```
src/app/rescue/
    page.tsx                   main PWA page

src/hooks/
    useGeolocation.ts
    useSpeech.ts
    useOnlineStatus.ts
    usePWAInstall.ts

src/lib/
    intentDetect.ts
    rescueStore.ts

src/types/
    rescue.ts

public/
    manifest.json
    sw.js
    icons/
        icon-192.png
        icon-512.png
```

---

## Screens

Five screens managed by a `screen` state variable plus a `showTextInput`
boolean that overlays the idle screen.

```
type Screen = 'idle' | 'listening' | 'confirmed' | 'offline-queued'
```

---

### Screen 1 — Idle

The default state the user sees when they open the app.

**Must contain:**
- App header with brand name left, live network status badge right
- Install-to-home-screen banner — only shown when installable, dismissible
- Instruction text in Filipino with English translation below
- One large circular SOS button — the only dominant visual element on screen
- People count stepper: minus button, number display, plus button
- GPS status indicator showing: acquiring, ready, or failed
- Network status indicator
- Text fallback link for users who cannot or prefer not to speak

**Primary action:** Tapping the SOS button starts voice recognition and
transitions to the Listening screen.

**Secondary action:** Tapping the text fallback link shows the text input overlay.

---

### Screen 1b — Text input overlay

Shown on top of idle for users who prefer or need to type.

**Must contain:**
- Back link to return to idle
- Label in Filipino with English translation
- Textarea for the emergency message, max 300 characters
- Character counter that changes color when approaching the limit
- Live keyword detection panel — updates on every keystroke showing which
  emergency keywords were found and the current priority score
- People count stepper (same as idle)
- Submit button — disabled when textarea is empty

**Primary action:** Submitting triggers GPS capture, builds the rescue request,
and transitions to the appropriate confirmed screen.

---

### Screen 2 — Listening

Shown while the microphone is actively recording.

**Must contain:**
- Visual pulse indicator showing the mic is active
- Status heading in Filipino with English translation
- Short instruction on what to say
- Live transcript preview showing partial speech as it is being recognized
- Cancel button to stop recording and return to idle

**Behavior:**
- Emergency detected → capture GPS → transition to confirmed or offline-queued
- Non-empty non-emergency transcript → pre-fill text input, show text overlay
- Empty result or no-speech error → return to idle silently

---

### Screen 3 — Confirmed (online)

Shown after a rescue request is sent successfully while online.

**Must contain:**
- Success visual (checkmark icon, green)
- Confirmation heading in Filipino with English translation
- Reassurance body text in both languages
- Request detail card showing: request ID, status badge, priority score,
  GPS coordinates, people count, detected keywords, sent timestamp
- Safety advice to stay in place — in both languages
- Send another request button

---

### Screen 4 — Offline queued

Shown when a rescue request is saved locally because the device is offline.

**Must contain:**
- Prominent offline warning in both languages explaining the request is
  queued and will send automatically when connection returns
- Queued request card showing: request ID, queued time, GPS coordinates,
  people count
- Confirmation that GPS coordinates were captured successfully
- GPS status (ready) and network status (offline) indicators
- Safety advice to keep the app open and stay in place — both languages
- Send another request button

---

## Hooks — responsibilities

### useGeolocation

- Wrap `navigator.geolocation.getCurrentPosition`
- Use high accuracy mode, 8 second timeout, no cached position
- Expose: current coords, error message, loading boolean, capture function
- On permission denied: set a readable bilingual error message
- On timeout or any failure: fall back silently to Metro Manila center
  coordinates (lat 14.5995, lng 120.9842)
- Pre-warm GPS on page mount before the user presses anything

### useSpeech

- Use `window.SpeechRecognition` or `window.webkitSpeechRecognition`
- Language: `fil-PH`
- Interim results enabled, max 3 alternatives, not continuous
- During speech: update live transcript state with interim text
- On final result: score all alternatives with `detectIntent`, pick
  the highest priority result, call the provided `onResult` callback
- Handle `no-speech` silently with no error shown
- Handle `not-allowed` with a readable bilingual error message
- Detect when the Speech API is unavailable and set an appropriate error
- Expose: listening boolean, error message, live transcript, start, stop

### useOnlineStatus

- Read `navigator.onLine` for the online boolean
- Read `navigator.connection.type` for connection type
- Read `navigator.connection.effectiveType` for signal quality
- Listen to window `online` and `offline` events
- Listen to `navigator.connection` change event
- Clean up all event listeners on unmount
- Return all values in a single status object

### usePWAInstall

- Capture the `beforeinstallprompt` event, prevent its default
- Expose `canInstall` true when the prompt is ready
- Expose `installed` true when `appinstalled` fires or app is in standalone mode
- Expose `install` function that triggers the native install dialog

---

## Lib functions — responsibilities

### intentDetect

- Accept a raw transcript string
- Lowercase and split into words
- Match words against a keyword score table covering Filipino and English:
  - Distress triggers (tulong, help, rescue, sagipin, sos): score 3
  - Disaster types (baha, flood, sunog, fire, lindol, stranded, naiipit, trapped): score 2
  - Children (bata, baby, sanggol): score 2
  - Elderly (matanda, lola, lolo, elderly): score 2
  - Injury or death (sugatan, injured, patay, dead, unconscious): score 3
  - Crowd multipliers (marami, pamilya, many, family): score 1
- Flag as emergency when total score reaches threshold of 3
- Cap priority at 5
- Deduplicate keywords in the output list
- Return: isEmergency boolean, priority number 0–5, detectedKeywords array

### rescueStore

- `publishRequest`: post to BroadcastChannel and persist to localStorage
- `subscribeToStore`: open BroadcastChannel listener, return cleanup function
- `publishStatusUpdate`: broadcast a status change for the dashboard to consume
- `loadPersistedRequests`: read localStorage array for dashboard initial load
- All localStorage operations wrapped in try/catch

---

## Types — what must be defined

All shared types live in `src/types/rescue.ts`:

- `RescueStatus`: union of waiting, rescued, critical
- `RescueRequest`: id, lat, lng, message, status, priority, peopleCount,
  distressKeywords array, createdAt ISO string, rescuedAt ISO string optional, area string
- `StatsSnapshot`: total, waiting, rescued, critical as numbers
- `StoreMessage`: discriminated union of NEW_REQUEST and UPDATE_STATUS payloads

---

## PWA manifest requirements

- App name: RescueNow — Emergency Help
- Short name: RescueNow
- Start URL: /rescue
- Display mode: standalone
- Orientation: portrait
- Theme color: red matching the SOS button
- Background color: white
- Two icon sizes: 192×192 and 512×512, both maskable
- One shortcut pointing directly to /rescue labeled "Request Rescue"

---

## Service worker requirements

- Pre-cache /rescue and /rescue/offline on install
- Delete stale caches on activate
- Cache-first for navigation and static assets
- Network-first for any API calls
- No SMS sync — excluded from this version

---

## UI and UX design rules

These are hard requirements, not suggestions. The agent must follow
every rule on every screen.

### Whitespace

- Every screen has exactly one primary action. Nothing else competes visually.
- Minimum 24px horizontal padding on all screens.
- Minimum 24px vertical gap between all major sections.
- When in doubt, add space rather than remove it.

### Typography

- Body text in Plus Jakarta Sans only.
- IDs, coordinates, timestamps in IBM Plex Mono only.
- Maximum two font weights per screen: regular (400) and semibold (600).
- Do not use bold (700) or heavier — it feels aggressive in emergency UI.
- Minimum body text: 16px. Minimum label text: 14px. Never below 12px.

### Color usage

- Color communicates state only. Never decorative.
- Green = success, online, GPS ready.
- Amber/orange = queued, weak signal, waiting status.
- Red = SOS button, offline, critical, error.
- Blue = active listening state.
- Every colored element must also carry a text label. Color alone never
  conveys meaning — color-blind users must receive the same information.

### Touch targets

- Minimum 44×44px for every interactive element (WCAG 2.5.5).
- SOS button must be at least 144×144px.
- People count minus and plus buttons must each be at least 44×44px.
- No two interactive elements within 8px of each other.

### Contrast

- All text on backgrounds meets WCAG AA minimum of 4.5:1 contrast ratio.
- Badge text uses the darkest shade of its own color family, not generic black.

### Focus and keyboard

- Every interactive element has a visible focus ring on keyboard navigation.
- Use :focus-visible so the ring only shows for keyboard users.
- Focus ring: 3px solid, 2px offset, color matching the element's semantic color.
- Tab order follows visual reading order top to bottom.
- The SOS button activates on both Enter and Space keys.

### Motion and animation

- Every animation is wrapped in a prefers-reduced-motion media query.
- When reduced motion is preferred, all animations are removed entirely.
- The listening screen pulse is the only animation in the app.
- No decorative animation anywhere else.

### Screen reader accessibility

- SOS button: descriptive aria-label in Filipino and English.
- People count value display: aria-live polite.
- Live transcript element: aria-live polite.
- Offline alert: role alert or a component that maps to role alert.
- Network and GPS badges: aria-label describing the current state.
- All icon-only buttons: aria-label required, no exceptions.
- Request detail card: aria-label of "Rescue request details".
- Priority progress bar: aria-label and aria-valuenow set.
- Textarea: aria-describedby pointing to the character counter element.
- Focus trap must not be present — user can tab through all elements freely.

### Language

- Primary text in Filipino (Tagalog) on every screen.
- English translation directly below in smaller muted text.
- Error messages in both languages on every error state.
- Button primary labels in Filipino.

---

## shadcn/ui components to use

Before building the page, install these components:

```
button  badge  card  textarea  separator  progress  alert  toast
```

Component to UI element mapping:

- SOS button → Button with custom rounded-full class and red background
- Network and GPS status → Badge, variant outline
- Request detail container → Card and CardContent
- Priority score → Progress
- Offline warning → Alert, variant destructive
- Request sent confirmation → Toast via useToast hook
- Message text input → Textarea
- Detected keyword pills → Badge, variant secondary
- Section dividers → Separator
- Install prompt → Alert with a dismiss Button inside

---

## Business logic rules

### Request ID format

IDs use prefix USR- followed by a zero-padded four-digit counter
incremented per session. Example: USR-0001, USR-0002.

### Status derivation

- Priority 4 or 5 → status is critical
- Priority 1, 2, or 3 → status is waiting
- After rescuer action → status is rescued and rescuedAt is set

### GPS fallback

If GPS capture fails for any reason, fall back to Metro Manila center
coordinates lat 14.5995 lng 120.9842. Mark GPS status as failed for
the badge display. Never block submission because of GPS failure.

### Network label mapping

| Connection type | Effective type | Display label (Filipino / English) |
|---|---|---|
| wifi | any | Wi-Fi |
| cellular | 4g | Mobile data |
| cellular | 3g | Mobile data (3G) |
| cellular | 2g or slow-2g | Mahinang signal / Weak signal |
| none or offline | — | Walang signal / No internet |
| unknown | — | Konektado / Connected |

---

## What the agent must NOT do

- Do not add SMS — it is explicitly excluded from this version
- Do not add any backend API calls — data flows through BroadcastChannel only
- Do not add routing between pages — everything is one page with state
- Do not use inline styles where Tailwind classes exist
- Do not use font weights above 600
- Do not render text below 12px
- Do not skip any aria attribute listed in the accessibility section
- Do not add any animation other than the listening screen pulse
- Do not use prefers-reduced-motion as optional — it is required
- Do not hardcode colors outside of Tailwind utilities or shadcn tokens
- Do not assume the user has internet — always check online status before
  deciding whether to broadcast or queue