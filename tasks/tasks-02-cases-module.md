# Task 02: Cases Module

## Overview
Build the case list and case detail views with filtering, badges, and share/escalate functionality.

## Priority
**2** (Core data display - foundation for alerts and feed)

## Dependencies
- Task 01: Project Setup (database schema, seed data)

## Functional Requirements Covered
- **FR41**: Filterable list of cases with columns: date, BU, channel, category, severity, status
- **FR42**: Cases with riskFlag=true display "Urgent" badge
- **FR43**: Cases with needsReviewFlag=true display "Needs Review" badge
- **FR44**: Case detail view with full info, timeline, AI summary, Share/Escalate buttons
- **FR45**: AI summary template: What happened, Impact, Suggested next action

## Tasks

### 2.1 Create Cases List Page
- [ ] Create `/cases` route
- [ ] Build data table component with columns:
  - Date (sortable)
  - Case Number
  - BU (filterable)
  - Channel (filterable)
  - Category (filterable)
  - Severity (filterable, color-coded)
  - Status (filterable)
- [ ] Implement pagination (20 items per page)
- [ ] Add URL-encoded filter state (shareable URLs)

### 2.2 Implement Filters
- [ ] Create filter sidebar/toolbar component
- [ ] Add BU multi-select dropdown
- [ ] Add Channel multi-select dropdown
- [ ] Add Category dropdown
- [ ] Add Severity filter (low/medium/high/critical)
- [ ] Add Status filter
- [ ] Add Date range picker
- [ ] Implement "Clear all filters" button
- [ ] Sync filters to URL query params

### 2.3 Add Case Badges
- [ ] Create Badge component (reusable)
- [ ] Render "Urgent" badge (red) when riskFlag=true
- [ ] Render "Needs Review" badge (yellow) when needsReviewFlag=true
- [ ] Show badges in list view and detail view

### 2.4 Create Case Detail Page
- [ ] Create `/cases/[id]` route
- [ ] Display full case information:
  - Case number, created date
  - BU, channel, category, subcategory
  - Severity, status
  - Customer sentiment
  - Full description
- [ ] Display badges (Urgent, Needs Review)
- [ ] Add breadcrumb navigation

### 2.5 Build Case Timeline
- [ ] Create timeline component
- [ ] Display mock timeline events:
  - Case created
  - Agent assigned
  - Customer contacted
  - Resolution (if resolved)
- [ ] Style with vertical line and event markers

### 2.6 Implement AI Summary Card
- [ ] Create AI Summary component
- [ ] Display three sections:
  - **What happened**: Brief description
  - **Impact**: Business/customer impact
  - **Suggested next action**: Recommended action
- [ ] Generate mock summaries from case data
- [ ] Add "AI Generated" indicator badge

### 2.7 Add Share/Escalate Actions
- [ ] Create Share button with modal
- [ ] Build recipient selector (from mock user directory)
- [ ] Add note text field
- [ ] Implement share creation (POST to API)
- [ ] Create Escalate button with confirmation
- [ ] Implement escalation (updates case priority + creates share)

### 2.8 Create API Routes
- [ ] `GET /api/cases` - List cases with filters
- [ ] `GET /api/cases/[id]` - Get single case
- [ ] `POST /api/shares` - Create share record

## Acceptance Criteria
- [ ] Cases list loads with all columns visible
- [ ] Filters work and update URL
- [ ] Urgent and Needs Review badges display correctly
- [ ] Case detail page shows all information
- [ ] AI summary renders with three sections
- [ ] Share modal allows recipient selection and note
- [ ] Escalate marks case as escalated

## Estimated Complexity
Medium

## Files to Create
```
app/
  cases/
    page.tsx
    [id]/
      page.tsx
components/
  cases/
    CaseList.tsx
    CaseFilters.tsx
    CaseDetail.tsx
    CaseTimeline.tsx
    AISummary.tsx
  ui/
    Badge.tsx
    DataTable.tsx
    ShareModal.tsx
app/api/
  cases/
    route.ts
    [id]/
      route.ts
  shares/
    route.ts
```
