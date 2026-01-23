# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Call Center Intelligence Control Tower - A Next.js prototype for a call center dashboard with a social-media style live feed, trending topics, smart alerts, semantic search, and management sharing/escalation workflows. This is a **prototype with mock data** (SQLite, ~2k seeded cases).

## Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm run typecheck        # Run TypeScript type checking
npm run lint             # Run ESLint

# Database
npm run db:seed          # Seed database with mock data
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio for database inspection
npm run compute-alerts   # Run alert computation script

# Ralph flowchart (documentation visualization)
cd ralph/flowchart && npm run dev   # Start flowchart dev server
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router) with React 19
- **Database**: SQLite with Drizzle ORM (`lib/db/schema.ts`)
- **Styling**: Tailwind CSS v4
- **i18n**: next-intl with English and Thai locales (`messages/en.json`, `messages/th.json`)
- **Real-time**: SSE or polling (configurable via `contexts/RealtimeContext.tsx`)

### Route Structure

All pages use locale prefix (`/[locale]/...`):

| Route | Purpose |
|-------|---------|
| `/home` | Live Feed + Pulse sidebar + Search + Chat drawer |
| `/alerts` | Alert list with filters and drilldown |
| `/alerts/:id` | Alert detail page |
| `/cases` | Case list with filters and export |
| `/cases/:id` | Case detail with timeline and share/escalate |
| `/uploads` | Upload interface with history and errors |
| `/inbox` | Received shares and escalations |
| `/search` | Semantic search results |
| `/trending` | Trending topics analysis |

### Key Directories

```
app/
├── [locale]/           # Locale-prefixed pages (en, th)
├── api/                # API routes (REST endpoints)
components/
├── feed/               # Live feed cards (Alert, Trending, Highlight, Upload)
├── pulse/              # Real-time sidebar (KPI tiles, sparklines, word cloud)
├── chat/               # Chat assistant drawer
├── cases/              # Case list and detail components
├── alerts/             # Alert components
contexts/
├── FilterContext.tsx   # Global filter state (from chat/UI)
├── DemoModeContext.tsx # Demo mode toggle (deterministic timestamps)
├── RealtimeContext.tsx # SSE vs polling mode
lib/
├── db/                 # Database schema and connection
├── chatIntents.ts      # Chat command parsing
├── chatResponses.ts    # Chat response generation
```

### Database Schema (`lib/db/schema.ts`)

Core tables: `users`, `cases`, `alerts`, `trendingTopics`, `feedItems`, `shares`, `uploads`, `searchAnalytics`

- Database file: `data/call-center.db`
- Types are exported from schema (e.g., `Case`, `Alert`, `NewCase`)

### Context Providers

The app wraps pages with three providers (in `app/[locale]/layout.tsx`):
1. **FilterProvider** - Global filter state applied via chat or UI
2. **DemoModeProvider** - Toggles deterministic timestamps for demos
3. **RealtimeProvider** - Controls SSE vs polling mode

### User Roles

1. **PM/PO (Admin)** - Full access to all BUs, channels, configuration
2. **BU Manager** - BU-scoped view with escalation capabilities
3. **Call Center Supervisor** - Operational view for spikes, urgent cases

## Ralph Autonomous Development Loop

Ralph is an autonomous AI agent loop for implementing PRD stories.

| File | Purpose |
|------|---------|
| `ralph/ralph.sh` | Bash loop that spawns fresh AI agent instances |
| `ralph/prd.json` | User stories with `passes` status |
| `ralph/progress.txt` | Append-only learnings for future iterations |

### Running Ralph

```bash
./ralph/ralph.sh [max_iterations]
```

### Ralph Workflow
1. Picks highest priority story with `passes: false`
2. Implements ONE story per iteration
3. Runs quality checks (typecheck, lint)
4. Commits if passing: `feat: [Story ID] - [Story Title]`
5. Updates `prd.json` to mark story done
6. Appends learnings to `progress.txt`

## Code Quality Standards

- TypeScript strict mode required
- Typecheck must pass before commits
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Keep components small and focused
