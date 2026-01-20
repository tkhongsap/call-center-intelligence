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
- [ ] Add SearchBar component to header/layout
- [ ] Implement search input with icon
- [ ] Add keyboard shortcut (Cmd/Ctrl + K)
- [ ] Show recent searches dropdown
- [ ] Add clear button

### 6.2 Implement Query Parser
- [ ] Create `lib/search.ts`
- [ ] Parse natural language queries to extract:
  - Keywords/phrases
  - Time references ("last week", "today", "past 30 days")
  - BU mentions
  - Channel mentions
  - Severity indicators ("urgent", "critical")
  - Category references
- [ ] Map parsed entities to filter parameters

### 6.3 Build Search Logic
- [ ] Implement full-text search on case fields:
  - summary
  - description
  - category
  - subcategory
- [ ] Add keyword matching with relevance scoring
- [ ] Apply parsed filters automatically
- [ ] Sort results by relevance score

### 6.4 Create Search Results Page
- [ ] Create `/search` route
- [ ] Display query in search bar
- [ ] Show result count
- [ ] Display suggested filters based on query
- [ ] List matching cases with relevance ranking
- [ ] Highlight matching terms in results
- [ ] Add "No results" state with suggestions

### 6.5 Implement Suggested Filters
- [ ] Create SuggestedFilters component
- [ ] Display inferred filters as chips:
  - "BU: Food" (from query mention)
  - "Date: Last 7 days" (from "last week")
  - "Severity: High" (from "urgent")
- [ ] Allow user to remove/modify suggestions
- [ ] Show "Apply all" button

### 6.6 Add Search Result Cards
- [ ] Create SearchResultCard component
- [ ] Display: case number, date, BU, channel
- [ ] Show summary with highlighted matches
- [ ] Show relevance score indicator
- [ ] Add badges (Urgent, Needs Review)
- [ ] Link to case detail

### 6.7 Optimize Search Performance
- [ ] Add database indexes for searchable fields
- [ ] Implement search caching (optional)
- [ ] Ensure < 2 second response time
- [ ] Add loading state during search

### 6.8 Create Search API
- [ ] `GET /api/search?q=...` - Main search endpoint
  - Accept raw query string
  - Return parsed filters + results
  - Include relevance scores
- [ ] Add pagination support
- [ ] Return suggested filters in response

### 6.9 Add Search Analytics (Optional)
- [ ] Track popular search queries
- [ ] Show "Popular searches" in empty state
- [ ] Log search performance metrics

## Acceptance Criteria
- [ ] Search bar visible on all pages
- [ ] Natural language queries are parsed correctly
- [ ] "urgent refund cases last week" returns relevant results
- [ ] Suggested filters appear based on query
- [ ] Results show relevance ranking
- [ ] Search completes in < 2 seconds
- [ ] Keyboard shortcut (Cmd+K) opens search

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
