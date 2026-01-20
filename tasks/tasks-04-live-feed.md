# Task 04: Live Feed

## Overview
Build the home page with the "Today Feed" showing alerts, trending topics, and highlights in a social-media card format, plus the Pulse sidebar with KPIs and quick filters.

## Priority
**4** (Main landing page - depends on alerts and cases)

## Dependencies
- Task 01: Project Setup (database, layout)
- Task 02: Cases Module (case linking)
- Task 03: Alerts Module (alert cards)

## Functional Requirements Covered
- **FR1**: Display "Today Feed" as home page with alerts, trending, highlights in card format
- **FR2**: Alert cards with title, reason, action buttons
- **FR3**: Trending cards with rising topics, top phrases, sample cases
- **FR4**: Highlight cards with daily summaries (Top 3 themes, Hot BU)
- **FR5**: Upload cards when new case batches are ingested
- **FR6**: Feed updates when filters change without page reload
- **FR7**: Clicking feed item routes to relevant drilldown
- **FR8**: Feed is deterministic with seed data
- **FR9**: Each card includes [View cases] [Share] [Escalate] buttons
- **FR10**: Pulse sidebar with KPI tiles, sparklines, word cloud, quick filters

## Tasks

### 4.1 Create Home Page Layout
- [ ] Create `/home` route (or update root `/`)
- [ ] Implement two-column layout:
  - Main area: Today Feed (70%)
  - Right sidebar: Pulse (30%)
- [ ] Add responsive breakpoints

### 4.2 Build Feed Container
- [ ] Create FeedContainer component
- [ ] Implement feed item fetching
- [ ] Add infinite scroll or pagination
- [ ] Sort by priority and recency
- [ ] Handle empty state

### 4.3 Create Feed Card Components

#### Alert Card
- [ ] Reuse/extend AlertCard from Task 03
- [ ] Add feed-specific styling
- [ ] Icon: Bell/Warning based on type
- [ ] Color-code header by severity

#### Trending Card
- [ ] Create TrendingCard component
- [ ] Header: Fire icon + "Trending"
- [ ] Title: Topic name + trend direction arrow
- [ ] Body: Top 3 phrases, case count
- [ ] Sample case preview (1-2 lines)
- [ ] Footer: [View cases] [Share] buttons

#### Highlight Card
- [ ] Create HighlightCard component
- [ ] Header: Pin icon + "Today's Highlight"
- [ ] Body: Summary content
  - "Top 3 complaint themes today"
  - "Hot BU: [BU Name] - [reason]"
  - "Resolution rate improved by X%"
- [ ] Footer: [Learn more] button

#### Upload Card
- [ ] Create UploadCard component
- [ ] Header: Upload icon + timestamp
- [ ] Body: "Upload batch added X new cases"
- [ ] Footer: [View cases] button

### 4.4 Build Feed Item Actions
- [ ] Create FeedCardActions component
- [ ] [View cases] - navigates to filtered case list
- [ ] [Share] - opens share modal
- [ ] [Escalate] - opens escalation confirmation
- [ ] Handle action completion feedback

### 4.5 Implement Click Navigation
- [ ] Alert card -> `/alerts/[id]`
- [ ] Trending card -> `/cases?topic=[topic]`
- [ ] Highlight card -> relevant drilldown
- [ ] Upload card -> `/cases?uploadBatch=[id]`

### 4.6 Build Pulse Sidebar

#### KPI Tiles
- [ ] Create KPITile component
- [ ] Display tiles:
  - Total Cases Today
  - Open Cases
  - Critical/Urgent Count
  - Resolution Rate
- [ ] Color-code by status (green/yellow/red)

#### Sparklines
- [ ] Create Sparkline component (simple line chart)
- [ ] Show 7-day trend for key metrics
- [ ] Indicate up/down direction

#### Word Cloud
- [ ] Create WordCloud component
- [ ] Display top 15 terms from recent cases
- [ ] Size words by frequency
- [ ] Make words clickable (filter feed)

#### Quick Filters
- [ ] Create QuickFilters component
- [ ] Add BU filter dropdown
- [ ] Add Channel filter
- [ ] Add Date range (Today, 7d, 30d)
- [ ] Sync filters to feed and URL

### 4.7 Implement Feed Filtering
- [ ] Filter feed items by BU
- [ ] Filter feed items by date range
- [ ] Filter feed items by type (alerts/trending/highlights)
- [ ] Update feed without page reload
- [ ] Sync filters to URL query params

### 4.8 Create API Routes
- [ ] `GET /api/feed` - Get feed items with filters
- [ ] `GET /api/pulse` - Get KPI data for sidebar
- [ ] `GET /api/pulse/wordcloud` - Get word cloud data

## Acceptance Criteria
- [ ] Home page shows Today Feed with mixed card types
- [ ] At least 2 alert cards appear in feed
- [ ] At least 2 trending cards appear in feed
- [ ] Highlight cards show meaningful summaries
- [ ] Pulse sidebar displays all KPIs
- [ ] Quick filters update feed instantly
- [ ] Clicking cards navigates to correct drilldown
- [ ] Feed is deterministic with seed data

## Estimated Complexity
High

## Files to Create
```
app/
  (home)/
    page.tsx
components/
  feed/
    FeedContainer.tsx
    FeedCard.tsx
    AlertFeedCard.tsx
    TrendingCard.tsx
    HighlightCard.tsx
    UploadCard.tsx
    FeedCardActions.tsx
  pulse/
    PulseSidebar.tsx
    KPITile.tsx
    Sparkline.tsx
    WordCloud.tsx
    QuickFilters.tsx
app/api/
  feed/
    route.ts
  pulse/
    route.ts
    wordcloud/
      route.ts
```
