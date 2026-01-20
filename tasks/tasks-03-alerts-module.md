# Task 03: Alerts Module

## Overview
Implement the alert system with different alert types, alert list view, and sharing/escalation workflows.

## Priority
**3** (Alert generation powers the live feed)

## Dependencies
- Task 01: Project Setup (database schema)
- Task 02: Cases Module (share modal, badge components)

## Functional Requirements Covered
- **FR26**: Generate Spike alerts based on trend analysis
- **FR27**: Generate Threshold alerts when counts exceed configured limits
- **FR28**: Generate Urgency alerts based on severity and keywords (safety, legal)
- **FR29**: Generate Misclassification alerts when low severity cases contain risky keywords
- **FR30**: Each alert displays: baseline vs current, time window, sample cases, contributing phrases
- **FR31**: Share alert with selectable recipients from mock directory
- **FR32**: Add note when sharing
- **FR33**: Escalate alert, marking as escalated with increased priority
- **FR34**: Escalated items appear in "Management Inbox" view
- **FR35**: All shares create auditable record (who, to whom, when, note, link)

## Tasks

### 3.1 Create Alert List Page
- [ ] Create `/alerts` route
- [ ] Build alert card list view
- [ ] Add filters: type, severity, status, date range
- [ ] Implement sorting (newest first)
- [ ] Add URL-encoded filter state

### 3.2 Design Alert Card Component
- [ ] Create AlertCard component with:
  - Header: Alert type icon + severity color
  - Title: Alert title with metrics
  - Body: Human-readable explanation
  - Stats: Baseline vs Current values
  - Time window indicator
  - Sample cases preview (3 cases)
  - Contributing phrases/keywords
  - Footer: [View Cases] [Share] [Escalate] buttons
- [ ] Color-code by severity (critical=red, high=orange, medium=yellow, low=blue)

### 3.3 Implement Alert Types

#### Spike Alert
- [ ] Detect when current count > baseline * spike_factor
- [ ] Display: "BU X: [Topic] +65% vs last week"
- [ ] Show time comparison window

#### Threshold Alert
- [ ] Detect when count exceeds configured threshold
- [ ] Display: "High volume: [Count] cases in [BU]"
- [ ] Show threshold value vs actual

#### Urgency Alert
- [ ] Detect cases with high severity + risk keywords
- [ ] Keywords: safety, legal, threat, lawsuit, injury, death
- [ ] Display: "Urgent: [Count] high-risk cases detected"

#### Misclassification Alert
- [ ] Detect low severity cases with risky keywords
- [ ] Display: "Review needed: [Count] potentially misclassified"
- [ ] Show sample cases for review

### 3.4 Build Alert Detail View
- [ ] Create `/alerts/[id]` route
- [ ] Show full alert information
- [ ] Display all contributing cases (paginated)
- [ ] Show trend chart (if applicable)
- [ ] Show keyword/phrase breakdown

### 3.5 Implement Alert Generation Logic
- [ ] Create alert computation service in `lib/alerts.ts`
- [ ] Implement spike detection algorithm:
  - Compare last 24h vs previous 24h
  - Compare last 7d vs previous 7d
- [ ] Implement threshold detection
- [ ] Implement keyword scanning for urgency/misclassification
- [ ] Add `npm run compute-alerts` script

### 3.6 Create Management Inbox
- [ ] Create `/inbox` route
- [ ] List all escalated alerts and cases
- [ ] Show shared items directed to current user
- [ ] Display: who shared, when, note, link to item
- [ ] Add "Mark as read" functionality

### 3.7 Create API Routes
- [ ] `GET /api/alerts` - List alerts with filters
- [ ] `GET /api/alerts/[id]` - Get single alert
- [ ] `POST /api/alerts/[id]/escalate` - Escalate alert
- [ ] `GET /api/inbox` - Get user's inbox items

## Acceptance Criteria
- [ ] Alert list shows all alert types
- [ ] Each alert card displays required information
- [ ] Spike alerts show percentage increase
- [ ] Threshold alerts show threshold vs actual
- [ ] Sample cases link to case detail
- [ ] Share modal works (from Task 02)
- [ ] Escalated items appear in Management Inbox
- [ ] Share audit trail is recorded

## Estimated Complexity
Medium-High

## Files to Create
```
app/
  alerts/
    page.tsx
    [id]/
      page.tsx
  inbox/
    page.tsx
components/
  alerts/
    AlertCard.tsx
    AlertList.tsx
    AlertDetail.tsx
    AlertStats.tsx
  inbox/
    InboxList.tsx
    InboxItem.tsx
lib/
  alerts.ts
app/api/
  alerts/
    route.ts
    [id]/
      route.ts
      escalate/
        route.ts
  inbox/
    route.ts
```
