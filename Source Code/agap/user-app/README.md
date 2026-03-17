# AGAP — Emergency Rescue App

A real-time emergency rescue app for citizens in distress. Built with Next.js, React, TypeScript, and Supabase.

## Features

- **Voice SOS** — Tap to speak your emergency, voice is transcribed and analyzed for priority and keywords
- **Text SOS** — Option to type your emergency if voice is unavailable
- **Location tracking** — Captures your GPS coordinates automatically
- **Priority detection** — Real-time keyword extraction and severity scoring
- **Offline queue** — Requests are queued and sent automatically when signal returns
- **PWA support** — Installable as a mobile app for offline use
- **Status bar & phone nav** — Mimics native phone UI for accessibility
- **Light mode** — Clean, accessible interface

## Tech Stack

| Layer               | Library                            |
| ------------------- | ---------------------------------- |
| UI framework        | Next.js 15 + React 18 + TypeScript |
| Build tool          | Next.js (App Router)               |
| Database / Realtime | Supabase JS v2                     |
| Styling             | Tailwind CSS v3                    |
| Headless UI         | @headlessui/react                  |
| Icons               | lucide-react                       |
| Voice recognition   | Web Speech API                     |
| Toasts              | sonner                             |
| PWA                 | next-pwa                           |

## Project Structure

```
src/
├── app/
│   ├── rescue/                # Main rescue flow (voice/text input, confirmation)
│   ├── layout.tsx             # App shell, phone UI
│   └── page.tsx               # Entry point
├── components/
│   ├── StatusBar.tsx          # Phone status bar (time, signal, battery)
│   ├── PhoneNavBar.tsx        # Phone nav bar (back, home, tabs)
│   ├── PixelSOSButton.tsx     # SOS button (voice trigger)
│   ├── SiriWave.tsx           # Voice listening animation
│   ├── VoiceChannel.tsx       # Voice recognition logic
│   └── ui/                    # Headless UI primitives
├── hooks/
│   ├── useAgoraVoiceClient.ts # Web Speech API voice recognition
│   ├── useGeolocation.ts      # Location tracking
│   ├── useOnlineStatus.ts     # Network status
│   ├── usePWAInstall.ts       # PWA install prompt
│   └── useTriageAgent.ts      # Emergency triage state machine
├── lib/
│   ├── intentDetect.ts        # Keyword extraction & priority scoring
│   ├── rescueStore.ts         # Request publishing & state
│   └── utils.ts               # Utility functions
├── types/
│   ├── rescue.ts              # Rescue request interfaces
│   └── global.d.ts            # Global types
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icons/                 # App icons
```

## Key Components

### `rescue/RescuePage.tsx`

- Main emergency flow: voice/text input, keyword detection, priority scoring, confirmation

### `useAgoraVoiceClient.ts`

- Handles browser-native voice recognition (Web Speech API)

### `useGeolocation.ts`

- Captures device GPS coordinates for each request

### `intentDetect.ts`

- Extracts keywords and calculates priority from user speech/text

## Usage

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
2. **Run the app:**
   ```bash
   pnpm dev
   ```
3. **Open in browser:**
   - Go to `http://localhost:3000`
   - Grant microphone and location permissions

## Development Notes

- Prototype: No Agora integration (prototype), uses browser-native APIs
- Location tracking: Falls back to Manila if GPS unavailable
- Voice recognition: Chrome/Edge recommended for best support
- PWA: Installable for offline use

## License

MIT
