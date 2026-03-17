# AGAP: Emergency Response System

**Automated, Georeferenced, and Adaptive platform for Predictive flood rescue** by analyzing voice distress to pinpoint and report critical emergencies in real-time. A two-part disaster response platform built for the Philippines that connects citizens in distress with emergency responders instantly.

![AGAP Logo](./Deck%20&%20Demo/AGAP_Logo.png)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [How It Works](#how-it-works)
5. [Projects](#projects)
6. [Tech Stack](#tech-stack)
7. [Repository Structure](#repository-structure)
8. [Getting Started](#getting-started)
9. [Database Schema](#database-schema)

---

## Overview

AGAP is a real-time disaster response platform designed to save lives during emergencies, especially in flood-prone areas. The system comprises two main applications:

1. **User App (PWA)** — Mobile-first SOS application for citizens
2. **Rescuer Dashboard** — Real-time command center for emergency responders

Citizens can request help by speaking or typing, and rescuers see distress signals appear instantly on a live map with priority scoring and location data.

### Why AGAP?

- **Voice-first**: Easy to use in emergencies when typing is difficult
- **Offline-capable**: PWA works without internet (requests queue locally)
- **Location-aware**: Automatically captures GPS for rapid response
- **Priority-driven**: AI analyzes speech to score severity
- **Real-time**: Supabase pushes updates to all responders instantly

---

## Key Features

### User App (Citizens)

| Feature                 | Description                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| **Voice SOS**           | Tap button, speak emergency — transcribed and analyzed in real-time |
| **Text SOS**            | Type your emergency if voice unavailable                            |
| **Location Tracking**   | Auto-captures GPS coordinates for dispatch                          |
| **Priority Detection**  | Keywords extracted from speech → severity score (0-5)               |
| **Offline Queue**       | Requests queue locally, send automatically when online              |
| **Phone UI**            | Native-looking status bar and navigation for familiarity            |
| **PWA Support**         | Installable as mobile app, works offline                            |
| **Confirmation Screen** | Shows what was heard + detected keywords before sending             |

### Rescuer Dashboard (Responders)

| Feature                 | Description                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- |
| **Live Map**            | Leaflet map of Philippines showing distress signals as color-coded pulsing markers |
| **Triage Sidebar**      | Feed of all signals ordered by recency & severity                                  |
| **Signal Detail Modal** | Full info: transcript, keywords, priority, location, people count                  |
| **Status Updater**      | Update signal status: pending → in-progress → resolved                             |
| **Voice Alerts**        | Web Speech Synthesis announces critical signals automatically                      |
| **Real-time Sync**      | Supabase CDC pushes updates to all dashboards instantly                            |
| **Analytics**           | Charts showing signal trends, severity distribution                                |
| **Dark/Light Theme**    | Persisted theme preference                                                         |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGAP Platform                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │   User App       │              │  Rescuer Dashboard   │     │
│  │   (Next.js PWA)  │              │    (React + Vite)    │    │
│  ├──────────────────┤              ├──────────────────────┤    │
│  │ ✓ Voice SOS      │              │ ✓ Live Map (Leaflet) │    │
│  │ ✓ Text SOS       │              │ ✓ Triage Feed        │    │
│  │ ✓ Location       │              │ ✓ Signal Details     │    │
│  │ ✓ Priority Calc  │              │ ✓ Status Updates     │    │
│  │ ✓ Offline Queue  │              │ ✓ Voice Alerts       │    │
│  └────────┬─────────┘              └──────────┬───────────┘    │
│           │                                   │                │
│           └──────────────┬──────────────────┘                 │
│                          │                                     │
│           ┌──────────────▼──────────────┐                     │
│           │   Supabase (PostgreSQL)     │                     │
│           ├─────────────────────────────┤                     │
│           │ distress_signals table      │                     │
│           │ - id, user_id, transcript   │                     │
│           │ - location (lat/lng)        │                     │
│           │ - priority, keywords        │                     │
│           │ - status, people_count      │                     │
│           │ - created_at, updated_at    │                     │
│           └─────────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Works

### Flow Diagram

```
CITIZEN PATH                              RESPONDER PATH
═════════════                             ═══════════════

1. Open app
   ↓
2. Tap SOS button ──────────────────────────→ Voice Recognition
   ↓                                        Starts
3. Speak emergency
   (e.g., "Water is rising, help!")        Real-time Transcript
   ↓                                        + Keyword Extraction
4. Stop speaking                           + Priority Scoring
   (2+ sec silence)
   ↓
5. Message finalized ───────────────────────→ Intent Analysis
   - Transcript: "Water is rising"          - Keywords: ["water", "rising"]
   - Keywords: ["water", "rising"]          - Priority: 4/5
   - Priority: 4/5
   ↓
6. Location captured
   - GPS: 14.5995, 120.9842
   ↓
7. Confirmation screen
   Shows what was heard
   ↓
8. User confirms ──────────────────────────→ RescueRequest published
   ↓                                         to Supabase
9. Online?
   YES: Sent immediately
   NO: Queued locally ────────────────────→ Queued until online
   ↓
10. Confirmation: "Help is on the way" ←── Responder updates status
                                           Signal appears on map
                                           Voice announces: "Critical
                                            signal near Manila"
                                           Rescuer views full details
                                           Updates: pending →
                                            in-progress → resolved
```

### Message Flow

```
User App                      Supabase                   Dashboard
─────────                     ────────                   ─────────
  │                              │                          │
  ├─ Voice detected ─────────────→ INSERT distress_signal  │
  │                              │                          │
  │                              ├─ Realtime event ────────→ Map updates
  │                              │  (CDC trigger)           │
  │                              │                          ├─ Marker pulsing
  │ Offline queue ────────────────→ (waits for retry)      │
  │                              │                          │
  │                              ├─ Dashboard listens ─────→ New signal added
  │                              │  via Supabase subscription  │
  │                              │                          │
  │                              ├─ Voice alert triggered →  Voice: "Critical
  │                              │                           signal!"
  │                              │
  │ User sees: Confirmed ────────→ Status: "waiting"
  │                              │
  │                              │
  │ (Dashboard updates status)
  │                          ←──── UPDATE status="in-progress"
  │                              │
  │                              ├─ Real-time sync ────────→ All dashboards
  │                              │  update instantly
  │
  │                          ←──── UPDATE status="resolved"
  │                              │
  │ User sees: Resolved ────────→ Signal marked as done
  │                              │
```

---

## Projects

### 1. User App (Citizen SOS)

**Location**: `Source Code/agap/user-app/`

**Purpose**: Mobile-first emergency SOS application for citizens

**Key Technologies**:

- Next.js 15 (React 18)
- TypeScript
- Tailwind CSS v3
- Web Speech API (browser-native voice recognition)
- Geolocation API (GPS)
- Supabase (offline state + publishing)

**Main Screens**:

1. **Idle** — SOS button + stats (people, priority, GPS status)
2. **Listening** — Real-time transcript + keywords + priority display
3. **Confirmed** — Summary of sent request with keywords detected
4. **Offline Queued** — Request waiting to be sent when online

**Key Files**:

- `src/app/rescue/RescuePage.tsx` — Main emergency flow
- `src/hooks/useAgoraVoiceClient.ts` — Voice recognition (Web Speech API)
- `src/hooks/useGeolocation.ts` — Location tracking
- `src/lib/intentDetect.ts` — Keyword + priority detection
- `src/lib/rescueStore.ts` — Request publishing to Supabase

[→ Full README](./Source%20Code/agap/user-app/README.md)

### 2. Rescuer Dashboard (Command Center)

**Location**: `Source Code/agap/rescuer-dashboard/`

**Purpose**: Real-time command center for emergency responders

**Key Technologies**:

- React 18
- Vite
- Leaflet + react-leaflet (mapping)
- Supabase (real-time subscriptions & CDC)
- Tailwind CSS v3
- Chart.js (analytics)

**Main Screens**:

1. **Dashboard** — Live map + triage sidebar + status updater
2. **Analytics** — Signal trends, severity distribution charts
3. **Login** — Supabase auth

**Key Features**:

- **Live Map**: Leaflet map with pulsing markers for each distress signal
- **Triage Sidebar**: List of signals ordered by recency, color-coded by severity
- **Signal Modal**: Click a signal to see full details, update status
- **Voice Alerts**: Critical signals announced via Web Speech Synthesis
- **Real-time Sync**: All connected dashboards update instantly via Supabase CDC

**Key Files**:

- `src/pages/Dashboard.tsx` — Map + sidebar
- `src/components/Map.tsx` — Leaflet implementation
- `src/components/Sidebar.tsx` — Triage feed
- `src/components/SignalDetailsModal.tsx` — Detail modal + status updater
- `src/utils/VoiceAlertSystem.ts` — Web Speech Synthesis wrapper
- `src/supabase/client.ts` — Supabase real-time subscriptions

[→ Full README](./Source%20Code/agap/rescuer-dashboard/README.md)

---

## Tech Stack

### Frontend

| Layer                   | Technology              | Why                                         |
| ----------------------- | ----------------------- | ------------------------------------------- |
| **User App Framework**  | Next.js 15              | Server-side rendering, PWA, offline support |
| **Dashboard Framework** | React 18 + Vite         | Fast dev server, lightweight, real-time     |
| **Language**            | TypeScript              | Type safety, better DX                      |
| **Styling**             | Tailwind CSS v3         | Utility-first, consistent design            |
| **Icons**               | lucide-react            | Modern, lightweight icon library            |
| **UI Components**       | @headlessui/react       | Accessible, unstyled components             |
| **Voice**               | Web Speech API          | Browser-native, no external deps            |
| **Maps**                | Leaflet + react-leaflet | Lightweight, fast OSM maps                  |

### Backend & Database

| Layer              | Technology            | Why                                          |
| ------------------ | --------------------- | -------------------------------------------- |
| **Database**       | Supabase (PostgreSQL) | Real-time CDC, full-text search, open source |
| **Real-time Sync** | Supabase Realtime     | Instant updates across apps                  |
| **Auth**           | Supabase Auth         | Passwordless, secure                         |

### Utilities

| Purpose             | Library                    |
| ------------------- | -------------------------- |
| **Charts**          | Chart.js + react-chartjs-2 |
| **Toasts**          | sonner                     |
| **Date Formatting** | date-fns                   |
| **Linting**         | ESLint                     |

---

## Repository Structure

```
BulldogNiDonSeverino/
├── README.md                          # This file
├── Deck & Demo/                       # Presentation materials, videos
│   ├── AGAP_Logo.png
│   ├── product_demo.mp4
│   └── ...
├── TRAE_Usage/                        # Documentation
└── Source Code/
    └── agap/
        ├── README.md                  # Project overview
        ├── rescuer-dashboard/         # Responder command center
        │   ├── package.json
        │   ├── src/
        │   │   ├── pages/
        │   │   │   ├── Dashboard.tsx      # Main map + sidebar
        │   │   │   ├── Analytics.tsx      # Charts & trends
        │   │   │   ├── Login.tsx          # Supabase auth
        │   │   │   └── Home.tsx           # Redirect
        │   │   ├── components/
        │   │   │   ├── Map.tsx            # Leaflet map
        │   │   │   ├── Sidebar.tsx        # Triage feed
        │   │   │   ├── SignalDetailsModal.tsx
        │   │   │   └── Empty.tsx
        │   │   ├── hooks/
        │   │   │   └── useTheme.ts       # Dark/light mode
        │   │   ├── supabase/
        │   │   │   └── client.ts        # Supabase client
        │   │   ├── types/
        │   │   │   └── index.ts         # Interfaces
        │   │   ├── utils/
        │   │   │   └── VoiceAlertSystem.ts
        │   │   └── App.tsx
        │   ├── supabase/
        │   │   └── migrations/          # DB schema
        │   └── README.md
        │
        └── user-app/                  # Citizen SOS app
            ├── package.json
            ├── next.config.ts
            ├── src/
            │   ├── app/
            │   │   ├── page.tsx         # Home
            │   │   ├── layout.tsx       # App shell
            │   │   └── rescue/
            │   │       ├── RescuePage.tsx    # Main flow
            │   │       └── page.tsx
            │   ├── components/
            │   │   ├── StatusBar.tsx        # Phone status bar
            │   │   ├── PhoneNavBar.tsx      # Phone nav
            │   │   ├── PixelSOSButton.tsx   # SOS button
            │   │   ├── SiriWave.tsx         # Voice animation
            │   │   ├── VoiceChannel.tsx     # Voice logic
            │   │   └── ui/                  # Headless UI
            │   ├── hooks/
            │   │   ├── useAgoraVoiceClient.ts # Web Speech API
            │   │   ├── useGeolocation.ts      # GPS tracking
            │   │   ├── useOnlineStatus.ts     # Network status
            │   │   ├── usePWAInstall.ts       # PWA prompt
            │   │   └── useTriageAgent.ts      # Triage state machine
            │   ├── lib/
            │   │   ├── intentDetect.ts   # Keyword extraction
            │   │   ├── rescueStore.ts    # State + publishing
            │   │   └── utils.ts
            │   ├── types/
            │   │   ├── rescue.ts         # RescueRequest interface
            │   │   └── global.d.ts
            │   └── public/
            │       ├── manifest.json     # PWA manifest
            │       ├── sw.js             # Service worker
            │       └── icons/
            └── README.md
```

---

## Database Schema

### Core Table: `distress_signals`

```sql
CREATE TABLE distress_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,                    -- Link to user
  transcript text NOT NULL,                 -- Full voice transcript
  keywords text[] DEFAULT ARRAY[]::text[],  -- Extracted keywords
  priority integer DEFAULT 0,               -- 0-5 score
  lat decimal(10, 6),                       -- Latitude
  lng decimal(10, 6),                       -- Longitude
  people_count integer DEFAULT 1,           -- How many people need help
  status text DEFAULT 'waiting',            -- waiting | in-progress | resolved
  area text,                                -- Region (e.g., "Manila")
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX ON distress_signals(status);
CREATE INDEX ON distress_signals(priority DESC);
CREATE INDEX ON distress_signals(created_at DESC);
```

### Row-Level Security (RLS)

- **Users**: Can read their own signals + all published signals
- **Read**: Anyone can see all distress signals (responders need visibility)
- **Update**: Only responders update signal status (handled via Supabase auth)

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- Git
- Supabase project (free tier available)

### Installation

#### 1. Clone & Setup

```bash
git clone https://github.com/kuwarte/BulldogNiDonSeverino.git
cd BulldogNiDonSeverino
```

#### 2. User App (Citizen SOS)

```bash
cd "Source Code/agap/user-app"
pnpm install

# Create .env.local
cp template/.env.local .env.local
# Edit .env.local with your Supabase credentials

# Run dev server
pnpm dev
```

**Access**: http://localhost:3000

#### 3. Rescuer Dashboard

```bash
cd "Source Code/agap/rescuer-dashboard"
npm install

# Create .env
echo "VITE_SUPABASE_URL=your-project-url" > .env
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env

# Run dev server
npm run dev
```

**Access**: http://localhost:5173

#### 4. Supabase Setup

1. Create a free Supabase project at https://supabase.com
2. Run migrations:
   ```bash
   supabase migration up
   ```
3. Get your project URL & anon key from Supabase dashboard
4. Add to both `.env` files

### Testing

1. **User App**:
   - Click SOS button
   - Speak: "Water is rising, help me!"
   - See confirmation screen with detected keywords and priority

2. **Rescuer Dashboard**:
   - Open in another browser tab
   - See distress signal appear on map instantly
   - Click signal to see details
   - Update status → both apps sync in real-time

---

## Development Guide

### Voice Recognition

The User App uses **Web Speech API** (browser-native):

```typescript
// Web Speech API automatically:
// 1. Captures user voice continuously
// 2. Returns interim transcripts as user speaks
// 3. Finalizes transcript when silence detected (2+ seconds)
// 4. Calls intentDetect() on final transcript
```

**Browser Support**: Chrome/Edge (best), Firefox (limited)

### Real-time Sync

The Dashboard & User App stay in sync via **Supabase Realtime**:

```typescript
// Dashboard subscribes to all signal changes
supabase
  .from("distress_signals")
  .on("*", (payload) => {
    // Update map, sidebar, etc.
  })
  .subscribe();
```

### Priority Scoring

Keywords are scored in `src/lib/intentDetect.ts`:

```typescript
{
  "water": 5,       // Critical for flood rescue
  "rising": 4,
  "help": 3,
  "injured": 5,
  "fire": 5,
  ...
}

// Final score = average of matched keywords
// User message "water is rising" → [5, 4] → avg = 4.5 ≈ 4/5
```

### Offline Queue

User App queues requests locally using localStorage:

1. Request created → added to `rescueQueue`
2. User goes offline → request doesn't publish yet
3. User comes back online → auto-retry (in practice, use service worker)

---

## Future Enhancements

- [ ] SMS/USSD fallback for feature phones
- [ ] Multi-language support (Tagalog, Cebuano, etc.)
- [ ] Video streaming from user to responder
- [ ] Emergency contact notifications
- [ ] Evacuation route suggestions
- [ ] Resource availability (ambulances, boats, etc.)
- [ ] Integration with official PHC/NDRRMC systems
- [ ] Machine learning for better priority prediction

---
