# Trending PRD

## Overview

| Field | Value |
|-------|-------|
| **Route** | `/[locale]/trending` |
| **Purpose** | Display trending topics with time comparisons, trend scores, BU impacts, and predicted risks |
| **User Roles** | All roles (PM/PO, BU Manager, Supervisor) |
| **Status** | 95% complete (page works, **was missing from sidebar - now fixed**) |

---

## Requirements from Original PRD

> From `docs/00-call-center-intelligence.md` Section 5.6

### "Trending Now" Requirements

Compute trending topics using simple, believable analytics:

- Compare term/category frequency in:
  - Last 24h vs previous 24h
  - Last 7 days vs previous 7 days

- Generate "trend score":
  - z-score or percent change with minimum counts

- Output:
  - Top 5 trending topics
  - Top BUs impacted
  - Example cases

### "Prediction / What's Next" Requirements

Lightweight but impressive:

- **Forecast next period** using moving average / exponential smoothing
- Surface "Likely to spike" if:
  - Trend score rising for 3 consecutive windows
  - Approaching threshold

### Acceptance Criteria (from PRD)
- Trending panel produces consistent results on seed data
- At least 3 "predicted risk" cards appear with reasonable explanations

---

## Implementation Status

| Requirement | Status | Implementation Notes |
|-------------|--------|---------------------|
| Time window comparison (24h) | Done | Last 24h vs previous 24h |
| Time window comparison (7d) | Done | Last 7d vs previous 7d |
| 24h/7d toggle | Done | Switch between views |
| Trend score (z-score/percent) | Done | Shows trend direction and magnitude |
| Top 5 trending topics | Done | Ranked list with scores |
| BU impacts | Done | Shows affected business units |
| Sample cases | Done | Linked example cases |
| Predicted risk cards | Done | "Likely to spike" warnings |
| At least 3 predictions | Done | Seed data ensures >= 3 |
| **Sidebar navigation** | **Fixed** | Was missing, now added |

---

## Components & APIs

### Components Used
| Component | Path | Purpose |
|-----------|------|---------|
| TrendingPage | `app/[locale]/trending/page.tsx` | Main trending page |
| TrendingTopicCard | `components/trending/TrendingTopicCard.tsx` | Topic display card |
| TrendingChart | `components/trending/TrendingChart.tsx` | Trend visualization |
| PredictionCard | `components/trending/PredictionCard.tsx` | Risk prediction card |
| TimeWindowToggle | `components/trending/TimeWindowToggle.tsx` | 24h/7d switch |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trending` | GET | Returns trending topics with scores |
| `/api/predictions` | GET | Returns predicted risk items |

---

## Acceptance Criteria

### Functional
- [x] **Page accessible via sidebar navigation** (FIXED)
- [x] 24h/7d toggle switches time window
- [x] Top 5 topics display with trend scores
- [x] Trend direction shown (rising/falling/stable)
- [x] BU impacts displayed per topic
- [x] Sample cases linked
- [x] Predicted risk cards appear (>= 3)
- [x] Predictions show "Likely to spike" reasoning
- [x] Results are consistent/deterministic

### Performance
- [x] Page loads within 2 seconds
- [x] Toggle switches instantly (client-side)

### Accessibility
- [x] Topic cards are keyboard navigable
- [x] Trend indicators have text alternatives
- [x] Time toggle is accessible

---

## Known Gaps & Recommendations

### Current Gaps

**RESOLVED:** Trending was missing from sidebar navigation - now fixed in:
- `components/layout/Sidebar.tsx`
- `components/layout/MobileNav.tsx`
- `components/layout/MobileBottomNav.tsx`

### Future Enhancements

1. **Trend alerts**
   - Auto-create alert when topic exceeds threshold
   - "Watch this topic" action

2. **Custom time ranges**
   - Allow custom date range comparison
   - "Compare this week vs same week last month"

3. **Topic drilldown page**
   - `/trending/[topic]` for deep analysis
   - Historical trend chart
   - All related cases

4. **Export trending report**
   - Download trending analysis as PDF
   - Shareable report format

5. **Topic grouping/clustering**
   - Group similar topics
   - "Related topics" connections

---

## Related Documents
- [Main PRD](../00-call-center-intelligence.md)
- [Home Feed PRD](./01-home-feed.md) (trending cards in feed)
- [Alerts PRD](./02-alerts.md) (spike alerts related to trends)
