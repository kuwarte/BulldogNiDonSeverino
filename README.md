# AGAP: Emergency Response System

Automated, Georeferenced, and Adaptive platform for Predictive flood rescue by analyzing voice distress to pinpoint and report critical emergencies in real-time and it is a two-part disaster response platform built for the Philippines. It connects citizens in distress with emergency responders in real time.

## Repository Structure

```
agap/
├── rescuer-dashboard/           # Responder Command Center (React + Vite + Supabase)
└── user-app/   # Citizen SOS App (Next.js PWA)
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

| Project              | Stack                                       | Purpose                                           |
| -------------------- | ------------------------------------------- | ------------------------------------------------- |
| `rescuer-dashboard/` | React 18, Vite, Leaflet, Supabase, Tailwind | Responder dashboard with live map and triage feed |
| `user-app/`          | Next.js 16, React 19, Tailwind v4           | Offline-capable PWA for citizens to send SOS      |

## Database (Supabase)

Shared Supabase project. See [`Agap/supabase/migrations/`](Agap/supabase/migrations/) for the full schema.

Key table: `distress_signals` — stores every rescue request with GPS coordinates, severity, status, voice transcript, and people count.

## Getting Started

```bash
# Command Center
cd "Source Code/agap/rescuer-dashboard" && npm install && npm run dev

# Citizen PWA
cd "Source Code/agap/user-app" && pnpm install && pnpm dev
```
