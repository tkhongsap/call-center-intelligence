# Page Verification Checklist

This checklist combines acceptance criteria from all page PRDs for manual testing walkthrough.

---

## Pre-Verification Setup

- [ ] Run `npm run dev` to start development server
- [ ] Open `http://localhost:3000` in browser
- [ ] Confirm seed data is loaded (`npm run db:seed` if needed)

---

## Navigation Verification

| Page | Sidebar | Mobile Nav | Mobile Bottom |
|------|---------|------------|---------------|
| Home | [ ] Works | [ ] Works | [ ] Works |
| Alerts | [ ] Works | [ ] Works | [ ] Works |
| Cases | [ ] Works | [ ] Works | [ ] Works |
| **Trending** | [ ] Works | [ ] Works | [ ] Works |
| Uploads | [ ] Works | [ ] Works | [ ] Works |
| Inbox | [ ] Works | [ ] Works | [ ] Works |
| Search | [ ] Works | [ ] Works | [ ] Works |

---

## 1. HOME PAGE (`/home`)

### Feed Functionality
- [ ] Feed loads within 2 seconds
- [ ] Alert cards render correctly
- [ ] Trending cards render correctly
- [ ] Highlight cards render correctly
- [ ] Upload cards render correctly
- [ ] Clicking cards navigates to drilldown
- [ ] "Updated X ago" timestamps visible

### Pulse Sidebar
- [ ] KPI tiles display with values
- [ ] Sparklines render
- [ ] Word cloud displays
- [ ] Quick filters work

### Header (Known Gaps)
- [ ] Search bar works
- [ ] ~~Role switcher present~~ (NOT IMPLEMENTED)
- [ ] ~~Inbox badge shows count~~ (NOT IMPLEMENTED)

---

## 2. ALERTS PAGE (`/alerts`, `/alerts/:id`)

### List View
- [ ] Alert list loads
- [ ] Shows all 4 alert types (Spike, Threshold, Urgency, Anomaly)
- [ ] Type filter works
- [ ] Severity filter works
- [ ] Status filter works
- [ ] BU filter works

### Detail View
- [ ] Click alert navigates to detail
- [ ] Baseline vs current metrics shown
- [ ] Time window displayed
- [ ] Sample cases table shows
- [ ] "Why flagged" reason text present

### Actions
- [ ] Share modal opens
- [ ] Share creates record
- [ ] Escalate modal opens
- [ ] Escalate marks alert

---

## 3. CASES PAGE (`/cases`, `/cases/:id`)

### List View
- [ ] Case list loads with pagination
- [ ] BU filter works
- [ ] Channel filter works
- [ ] Severity filter works
- [ ] Status filter works
- [ ] Date filter works
- [ ] Pagination controls work

### Export
- [ ] Export CSV button works
- [ ] Export XLSX button works
- [ ] Export respects current filters

### Detail View
- [ ] Click case navigates to detail
- [ ] "Urgent" badge shows (when applicable)
- [ ] "Needs review" badge shows (when applicable)
- [ ] AI Summary displays 3 sections
- [ ] Timeline renders events

### Actions
- [ ] Share modal works
- [ ] Escalate modal works

---

## 4. UPLOADS PAGE (`/uploads`)

### Upload Functionality
- [ ] Drag-drop zone visible
- [ ] Drop file triggers upload
- [ ] Browse button works
- [ ] File picker accepts CSV/XLSX/JSON

### Template
- [ ] Sample template download works
- [ ] Downloaded file is valid CSV

### History
- [ ] Upload history displays
- [ ] Shows file name, date, status
- [ ] Error details accessible

### Error Reporting
- [ ] Errors show row number
- [ ] Errors show column
- [ ] Errors show reason
- [ ] Errors show suggested fix

---

## 5. SEARCH PAGE (`/search`)

### Search Functionality
- [ ] Search bar accepts input
- [ ] Results appear within 2 seconds
- [ ] "Executed in X ms" displays

### Query Parsing
- [ ] "urgent" applies High/Critical filter
- [ ] Date expressions work ("last week")
- [ ] BU names recognized
- [ ] Channel names recognized

### Results
- [ ] Matching cases display
- [ ] Suggested filters appear as chips
- [ ] Chips can be removed individually
- [ ] Empty state shows popular searches
- [ ] Results link to case detail

---

## 6. TRENDING PAGE (`/trending`)

### Core Functionality
- [ ] Page loads from sidebar (CRITICAL - was missing)
- [ ] 24h/7d toggle works
- [ ] Toggle switches data view

### Topic Display
- [ ] Top 5 topics display
- [ ] Trend scores shown
- [ ] Trend direction indicators (rising/falling/stable)
- [ ] BU impacts listed

### Predictions
- [ ] Predicted risk cards appear
- [ ] At least 3 prediction cards
- [ ] "Likely to spike" reasoning shown

### Sample Data
- [ ] Sample cases linked
- [ ] Clicking case navigates to detail

---

## 7. INBOX PAGE (`/inbox`)

### Filtering
- [ ] Filter by status works (Read/Unread/All)
- [ ] Filter by type works (Share/Escalation/All)

### Item Display
- [ ] Sender name shown
- [ ] Timestamp shown
- [ ] Message/note shown
- [ ] Unread indicator visible

### Actions
- [ ] Mark as read works
- [ ] Mark as actioned works
- [ ] Click navigates to source item

### Header (Known Gap)
- [ ] ~~Inbox badge in header~~ (NOT IMPLEMENTED)

---

## Demo Checklist (from Original PRD)

Complete these in a 10-minute walkthrough:

1. [ ] Open Home -> see Today Feed + trending + pulse
2. [ ] Click an alert post -> filtered case list
3. [ ] Open a case detail -> see flags + summary
4. [ ] Share the case/alert to "Management" -> appears in Inbox
5. [ ] Search: "urgent refund last week" -> relevant cases + filters
6. [ ] Show "Trending now" + "Predicted risks"
7. [ ] Upload CSV template -> new cases appear + feed shows upload

---

## Known Gaps Summary

| Gap | Page | Severity | Notes |
|-----|------|----------|-------|
| Role switcher | Header/Home | MEDIUM | Not implemented |
| Inbox badge | Header | MEDIUM | Not showing unread count |
| ~~Trending in sidebar~~ | Navigation | ~~HIGH~~ | **FIXED** |
| Related topics section | Search | LOW | Not explicit section |
| Feed item after upload | Uploads | LOW | Needs verification |

---

## Post-Verification

- [ ] All critical items pass
- [ ] Document any new issues found
- [ ] Run `npm run typecheck` - passes
- [ ] Run `npm run lint` - passes
- [ ] Run `npm run build` - succeeds
