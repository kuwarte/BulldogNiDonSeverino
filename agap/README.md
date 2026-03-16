# AgAp — Emergency Response System

AgAp (Agora + Agap, Filipino for "to rescue") is a two-part disaster response platform built for the Philippines. It connects citizens in distress with emergency responders in real time.

## Repository Structure

```
agap/
├── Agap/           # Responder Command Center (React + Vite + Supabase)
└── pwa-frontend/   # Citizen SOS App (Next.js PWA)
```

## How It Works

```
Citizen (pwa-frontend)          Responder (Agap)
       │                               │
  Taps SOS / speaks             Watches live map
       │                               │
  Voice → intent detection      Supabase realtime
       │                               │
  RescueRequest published  ──►  Distress signal appears
       │                               │
  Confirmation screen          Triage sidebar + modal
                                Status updated → resolved
```

## Projects

| Project | Stack | Purpose |
|---|---|---|
| `Agap/` | React 18, Vite, Leaflet, Supabase, Tailwind | Responder dashboard with live map and triage feed |
| `pwa-frontend/` | Next.js 16, React 19, Tailwind v4 | Offline-capable PWA for citizens to send SOS |

## Database (Supabase)

Shared Supabase project. See [`Agap/supabase/migrations/`](Agap/supabase/migrations/) for the full schema.

Key table: `distress_signals` — stores every rescue request with GPS coordinates, severity, status, voice transcript, and people count.

## Getting Started

```bash
# Command Center
cd Agap && npm install && npm run dev

# Citizen PWA
cd pwa-frontend && pnpm install && pnpm dev
```
