# Alerts PRD

## Overview

| Field | Value |
|-------|-------|
| **Routes** | `/[locale]/alerts`, `/[locale]/alerts/[id]` |
| **Purpose** | Display and manage system-generated alerts with drilldown to details, share/escalate functionality |
| **User Roles** | All roles (PM/PO, BU Manager, Supervisor) |
| **Status** | 95% complete |

---

## Requirements from Original PRD

> From `docs/00-call-center-intelligence.md` Section 5.5

### Alert Types

1. **Spike alert** (trend-based)
2. **Threshold alert** (count exceeds X)
3. **Urgency alert** (severity + keywords like safety/legal)
4. **Misclassification suspicion** (optional prototype feature)
   - Example: severity low but contains "injury / legal / refund"
   - Creates "Needs review" flag

### Alert Explanation ("Why Flagged")

Always show:
- Baseline vs current
- Time window
- Top sample cases
- Top phrases that contributed

### Alert Actions
- View cases (filtered to alert criteria)
- Share (internal share object)
- Escalate (marks as escalated + priority)

### Acceptance Criteria (from PRD)
- Alerts are stable/deterministic for demo
- Each alert has drilldown + share

---

## Implementation Status

| Requirement | Status | Implementation Notes |
|-------------|--------|---------------------|
| Spike alert type | Done | Shows trend-based spikes |
| Threshold alert type | Done | Count-exceeds triggers |
| Urgency alert type | Done | Severity-based urgency |
| Misclassification type | Done | Labeled as "anomaly" type |
| Alert list view | Done | Filterable list with cards |
| Alert detail page | Done | Full drilldown at `/alerts/[id]` |
| Baseline vs current | Done | Displayed in metrics section |
| Time window display | Done | Shows window start/end |
| Sample cases | Done | Table with linked cases |
| Why flagged text | Done | Human-readable reason |
| Share functionality | Done | Modal with recipient selection |
| Escalate functionality | Done | Modal with priority options |
| Filters (type, severity, status, BU) | Done | Filter bar implemented |

---

## Components & APIs

### Components Used
| Component | Path | Purpose |
|-----------|------|---------|
| AlertList | `components/alerts/AlertList.tsx` | Main alert listing |
| AlertCard | `components/alerts/AlertCard.tsx` | Individual alert display |
| AlertDetail | `components/alerts/AlertDetail.tsx` | Detail page content |
| AlertFilters | `components/alerts/AlertFilters.tsx` | Filter controls |
| ShareModal | `components/shared/ShareModal.tsx` | Share dialog |
| EscalateModal | `components/shared/EscalateModal.tsx` | Escalation dialog |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/alerts` | GET | Returns paginated alerts with filters |
| `/api/alerts/[id]` | GET | Returns single alert details |
| `/api/shares` | POST | Create share record |
| `/api/escalate` | POST | Create escalation |

---

## Acceptance Criteria

### Functional
- [x] Alert list shows all 4 alert types
- [x] Filters work correctly (type, severity, status, BU)
- [x] Alert detail shows baseline vs current metrics
- [x] Sample cases table displays with links
- [x] Share modal works and creates share record
- [x] Escalate modal works and marks alert
- [x] Clicking "View cases" navigates to filtered cases
- [x] Alerts are deterministic with seed data

### Performance
- [x] Alert list loads within 2 seconds
- [x] Filters apply without page reload

### Accessibility
- [x] Alert cards are keyboard navigable
- [x] Severity indicators have text alternatives

---

## Known Gaps & Recommendations

### Current Gaps

None significant - all core requirements implemented.

### Future Enhancements

1. **Alert acknowledgment workflow**
   - Add "Acknowledge" action to mark alerts as seen
   - Track who acknowledged and when

2. **Alert grouping**
   - Group related alerts (same BU, same time window)
   - "Bulk actions" for multiple alerts

3. **Alert history/audit log**
   - Track all actions taken on an alert
   - Show timeline of status changes

---

## Related Documents
- [Main PRD](../00-call-center-intelligence.md)
- [Home Feed PRD](./01-home-feed.md)
- [Cases PRD](./03-cases.md)
