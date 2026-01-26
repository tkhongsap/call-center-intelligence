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
- [x] Create `/home` route (or update root `/`)
- [x] Implement two-column layout:
  - Main area: Today Feed (70%)
  - Right sidebar: Pulse (30%)
- [x] Add responsive breakpoints

### 4.2 Build Feed Container
- [x] Create FeedContainer component
- [x] Implement feed item fetching
- [x] Add infinite scroll or pagination
- [x] Sort by priority and recency
- [x] Handle empty state

### 4.3 Create Feed Card Components

#### Alert Card
- [x] Reuse/extend AlertCard from Task 03
- [x] Add feed-specific styling
- [x] Icon: Bell/Warning based on type
- [x] Color-code header by severity

#### Trending Card
- [x] Create TrendingCard component
- [x] Header: Fire icon + "Trending"
- [x] Title: Topic name + trend direction arrow
- [x] Body: Top 3 phrases, case count
- [x] Sample case preview (1-2 lines)
- [x] Footer: [View cases] [Share] buttons

#### Highlight Card
- [x] Create HighlightCard component
- [x] Header: Pin icon + "Today's Highlight"
- [x] Body: Summary content
  - "Top 3 complaint themes today"
  - "Hot BU: [BU Name] - [reason]"
  - "Resolution rate improved by X%"
- [x] Footer: [Learn more] button

#### Upload Card
- [x] Create UploadCard component
- [x] Header: Upload icon + timestamp
- [x] Body: "Upload batch added X new cases"
- [x] Footer: [View cases] button

### 4.4 Build Feed Item Actions
- [x] Create FeedCardActions component
- [x] [View cases] - navigates to filtered case list
- [x] [Share] - opens share modal
- [x] [Escalate] - opens escalation confirmation
- [x] Handle action completion feedback

### 4.5 Implement Click Navigation
- [x] Alert card -> `/alerts/[id]`
- [x] Trending card -> `/cases?topic=[topic]`
- [x] Highlight card -> relevant drilldown
- [x] Upload card -> `/cases?uploadBatch=[id]`

### 4.6 Build Pulse Sidebar

#### KPI Tiles
- [x] Create KPITile component
- [x] Display tiles:
  - Total Cases Today
  - Open Cases
  - Critical/Urgent Count
  - Resolution Rate
- [x] Color-code by status (green/yellow/red)

#### Sparklines
- [x] Create Sparkline component (simple line chart)
- [x] Show 7-day trend for key metrics
- [x] Indicate up/down direction

#### Word Cloud
- [x] Create WordCloud component
- [x] Display top 15 terms from recent cases
- [x] Size words by frequency
- [x] Make words clickable (filter feed)

#### Quick Filters
- [x] Create QuickFilters component
- [x] Add BU filter dropdown
- [x] Add Channel filter
- [x] Add Date range (Today, 7d, 30d)
- [x] Sync filters to feed and URL

### 4.7 Implement Feed Filtering
- [x] Filter feed items by BU
- [x] Filter feed items by date range
- [x] Filter feed items by type (alerts/trending/highlights)
- [x] Update feed without page reload
- [x] Sync filters to URL query params

### 4.8 Create API Routes
- [x] `GET /api/feed` - Get feed items with filters
- [x] `GET /api/pulse` - Get KPI data for sidebar
- [x] `GET /api/pulse/wordcloud` - Get word cloud data

## Acceptance Criteria
- [x] Home page shows Today Feed with mixed card types
- [x] At least 2 alert cards appear in feed
- [x] At least 2 trending cards appear in feed
- [x] Highlight cards show meaningful summaries
- [x] Pulse sidebar displays all KPIs
- [x] Quick filters update feed instantly
- [x] Clicking cards navigates to correct drilldown
- [x] Feed is deterministic with seed data

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
