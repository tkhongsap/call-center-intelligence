# Search PRD

## Overview

| Field | Value |
|-------|-------|
| **Route** | `/[locale]/search` |
| **Purpose** | Semantic search with natural language queries, auto-suggested filters, and related topics |
| **User Roles** | All roles (PM/PO, BU Manager, Supervisor) |
| **Status** | 90% complete |

---

## Requirements from Original PRD

> From `docs/00-call-center-intelligence.md` Section 5.3

### Core Requirements

**Screen:** Global search bar + `/search`

### What it should do

User types natural language:
- "urgent refund cases last week"
- "delivery delay trend in Food BU"
- "complaints about taste change"
- "show spike this month"

The system returns:
- Matching cases
- Suggested filters applied
- Related topics / categories

### Prototype Approach (from PRD)

**Option A (fastest): Hybrid "semantic-like"**
- Full-text search + synonyms + keyword expansion
- Rule-based query parser (date range, severity, BU, channel)
- Example:
  - "urgent" -> severity High/Critical
  - "refund" -> category/keywords map
  - "last week" -> date range

### Acceptance Criteria (from PRD)
- Search works in < 2 seconds on 2k cases
- Returns relevant results + auto-suggested filters
- At least 10 demo queries prepared with expected outcomes

---

## Implementation Status

| Requirement | Status | Implementation Notes |
|-------------|--------|---------------------|
| Natural language queries | Done | Intent parsing implemented |
| Full-text search | Done | Keyword matching |
| Query parser (date range) | Done | Extracts date expressions |
| Query parser (severity) | Done | Maps "urgent" to High/Critical |
| Query parser (BU/channel) | Done | Extracts BU/channel mentions |
| Matching cases results | Done | Cases table with relevance |
| Suggested filters | Done | Auto-applied filter chips |
| Filter chips removable | Done | Click to remove individual |
| Related topics | **Partial** | Not explicit section, shown in results context |
| Search execution time | Done | Shows "Executed in X ms" |
| Empty state (popular searches) | Done | Shows trending/popular searches |
| Performance < 2 seconds | Done | Typically under 500ms |

---

## Components & APIs

### Components Used
| Component | Path | Purpose |
|-----------|------|---------|
| SearchPage | `app/[locale]/search/page.tsx` | Main search page |
| SearchBar | `components/search/SearchBar.tsx` | Global search input |
| SearchResults | `components/search/SearchResults.tsx` | Results display |
| FilterChips | `components/search/FilterChips.tsx` | Active filter display |
| PopularSearches | `components/search/PopularSearches.tsx` | Empty state suggestions |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/search` | GET | Returns search results with filters |
| `/api/search/analytics` | GET | Returns popular/trending searches |

---

## Acceptance Criteria

### Functional
- [x] Search returns results in < 2 seconds
- [x] Execution time displays ("Executed in X ms")
- [x] Suggested filters appear based on query
- [x] Filters can be removed individually
- [x] Empty state shows popular/trending searches
- [x] Results link to case detail pages
- [x] Query parsing handles date ranges
- [x] Query parsing handles severity keywords
- [x] Query parsing handles BU/channel names
- [ ] Explicit "Related topics" section (enhancement)

### Performance
- [x] Search completes within 2 seconds
- [x] Typical response under 500ms

### Accessibility
- [x] Search input has proper label
- [x] Results are announced to screen readers
- [x] Filter chips are keyboard accessible

---

## Known Gaps & Recommendations

### Current Gaps

1. **Related Topics Not Explicit**
   - Impact: Users don't see topic suggestions
   - Recommendation: Add "Related Topics" section below results
   - Implementation: Query trending topics related to search terms

### Demo Queries (prepared)

| Query | Expected Behavior |
|-------|-------------------|
| "urgent refund cases last week" | High/Critical severity, refund category, last 7 days |
| "delivery delay" | Cases with delivery-related keywords |
| "complaints about taste" | Food/beverage related cases |
| "show spike this month" | Alerts or high-volume periods |
| "BU Food urgent" | Food BU, High/Critical severity |
| "email channel issues" | Channel = email filter applied |
| "yesterday complaints" | Date = yesterday filter |
| "critical cases" | Severity = Critical |
| "pending cases" | Status = Pending |
| "refund requests" | Category = Refund/Returns |

### Future Enhancements

1. **Embedding-based semantic search**
   - Precompute embeddings for case content
   - Cosine similarity for better relevance

2. **Search history**
   - Personal search history
   - "Recent searches" quick access

3. **Saved searches**
   - Save frequently used queries
   - Set up alerts for saved searches

4. **Search analytics dashboard**
   - Most searched terms
   - Zero-result queries

---

## Related Documents
- [Main PRD](../00-call-center-intelligence.md)
- [Cases PRD](./03-cases.md)
- [Chat PRD](./01-home-feed.md) (chat uses similar intent parsing)
