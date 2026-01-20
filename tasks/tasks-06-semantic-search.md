# Task 06: Semantic Search

## Overview
Implement the global search bar with natural language query support, relevance ranking, and suggested filters.

## Priority
**6** (Core feature for finding specific cases)

## Dependencies
- Task 01: Project Setup (database)
- Task 02: Cases Module (case list display)

## Functional Requirements Covered
- **FR16**: Global search bar visible on all pages
- **FR17**: Accept natural language queries ("urgent refund cases last week", "delivery delay trend in Food BU")
- **FR18**: Search results include matching cases with relevance ranking
- **FR19**: Display suggested/auto-applied filters based on query
- **FR20**: Return results in < 2 seconds for 2k cases

## Tasks

### 6.1 Create Global Search Bar
- [x] Add SearchBar component to header/layout
- [x] Implement search input with icon
- [x] Add keyboard shortcut (Cmd/Ctrl + K)
- [x] Show recent searches dropdown
- [x] Add clear button

### 6.2 Implement Query Parser
- [x] Create `lib/search.ts`
- [x] Parse natural language queries to extract:
  - Keywords/phrases
  - Time references ("last week", "today", "past 30 days")
  - BU mentions
  - Channel mentions
  - Severity indicators ("urgent", "critical")
  - Category references
- [x] Map parsed entities to filter parameters

### 6.3 Build Search Logic
- [x] Implement full-text search on case fields:
  - summary
  - description
  - category
  - subcategory
- [x] Add keyword matching with relevance scoring
- [x] Apply parsed filters automatically
- [x] Sort results by relevance score

### 6.4 Create Search Results Page
- [x] Create `/search` route
- [x] Display query in search bar
- [x] Show result count
- [x] Display suggested filters based on query
- [x] List matching cases with relevance ranking
- [x] Highlight matching terms in results
- [x] Add "No results" state with suggestions

### 6.5 Implement Suggested Filters
- [x] Create SuggestedFilters component
- [x] Display inferred filters as chips:
  - "BU: Food" (from query mention)
  - "Date: Last 7 days" (from "last week")
  - "Severity: High" (from "urgent")
- [x] Allow user to remove/modify suggestions
- [x] Show "Apply all" button

### 6.6 Add Search Result Cards
- [x] Create SearchResultCard component
- [x] Display: case number, date, BU, channel
- [x] Show summary with highlighted matches
- [x] Show relevance score indicator
- [x] Add badges (Urgent, Needs Review)
- [x] Link to case detail

### 6.7 Optimize Search Performance
- [x] Add database indexes for searchable fields
- [x] Implement search caching (optional)
- [x] Ensure < 2 second response time
- [x] Add loading state during search

### 6.8 Create Search API
- [x] `GET /api/search?q=...` - Main search endpoint
  - Accept raw query string
  - Return parsed filters + results
  - Include relevance scores
- [x] Add pagination support
- [x] Return suggested filters in response

### 6.9 Add Search Analytics (Optional)
- [x] Track popular search queries
- [x] Show "Popular searches" in empty state
- [x] Log search performance metrics

## Acceptance Criteria
- [x] Search bar visible on all pages
- [x] Natural language queries are parsed correctly
- [x] "urgent refund cases last week" returns relevant results
- [x] Suggested filters appear based on query
- [x] Results show relevance ranking
- [x] Search completes in < 2 seconds
- [x] Keyboard shortcut (Cmd+K) opens search

## Estimated Complexity
Medium-High

## Files to Create
```
app/
  search/
    page.tsx
components/
  search/
    SearchBar.tsx
    SearchResults.tsx
    SearchResultCard.tsx
    SuggestedFilters.tsx
    RecentSearches.tsx
lib/
  search.ts
  queryParser.ts
app/api/
  search/
    route.ts
```
