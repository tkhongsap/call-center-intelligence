# Home / Live Feed PRD

## Overview

| Field | Value |
|-------|-------|
| **Route** | `/[locale]/home` |
| **Purpose** | Main dashboard with social-media style live feed, real-time pulse metrics, and quick access to alerts and trends |
| **User Roles** | All roles (PM/PO, BU Manager, Supervisor) |
| **Status** | 85% complete |

---

## Requirements from Original PRD

> From `docs/00-call-center-intelligence.md` Section 5.1

### Core Requirements

The home experience should feel like **X/Twitter**:
- A **Today Feed** with highlights, alerts, trending topics, "breaking issues"
- Numbers still exist, but are **supporting context**, not the main show

### Layout (from PRD)

- **Left/main column: "Today Feed"**
  - Cards that look like posts:
    - Alert cards (spike, threshold, urgent)
    - Trending topic cards
    - Highlight cards ("Top issue today", "New emerging complaint")
    - Resolution highlight cards ("Resolved major spike", "SLA improved")
- **Right sidebar: "Pulse"**
  - KPI tiles (small)
  - Mini trend sparkline
  - Word cloud
  - Quick filters
- **Top bar**
  - Semantic search bar (global)
  - Role switcher
  - Share inbox (sent shares) badge

### Feed Item Types (must-have)

1. **Alert Post**
   - Title: "Spike in BU X: Delivery Delay +65% vs last week"
   - Why flagged (human readable)
   - CTA: "View cases" "Share" "Escalate"

2. **Trending Post**
   - "Trending: 'Broken bottle' mentions rising in last 24h"
   - Top phrases, sample cases

3. **Highlight Post**
   - "Today's highlight: Top 3 complaint themes"
   - "Hot BU today"

4. **New Upload Post** (when ingestion happens)
   - "Upload batch added 120 new cases"

### Real-time Feel (from Section 5.2)
- Polling every 10-20s for feed updates, alerts count, new cases
- Users see "Updated X seconds ago"
- At least one "new activity" appears during demo

---

## Implementation Status

| Requirement | Status | Implementation Notes |
|-------------|--------|---------------------|
| Today Feed layout | Done | Left column with scrollable feed |
| Alert cards | Done | `AlertFeedCard.tsx` with severity, metrics |
| Trending cards | Done | `TrendingFeedCard.tsx` with trend direction |
| Highlight cards | Done | `HighlightFeedCard.tsx` with daily digest |
| Upload cards | Done | `UploadFeedCard.tsx` with batch info |
| Pulse sidebar | Done | KPI tiles, sparklines, word cloud |
| Quick filters | Done | In Pulse sidebar |
| Semantic search bar | Done | Global search in header |
| Role switcher | **Missing** | Not implemented in header |
| Inbox badge | **Missing** | Not showing unread count |
| Real-time polling | Done | Via RealtimeContext (10-20s) |
| "Updated X ago" | Done | Timestamps on feed items |
| Demo mode toggle | Done | Via DemoModeContext |

---

## Components & APIs

### Components Used
| Component | Path | Purpose |
|-----------|------|---------|
| LiveFeed | `components/feed/LiveFeed.tsx` | Main feed container |
| AlertFeedCard | `components/feed/AlertFeedCard.tsx` | Alert post cards |
| TrendingFeedCard | `components/feed/TrendingFeedCard.tsx` | Trending topic cards |
| HighlightFeedCard | `components/feed/HighlightFeedCard.tsx` | Daily digest/highlight cards |
| UploadFeedCard | `components/feed/UploadFeedCard.tsx` | Upload notification cards |
| PulseSidebar | `components/pulse/PulseSidebar.tsx` | Right sidebar with KPIs |
| KPITile | `components/pulse/KPITile.tsx` | Individual KPI display |
| WordCloud | `components/pulse/WordCloud.tsx` | Keyword visualization |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/feed` | GET | Returns feed items (alerts, trending, highlights) |
| `/api/pulse` | GET | Returns KPI tiles + sparkline data |
| `/api/trending` | GET | Returns trending topics |

---

## Acceptance Criteria

### Functional
- [x] Feed loads within 2 seconds
- [x] 4 card types render correctly (Alert, Trending, Highlight, Upload)
- [x] Pulse sidebar shows KPIs with sparklines
- [x] Quick filters apply to feed
- [x] "Updated X ago" visible on feed items
- [x] Clicking cards navigates to drilldown pages
- [x] Feed updates when filters change
- [ ] Role switcher allows changing user role
- [ ] Inbox badge shows unread count

### Performance
- [x] Page loads within 2 seconds on seeded dataset
- [x] Feed polling doesn't cause UI jank

### Accessibility
- [x] Keyboard navigation works on feed cards
- [x] Cards have appropriate ARIA labels

---

## Known Gaps & Recommendations

### Current Gaps

1. **Role Switcher Missing**
   - Impact: Cannot demo different user perspectives
   - Location: Should be in `components/layout/Header.tsx`
   - Recommendation: Add dropdown with PM/PO, BU Manager, Supervisor options

2. **Inbox Badge Missing**
   - Impact: Users don't see unread share/escalation notifications
   - Location: Should be in `components/layout/Header.tsx`
   - Recommendation: Add badge with unread count from `/api/inbox`

### Future Enhancements
1. Resolution highlight cards ("Resolved major spike")
2. Mock event generator toggle for demos
3. SSE option for true real-time updates

---

## Related Documents
- [Main PRD](../00-call-center-intelligence.md)
- [Alerts PRD](./02-alerts.md)
- [Trending PRD](./06-trending.md)
