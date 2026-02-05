# Cases PRD

## Overview

| Field | Value |
|-------|-------|
| **Routes** | `/[locale]/cases`, `/[locale]/cases/[id]` |
| **Purpose** | Browse, filter, and export customer cases with detailed views including AI summary and timeline |
| **User Roles** | All roles (PM/PO, BU Manager, Supervisor) |
| **Status** | 100% complete |

---

## Requirements from Original PRD

> From `docs/00-call-center-intelligence.md` Section 5.8

### Core Requirements

**Screens:** `/cases`, `/cases/:id`

### Improvements (from baseline)
- "Urgent" badge when riskFlag true
- "Needs review" badge for misclassification suspicion
- "Share/Escalate" buttons on case detail
- "AI summary" section (mock) with consistent template:
  - What happened
  - Impact
  - Suggested next action

### Data Model Fields
- id, createdAt, BU, channel, category, subcategory, severity
- title, description, summaryText
- status, ownerTeam
- topicLabel, sentiment, riskFlag, needsReviewFlag
- tags (array)

### Export Requirements (from Section 5.10)
- Export filtered cases to CSV/XLSX (must)

---

## Implementation Status

| Requirement | Status | Implementation Notes |
|-------------|--------|---------------------|
| Case list view | Done | Paginated table with filters |
| Case filters | Done | BU, channel, category, severity, status, date |
| Pagination | Done | 10/25/50 per page options |
| Case detail page | Done | Full case information display |
| "Urgent" badge | Done | Shows when riskFlag=true |
| "Needs review" badge | Done | Shows when needsReviewFlag=true |
| AI Summary section | Done | 3-section template (What/Impact/Action) |
| Timeline | Done | Event timeline with icons |
| Share functionality | Done | Modal with recipient selection |
| Escalate functionality | Done | Modal with priority options |
| Export to CSV | Done | Downloads filtered results |
| Export to XLSX | Done | Excel format export |

---

## Components & APIs

### Components Used
| Component | Path | Purpose |
|-----------|------|---------|
| CaseList | `components/cases/CaseList.tsx` | Main case listing |
| CaseTable | `components/cases/CaseTable.tsx` | Table view |
| CaseCard | `components/cases/CaseCard.tsx` | Card view option |
| CaseDetail | `components/cases/CaseDetail.tsx` | Detail page content |
| CaseFilters | `components/cases/CaseFilters.tsx` | Filter controls |
| CaseTimeline | `components/cases/CaseTimeline.tsx` | Event timeline |
| AISummary | `components/cases/AISummary.tsx` | AI summary section |
| ShareModal | `components/shared/ShareModal.tsx` | Share dialog |
| EscalateModal | `components/shared/EscalateModal.tsx` | Escalation dialog |
| ExportButton | `components/shared/ExportButton.tsx` | Export controls |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cases` | GET | Returns paginated cases with filters |
| `/api/cases/[id]` | GET | Returns single case details |
| `/api/export` | GET | Returns CSV/XLSX export |
| `/api/shares` | POST | Create share record |
| `/api/escalate` | POST | Create escalation |

---

## Acceptance Criteria

### Functional
- [x] Case list loads with pagination
- [x] All filters apply correctly (BU, channel, severity, status, date)
- [x] Export CSV downloads filtered results
- [x] Export XLSX downloads filtered results
- [x] Case detail shows "Urgent" badge when applicable
- [x] Case detail shows "Needs review" badge when applicable
- [x] AI Summary shows 3 sections (What happened, Impact, Next action)
- [x] Timeline renders events chronologically
- [x] Share modal creates share record
- [x] Escalate modal marks case as escalated

### Performance
- [x] Case list loads within 2 seconds
- [x] Export completes within 5 seconds for full dataset
- [x] Filters apply without full page reload

### Accessibility
- [x] Table is keyboard navigable
- [x] Badges have text alternatives for color meanings
- [x] Pagination controls are accessible

---

## Known Gaps & Recommendations

### Current Gaps

None - all core requirements fully implemented.

### Future Enhancements

1. **Bulk actions**
   - Select multiple cases for batch operations
   - Bulk export, bulk share, bulk status update

2. **Saved filters**
   - Save commonly used filter combinations
   - Quick access to saved views

3. **Case comparison**
   - Compare two cases side-by-side
   - Useful for duplicate detection

4. **Advanced search within cases**
   - Full-text search across case content
   - Highlight matching text

---

## Related Documents
- [Main PRD](../00-call-center-intelligence.md)
- [Alerts PRD](./02-alerts.md)
- [Search PRD](./05-search.md)
