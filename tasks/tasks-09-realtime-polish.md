# Task 09: Real-Time Polish

## Overview
Add real-time feel with polling, timestamps, and demo mode with mock event generation.

## Priority
**9** (Final polish - enhances demo experience)

## Dependencies
- Task 01: Project Setup (demo mode config)
- Task 04: Live Feed (feed updates)
- All other modules for integration

## Functional Requirements Covered
- **FR11**: Poll for feed updates, alert counts, new cases every 10-20 seconds
- **FR12**: Display "Updated X seconds ago" timestamp on feed
- **FR13**: At least one "new activity" appears during demo session
- **FR14**: Admin can toggle mock event generator on/off
- **FR15**: Optionally support SSE (server-sent events) for pushing feed updates

## Tasks

### 9.1 Implement Polling Infrastructure
- [x] Create `lib/polling.ts` utility
- [x] Implement configurable polling interval (10-20s)
- [x] Create custom hook `usePolling()`
- [x] Handle polling start/stop on page visibility
- [x] Clean up polling on unmount

### 9.2 Add Feed Polling
- [x] Poll `/api/feed` for new items
- [x] Compare with current feed state
- [x] Detect new items
- [x] Show "X new items" notification
- [x] Animate new items into feed

### 9.3 Add Alert Count Polling
- [x] Poll `/api/alerts/count` for badge updates
- [x] Update alert badge in header
- [x] Show badge animation on change

### 9.4 Implement Timestamp Display
- [x] Create RelativeTime component
- [x] Display "Updated X seconds ago"
- [x] Auto-update timestamp every second
- [x] Format: "Just now", "30s ago", "2m ago", "5m ago"
- [x] Add to feed header

### 9.5 Build Mock Event Generator
- [x] Create `lib/mockEvents.ts`
- [x] Generate realistic mock events:
  - New case arrival
  - Alert triggered
  - Trending topic update
- [x] Run on configurable interval
- [x] Store generated events in database

### 9.6 Create Demo Mode Controls
- [x] Add admin toggle in settings/header
- [x] Create DemoModeToggle component
- [x] Persist demo mode state
- [x] Show indicator when demo mode active
- [x] Control mock event generator

### 9.7 Implement Demo Mode Behavior
- [x] When enabled:
  - Generate 1 event every 30-60 seconds
  - Ensure variety (alerts, cases, trends)
  - Create meaningful events (not random noise)
- [x] When disabled:
  - Stop mock event generation
  - Normal polling only

### 9.8 Add Visual Feedback for Updates
- [x] Create NewItemIndicator component
- [x] Show toast/notification for new items
- [x] Highlight newly added feed cards
- [x] Add subtle animation
- [x] Auto-dismiss after 5 seconds

### 9.9 Implement SSE Support (Optional)
- [x] Create `/api/events` SSE endpoint
- [x] Implement EventSource client hook
- [x] Push events: new feed items, alerts
- [x] Fallback to polling if SSE fails
- [x] Add SSE toggle in settings

### 9.10 Add Loading States
- [x] Show skeleton loaders during initial load
- [x] Show subtle spinner during poll refresh
- [x] Handle error states gracefully
- [x] Retry failed polls automatically

### 9.11 Optimize Performance
- [x] Debounce rapid updates
- [x] Batch multiple updates
- [x] Use React transitions for updates
- [x] Minimize re-renders
- [x] Profile and optimize if needed

### 9.12 Final Integration Testing
- [x] Verify all modules work together
- [x] Test 10-minute demo flow
- [x] Confirm deterministic behavior
- [x] Test role switching
- [x] Verify all navigation works

## Acceptance Criteria
- [x] Feed polls every 15 seconds (configurable)
- [x] "Updated X seconds ago" shows correctly
- [x] New items appear during demo session
- [x] Demo mode toggle works
- [x] Mock events are realistic
- [x] Visual feedback for new items
- [x] No polling when tab is hidden
- [x] SSE works as alternative (optional)

## Estimated Complexity
Medium

## Files to Create
```
components/
  realtime/
    RelativeTime.tsx
    NewItemIndicator.tsx
    DemoModeToggle.tsx
    UpdateNotification.tsx
lib/
  polling.ts
  mockEvents.ts
  sse.ts
hooks/
  usePolling.ts
  useSSE.ts
app/api/
  events/
    route.ts
  alerts/
    count/
      route.ts
```
