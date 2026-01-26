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
- [x] Create `/cases` route
- [x] Build data table component with columns:
  - Date (sortable)
  - Case Number
  - BU (filterable)
  - Channel (filterable)
  - Category (filterable)
  - Severity (filterable, color-coded)
  - Status (filterable)
- [x] Implement pagination (20 items per page)
- [x] Add URL-encoded filter state (shareable URLs)

### 2.2 Implement Filters
- [x] Create filter sidebar/toolbar component
- [x] Add BU multi-select dropdown
- [x] Add Channel multi-select dropdown
- [x] Add Category dropdown
- [x] Add Severity filter (low/medium/high/critical)
- [x] Add Status filter
- [x] Add Date range picker
- [x] Implement "Clear all filters" button
- [x] Sync filters to URL query params

### 2.3 Add Case Badges
- [x] Create Badge component (reusable)
- [x] Render "Urgent" badge (red) when riskFlag=true
- [x] Render "Needs Review" badge (yellow) when needsReviewFlag=true
- [x] Show badges in list view and detail view

### 2.4 Create Case Detail Page
- [x] Create `/cases/[id]` route
- [x] Display full case information:
  - Case number, created date
  - BU, channel, category, subcategory
  - Severity, status
  - Customer sentiment
  - Full description
- [x] Display badges (Urgent, Needs Review)
- [x] Add breadcrumb navigation

### 2.5 Build Case Timeline
- [x] Create timeline component
- [x] Display mock timeline events:
  - Case created
  - Agent assigned
  - Customer contacted
  - Resolution (if resolved)
- [x] Style with vertical line and event markers

### 2.6 Implement AI Summary Card
- [x] Create AI Summary component
- [x] Display three sections:
  - **What happened**: Brief description
  - **Impact**: Business/customer impact
  - **Suggested next action**: Recommended action
- [x] Generate mock summaries from case data
- [x] Add "AI Generated" indicator badge

### 2.7 Add Share/Escalate Actions
- [x] Create Share button with modal
- [x] Build recipient selector (from mock user directory)
- [x] Add note text field
- [x] Implement share creation (POST to API)
- [x] Create Escalate button with confirmation
- [x] Implement escalation (updates case priority + creates share)

### 2.8 Create API Routes
- [x] `GET /api/cases` - List cases with filters
- [x] `GET /api/cases/[id]` - Get single case
- [x] `POST /api/shares` - Create share record

## Acceptance Criteria
- [x] Cases list loads with all columns visible
- [x] Filters work and update URL
- [x] Urgent and Needs Review badges display correctly
- [x] Case detail page shows all information
- [x] AI summary renders with three sections
- [x] Share modal allows recipient selection and note
- [x] Escalate marks case as escalated

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
