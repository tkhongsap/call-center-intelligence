# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Call Center Intelligence Control Tower - A Next.js prototype for a "world-class" call center dashboard with a social-media style live feed, trending topics, smart alerts, semantic search, and management sharing/escalation workflows. This is a **prototype with mock data** (SQLite, ~2k seeded cases).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with seed data
- **Styling**: Tailwind CSS
- **Real-time**: Polling (10-20s) or SSE
- **Language**: TypeScript (strict mode)

## Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run typecheck        # Run TypeScript type checking
npm run lint             # Run ESLint
npm test                 # Run tests

# Ralph flowchart (visualization)
cd ralph/flowchart && npm run dev   # Start flowchart dev server
cd ralph/flowchart && npm run build # Build flowchart
```

## Architecture

### Planned Routes (from PRD)

| Route | Purpose |
|-------|---------|
| `/home` | Live Feed + Pulse sidebar + Search + Chat drawer |
| `/alerts` | Alert list with filters and drilldown |
| `/cases` | Case list with filters and export |
| `/cases/:id` | Case detail with timeline and share/escalate |
| `/uploads` | Upload interface with history and errors |
| `/inbox` | Received shares and escalations |
| `/search` | Semantic search results |

### Key Data Models

- **Case**: Customer service case with BU, channel, category, severity, riskFlag, needsReviewFlag
- **Alert**: Spike/threshold/urgency alerts with baseline vs current values
- **Share**: Internal sharing records with recipients, message, status
- **Event**: Real-time events (NEW_CASE, NEW_UPLOAD, NEW_ALERT, ESCALATION)

### Feed Card Types

1. **Alert Card** - Spike, threshold, urgency alerts
2. **Trending Card** - Rising topics with sample cases
3. **Highlight Card** - Daily summaries (top themes, hot BU)
4. **Upload Card** - New batch upload notifications

## Ralph Autonomous Development Loop

This project includes Ralph, an autonomous AI agent loop for implementing PRD stories. Key files:

| File | Purpose |
|------|---------|
| `ralph/ralph.sh` | Bash loop that spawns fresh AI agent instances |
| `ralph/prompt.md` | Instructions for Amp-based execution |
| `ralph/prompt-cursor.md` | Instructions for Cursor-based execution |
| `ralph/prd.json` | User stories with `passes` status |
| `ralph/progress.txt` | Append-only learnings for future iterations |
| `.cursor/rules/ralph-loop.mdc` | Cursor rule for Ralph commands |

### Running Ralph

```bash
# With Amp (default)
./ralph/ralph.sh [max_iterations]

# With Cursor - use these trigger phrases:
# "run ralph", "start ralph", "ralph loop"
```

### Ralph Workflow

1. Create PRD using the `/prd` skill
2. Convert to `prd.json` using the `/ralph` skill
3. Run `ralph.sh` - each iteration:
   - Picks highest priority story with `passes: false`
   - Implements ONE story
   - Runs quality checks (typecheck, lint, test)
   - Commits if passing: `feat: [Story ID] - [Story Title]`
   - Updates `prd.json` to mark story done
   - Appends learnings to `progress.txt`

### Critical Ralph Patterns

- Each iteration = fresh context window (memory persists via git, progress.txt, prd.json)
- Stories must be small enough to complete in one context window
- Update AGENTS.md with reusable patterns discovered
- Frontend stories require browser verification before completion
- Stop when ALL stories have `passes: true`

## AI Dev Tasks Workflow

The `ai-dev-tasks/` directory contains structured prompts for AI-assisted development:

1. **create-prd.md** - Generate a Product Requirements Document
2. **generate-tasks.md** - Convert PRD to detailed task list

## User Roles (via Role Switcher)

1. **PM/PO (Admin)** - Full access to all BUs, channels, configuration
2. **BU Manager** - BU-scoped view with escalation capabilities
3. **Call Center Supervisor** - Operational view for spikes, urgent cases, queue health

## Code Quality Standards

- TypeScript strict mode required
- Typecheck must pass before commits
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Keep components small and focused
- Follow existing code patterns
