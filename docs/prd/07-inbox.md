# Inbox PRD

## Overview

| Field | Value |
|-------|-------|
| **Route** | `/[locale]/inbox` |
| **Purpose** | View received shares and escalations with status tracking and source navigation |
| **User Roles** | All roles (PM/PO sees all, BU Manager/Supervisor sees role-scoped) |
| **Status** | 95% complete |

---

## Requirements from Original PRD

> From `docs/00-call-center-intelligence.md` Section 5.7

### Core Requirements

**Screens:** `/inbox` — received shares + escalations (management visibility)

### Share Record (from Data Model)
- id, createdAt, createdBy
- type: `CASE | ALERT | REPORT`
- targetId (caseId/alertId)
- recipients (array of mock users)
- message
- status: sent/read
- linkToken (for shareable URLs)

### Actions Available
- **Share** (internal share object):
  - Choose recipients (mock directory)
  - Add note
  - Generates share link

- **Escalate** (marks as escalated + priority):
  - Adds to "Management Inbox" view
  - Creates timeline entry

### Acceptance Criteria (from PRD)
- Sharing creates an auditable record:
  - Who shared, to whom, when, what note
- Recipients can view shared item in "Inbox"

---

## Implementation Status

| Requirement | Status | Implementation Notes |
|-------------|--------|---------------------|
| Received shares list | Done | Shows items shared with user |
| Escalations list | Done | Shows items escalated to user |
| Filter by status | Done | Read/Unread/All |
| Filter by type | Done | Share/Escalation/All |
| Sender information | Done | Shows who shared/escalated |
| Timestamp | Done | Shows when received |
| Message/note | Done | Shows sender's note |
| Source item link | Done | Navigate to original case/alert |
| Read/unread status | Done | Visual indicator |
| Mark as read | Done | Single item action |
| Mark as actioned | Done | Archive/complete action |
| **Header inbox badge** | **Missing** | Should show unread count |

---

## Components & APIs

### Components Used
| Component | Path | Purpose |
|-----------|------|---------|
| InboxPage | `app/[locale]/inbox/page.tsx` | Main inbox page |
| InboxList | `components/inbox/InboxList.tsx` | List of inbox items |
| InboxItem | `components/inbox/InboxItem.tsx` | Individual inbox entry |
| InboxFilters | `components/inbox/InboxFilters.tsx` | Status/type filters |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/inbox` | GET | Returns inbox items for user |
| `/api/inbox/[id]/read` | PUT | Mark item as read |
| `/api/inbox/[id]/action` | PUT | Mark item as actioned |
| `/api/inbox/count` | GET | Returns unread count |

---

## Acceptance Criteria

### Functional
- [x] Filter by status (Read/Unread/All) works
- [x] Filter by type (Share/Escalation/All) works
- [x] Items show sender name
- [x] Items show received timestamp
- [x] Items show sender's message/note
- [x] Mark as read works (single item)
- [x] Mark as actioned works
- [x] Click navigates to source case/alert
- [x] Unread items have visual indicator
- [ ] Header badge shows unread count (missing)

### Performance
- [x] Inbox loads within 1 second
- [x] Marking read is instant

### Accessibility
- [x] Inbox list is keyboard navigable
- [x] Read/unread state announced to screen readers
- [x] Actions are keyboard accessible

---

## Known Gaps & Recommendations

### Current Gaps

1. **Header Inbox Badge Missing**
   - Impact: Users don't see notification of new items
   - Location: Should be in `components/layout/Header.tsx`
   - Recommendation: Add badge component showing unread count
   - API: Use `/api/inbox/count` endpoint

### Future Enhancements

1. **Mark all as read**
   - Bulk action for clearing all unread
   - Useful when catching up

2. **Inbox notifications**
   - Browser notifications for new items
   - Optional sound alert

3. **Reply to share**
   - Reply with message back to sender
   - Thread-style conversation

4. **Archive vs delete**
   - Archive for later reference
   - Permanent delete option

5. **Inbox search**
   - Search within inbox items
   - Filter by sender

6. **Email forwarding**
   - Forward inbox item via email
   - (Phase 2 feature from PRD)

---

## Related Documents
- [Main PRD](../00-call-center-intelligence.md)
- [Home Feed PRD](./01-home-feed.md) (header badge integration)
- [Alerts PRD](./02-alerts.md) (alert shares appear here)
- [Cases PRD](./03-cases.md) (case shares appear here)
