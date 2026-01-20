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
- [ ] Create Next.js 14+ project with App Router
- [ ] Configure TypeScript with strict mode
- [ ] Set up Tailwind CSS
- [ ] Configure ESLint and Prettier
- [ ] Create folder structure: `app/`, `components/`, `lib/`, `types/`

### 1.2 Set Up SQLite Database
- [ ] Install better-sqlite3 or Drizzle ORM with SQLite
- [ ] Create database connection utility in `lib/db.ts`
- [ ] Configure database path (development vs test)

### 1.3 Design Database Schema
- [ ] Create `cases` table:
  - id, caseNumber, createdAt, channel, bu, category, subcategory
  - severity, status, summary, description
  - riskFlag, needsReviewFlag, customerSentiment
- [ ] Create `alerts` table:
  - id, type (spike/threshold/urgency/misclassification)
  - title, description, severity, status
  - baselineValue, currentValue, timeWindow
  - createdAt, resolvedAt
- [ ] Create `trending_topics` table:
  - id, topic, trendScore, previousCount, currentCount
  - timeWindow, status, createdAt
- [ ] Create `feed_items` table:
  - id, type (alert/trending/highlight/upload)
  - title, content, metadata (JSON)
  - createdAt, priority
- [ ] Create `shares` table:
  - id, itemType, itemId, fromUser, toUser
  - note, createdAt
- [ ] Create `users` table (mock directory):
  - id, name, email, role, bu

### 1.4 Create Seed Data Script
- [ ] Generate ~2,000 cases across 15 BUs and 4 channels
- [ ] Ensure data contains:
  - At least 2 spike scenarios (65%+ increase)
  - At least 3 trending topics
  - Cases with riskFlag=true (urgent)
  - Cases with needsReviewFlag=true
  - Variety of categories and severities
- [ ] Create deterministic seed (same results each run)
- [ ] Add `npm run seed` script

### 1.5 Create Base Layout
- [ ] Create app layout with header
- [ ] Add placeholder for search bar
- [ ] Add placeholder for role switcher
- [ ] Add placeholder for inbox badge
- [ ] Create responsive container

### 1.6 Configure Demo Mode
- [ ] Add environment variable for demo mode toggle
- [ ] Create demo mode context/provider
- [ ] Ensure deterministic behavior when demo mode enabled

## Acceptance Criteria
- [ ] `npm run dev` starts the application
- [ ] `npm run seed` populates database with ~2k cases
- [ ] Database queries return expected data
- [ ] Base layout renders with placeholders
- [ ] TypeScript compilation passes with no errors

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
