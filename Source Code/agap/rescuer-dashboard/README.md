# AGAP — Responder Command Center

A real-time emergency response dashboard for rescue coordinators. Built with React, Vite, Leaflet, and Supabase.

## Features

- **Live map** — Leaflet map of the Philippines showing all active distress signals as color-coded pulsing markers
- **Triage feed** — Sidebar listing signals ordered by recency with severity tags and voice transcripts
- **Signal detail modal** — Full signal info with an inline status updater (pending → in-progress → resolved)
- **Voice alerts** — Web Speech Synthesis announces new critical (`dire`) signals automatically
- **Realtime sync** — Supabase Postgres CDC pushes INSERT/UPDATE events to all connected dashboards instantly
- **Dark / light theme** — Persisted in `localStorage`, defaults to dark
- **Signal simulator** — Dev button that inserts a random signal near Manila for testing

## Tech Stack

| Layer               | Library                    |
| ------------------- | -------------------------- |
| UI framework        | React 18 + TypeScript      |
| Build tool          | Vite 6                     |
| Routing             | React Router v7            |
| Map                 | Leaflet + react-leaflet    |
| Database / Realtime | Supabase JS v2             |
| Charts              | Chart.js + react-chartjs-2 |
| Styling             | Tailwind CSS v3            |
| Headless UI         | @headlessui/react          |
| Icons               | lucide-react               |
| Date formatting     | date-fns                   |

## Project Structure

```
src/
├── components/
│   ├── Map.tsx               # Leaflet map with pulsing markers
│   ├── Sidebar.tsx           # Live triage feed panel
│   ├── SignalDetailsModal.tsx # Signal detail + status update modal
│   └── Empty.tsx             # Generic empty-state placeholder
├── hooks/
│   └── useTheme.ts           # Dark/light theme toggle, persisted to localStorage
├── lib/
│   └── utils.ts              # cn() — clsx + tailwind-merge helper
├── pages/
│   ├── Dashboard.tsx         # Main page: map + sidebar + header
│   ├── Analytics.tsx         # Charts: signal trends and severity distribution
│   ├── Login.tsx             # Supabase auth login form
│   └── Home.tsx              # Redirect placeholder
├── supabase/
│   └── client.ts             # Supabase client singleton
├── types/
│   └── index.ts              # Shared TypeScript interfaces
├── utils/
│   └── VoiceAlertSystem.ts   # Web Speech Synthesis wrapper
├── App.tsx                   # Router setup
└── main.tsx                  # React entry point
```

## Key Components

### `Dashboard.tsx`

The main page. Responsibilities:

- Fetches all signals on mount and subscribes to Supabase realtime changes
- Manages `activeSignalId` and `mapCenter` state to sync the map and sidebar
- Renders the header (stats bar, theme toggle, AI dispatcher toggle), map, sidebar, and modal

### `Map.tsx`

Renders a `MapContainer` bounded to the Philippines. Each `DistressSignal` becomes a `Marker` with a color-coded `DivIcon`:

- 🔴 Red pulse — `severity: 'dire'` and not resolved
- 🟠 Orange pulse — `severity: 'normal'` and not resolved
- 🟢 Green pulse — `status: 'resolved'`

Clicking a marker opens a popup with a "View Details" button. A `MapUpdater` sub-component uses `map.flyTo()` to animate the camera when `center` prop changes.

### `Sidebar.tsx`

Scrollable list of signals. Each card shows severity icon, timestamp, description, keyword tags, voice transcript excerpt, and status. Clicking a card triggers `onSignalClick` which opens the modal and flies the map to that signal.

### `SignalDetailsModal.tsx`

Headless UI `Dialog` with:

- A `Listbox` dropdown to change signal status via a Supabase `UPDATE`
- Severity, people count, GPS coordinates, and full voice transcript
- Loading and success feedback states

### `VoiceAlertSystem.ts`

Wraps `window.speechSynthesis`. The singleton `voiceSystem` is used by `Dashboard` to announce new `dire` signals. Exposes `setEnabled()`, `setVolume()`, `setRate()`, `announceAlert(signal)`, and `speak(text)`.

### `useTheme.ts`

Reads/writes `localStorage` key `theme`. Applies the class `dark` or `light` to `document.documentElement` on change.

## Data Model

### `DistressSignal`

```ts
interface DistressSignal {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  severity: "dire" | "normal";
  status: "pending" | "in-progress" | "resolved";
  people_count: number;
  voice_transcript: string | null;
  responder_notes: string | null;
  created_at: string;
  updated_at: string;
}
```

### `User`

```ts
interface User {
  id: string;
  phone_number: string;
  name: string | null;
  created_at: string;
}
```

### `Responder`

```ts
interface Responder {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}
```

## Database Schema

Migrations live in `supabase/migrations/`. The `distress_signals` table has:

- Indexes on `(latitude, longitude)`, `severity`, `status`, and `created_at DESC`
- Row Level Security enabled with open policies for `anon` (read, insert, update)

## Setup

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build
npm run preview   # preview production build
```

Environment: Supabase URL and anon key are hardcoded in `src/supabase/client.ts`. For production, move them to a `.env` file and reference via `import.meta.env`.

## Routes

| Path         | Component   | Description                  |
| ------------ | ----------- | ---------------------------- |
| `/`          | `Dashboard` | Main command center          |
| `/login`     | `Login`     | Supabase email/password auth |
| `/analytics` | `Analytics` | Signal trend charts          |

## Built with Trae

This project was scaffolded and developed using [Trae](https://trae.ai), an AI-native IDE. Trae was used across the full development lifecycle:

### 1. Product Requirements Document

Before writing any code, Trae's Builder mode was used to generate a structured PRD (`.trae/documents/product_requirements_document.md`). It defined:

- User roles (Emergency Responder, Rescue Coordinator) and their permissions
- Feature modules: Dashboard map, real-time alerts panel, voice alert system, signal details, analytics
- The full emergency response flow from mobile distress report → Agora ConvoAI → Supabase → dashboard
- UI design tokens: color palette, typography, layout breakpoints, and responsiveness rules

### 2. Technical Architecture Document

Trae generated a technical architecture document (`.trae/documents/technical_architecture_document.md`) that specified:

- The full system architecture diagram (browser → React → Supabase Realtime / DB / Auth)
- Technology choices: React 18, Vite, react-leaflet, Supabase JS v2, Headless UI, Tailwind CSS v3
- Route definitions, API contracts, and Supabase realtime subscription patterns
- Complete data model with ERD, DDL for all three tables (`distress_signals`, `users`, `responders`), RLS policies, and indexes
- The `VoiceAlertSystem` class design using the Browser TTS API

### 3. Code Generation

With the PRD and architecture docs in place, Trae generated the initial implementation including:

- The Leaflet map with color-coded pulsing `DivIcon` markers
- The Supabase realtime channel subscription in `Dashboard.tsx`
- The `SignalDetailsModal` with Headless UI `Listbox` for status updates
- The `VoiceAlertSystem` singleton and its integration with the dashboard
- The `useTheme` hook with `localStorage` persistence
- Tailwind config, Vite config, and TypeScript setup

### 4. Iterative Refinement

Trae's inline chat was used throughout development to refine components, fix RLS policy issues, add the dark/light tile layer switching on the map, and tune the animated pulse markers.
