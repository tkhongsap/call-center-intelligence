# Task 01: Project Setup

## Overview
Initialize the Next.js project with SQLite database, schema design, and seed data. This is the foundation that all other modules depend on.

## Priority
**1** (First - all other modules depend on this)

## Dependencies
None - this is the foundation

## Functional Requirements Covered
- Foundation setup (Next.js, database, schema, seed data)
- Supports all FRs by providing infrastructure

## Tasks

### 1.1 Initialize Next.js Project
- [x] Create Next.js 14+ project with App Router
- [x] Configure TypeScript with strict mode
- [x] Set up Tailwind CSS
- [x] Configure ESLint and Prettier
- [x] Create folder structure: `app/`, `components/`, `lib/`, `types/`

### 1.2 Set Up SQLite Database
- [x] Install better-sqlite3 or Drizzle ORM with SQLite
- [x] Create database connection utility in `lib/db.ts`
- [x] Configure database path (development vs test)

### 1.3 Design Database Schema
- [x] Create `cases` table:
  - id, caseNumber, createdAt, channel, bu, category, subcategory
  - severity, status, summary, description
  - riskFlag, needsReviewFlag, customerSentiment
- [x] Create `alerts` table:
  - id, type (spike/threshold/urgency/misclassification)
  - title, description, severity, status
  - baselineValue, currentValue, timeWindow
  - createdAt, resolvedAt
- [x] Create `trending_topics` table:
  - id, topic, trendScore, previousCount, currentCount
  - timeWindow, status, createdAt
- [x] Create `feed_items` table:
  - id, type (alert/trending/highlight/upload)
  - title, content, metadata (JSON)
  - createdAt, priority
- [x] Create `shares` table:
  - id, itemType, itemId, fromUser, toUser
  - note, createdAt
- [x] Create `users` table (mock directory):
  - id, name, email, role, bu

### 1.4 Create Seed Data Script
- [x] Generate ~2,000 cases across 15 BUs and 4 channels
- [x] Ensure data contains:
  - At least 2 spike scenarios (65%+ increase)
  - At least 3 trending topics
  - Cases with riskFlag=true (urgent)
  - Cases with needsReviewFlag=true
  - Variety of categories and severities
- [x] Create deterministic seed (same results each run)
- [x] Add `npm run seed` script

### 1.5 Create Base Layout
- [x] Create app layout with header
- [x] Add placeholder for search bar
- [x] Add placeholder for role switcher
- [x] Add placeholder for inbox badge
- [x] Create responsive container

### 1.6 Configure Demo Mode
- [x] Add environment variable for demo mode toggle
- [x] Create demo mode context/provider
- [x] Ensure deterministic behavior when demo mode enabled

## Acceptance Criteria
- [x] `npm run dev` starts the application
- [x] `npm run seed` populates database with ~2k cases
- [x] Database queries return expected data
- [x] Base layout renders with placeholders
- [x] TypeScript compilation passes with no errors

## Estimated Complexity
Medium-High (foundation setup with schema design)

## Files to Create
```
app/
  layout.tsx
  page.tsx
  globals.css
components/
  layout/
    Header.tsx
    Container.tsx
lib/
  db.ts
  seed.ts
types/
  index.ts
scripts/
  seed.ts
drizzle/ (or prisma/)
  schema.ts
```
