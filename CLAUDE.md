# Gameflix — Project Instructions

## Overview
Gameflix is a subscription-based web platform for casual/puzzle/logic/quiz browser games with community features, gamification, and scheduled content releases. "La tua palestra mentale quotidiana."

## Architecture
- **Frontend**: Next.js 14+ (App Router) with Tailwind CSS, Zustand, TanStack Query
- **Backend**: NestJS with Prisma ORM, JWT auth, event-driven gamification
- **Database**: PostgreSQL (local, port 5432, user: postgres, db: gameflix)
- **Games**: Standalone Vite/TypeScript apps in `games/` directory, integrated via iframe

## Project Structure
```
gameflix/
├── frontend/          # Next.js app (port 3000)
├── backend/           # NestJS API (port 4000, prefix /api)
├── games/             # Game modules (each is standalone Vite project)
│   ├── registry.json  # Game registry
│   └── graviton/      # First game - gravity puzzle (BrainLab)
└── docs/              # Product design documents and blueprints
```

## Quick Start
```bash
# Backend
cd backend && npm run start:dev     # http://localhost:4000

# Frontend
cd frontend && npm run dev          # http://localhost:3000

# Game (standalone)
cd games/graviton && npm run dev    # http://localhost:5173
```

## Database
- Prisma schema: `backend/prisma/schema.prisma`
- Migrations: `cd backend && npx prisma migrate dev`
- Seed: `cd backend && npx prisma db seed`
- Studio: `cd backend && npx prisma studio`
- Seed creates: admin@gameflix.com / password123

## API Endpoints (prefix: /api)
- Auth: POST /auth/register, /auth/login, /auth/refresh
- Users: GET /users/me, GET /users/:id, PATCH /users/me
- Games: GET /games, GET /games/:slug, GET /games/category/:slug
- Categories: GET /categories
- Scores: POST /scores, GET /scores/leaderboard/:slug
- Gamification: GET /gamification/progress
- Likes: POST/DELETE /likes/:slug, GET /likes/:slug/status
- Releases: GET /releases/upcoming, GET /releases/recent
- Admin: GET /admin/dashboard, CRUD /admin/games, POST /admin/releases

## Key Design Decisions
- Games are standalone Vite apps loaded via iframe in the player page
- Each game has a `gameflix.manifest.json` with standard metadata
- Gamification is event-driven: ScoreSubmitted triggers XP, streak, badge checks
- Leaderboards support daily/weekly/alltime periods
- Auth uses JWT with 15min access tokens and 7-day refresh tokens
- All user-facing text is in Italian

## Game Development Rules — IMPORTANT
- **Mobile-first**: ALL games MUST be playable on both desktop and mobile (touch + mouse)
- Games that cannot work on mobile are the exception, not the rule — and must be explicitly marked as desktop-only
- Touch interactions must be tested: drag, tap, pinch where applicable
- Canvas games must handle responsive scaling (fit to viewport)
- Each game's `gameflix.manifest.json` must declare `"mobile": true/false` in features
- The game card in Explore shows platform icons (desktop/mobile) so users know before clicking

## Conventions
- Backend modules follow NestJS patterns: module, controller, service, DTOs
- Frontend uses App Router with (platform) route group for authenticated pages
- Tailwind dark theme with `gameflix-*` color tokens
- Component structure: ui/, game/, gamification/, leaderboard/, layout/

## Content Model
- 5 Worlds (Mondi): BrainLab, WordForge, Mysterium, TinkerFarm (active), QuizArena (coming soon)
- Games belong to a category (world)
- Difficulty tiers: Chill (1-2), Sharp (3), Brutal (4-5)
- XP system: 30 levels, 5 titles (Novizio → Leggenda)
- Streak: daily play tracking with freeze for premium users
