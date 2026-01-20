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
- [ ] Create `lib/polling.ts` utility
- [ ] Implement configurable polling interval (10-20s)
- [ ] Create custom hook `usePolling()`
- [ ] Handle polling start/stop on page visibility
- [ ] Clean up polling on unmount

### 9.2 Add Feed Polling
- [ ] Poll `/api/feed` for new items
- [ ] Compare with current feed state
- [ ] Detect new items
- [ ] Show "X new items" notification
- [ ] Animate new items into feed

### 9.3 Add Alert Count Polling
- [ ] Poll `/api/alerts/count` for badge updates
- [ ] Update alert badge in header
- [ ] Show badge animation on change

### 9.4 Implement Timestamp Display
- [ ] Create RelativeTime component
- [ ] Display "Updated X seconds ago"
- [ ] Auto-update timestamp every second
- [ ] Format: "Just now", "30s ago", "2m ago", "5m ago"
- [ ] Add to feed header

### 9.5 Build Mock Event Generator
- [ ] Create `lib/mockEvents.ts`
- [ ] Generate realistic mock events:
  - New case arrival
  - Alert triggered
  - Trending topic update
- [ ] Run on configurable interval
- [ ] Store generated events in database

### 9.6 Create Demo Mode Controls
- [ ] Add admin toggle in settings/header
- [ ] Create DemoModeToggle component
- [ ] Persist demo mode state
- [ ] Show indicator when demo mode active
- [ ] Control mock event generator

### 9.7 Implement Demo Mode Behavior
- [ ] When enabled:
  - Generate 1 event every 30-60 seconds
  - Ensure variety (alerts, cases, trends)
  - Create meaningful events (not random noise)
- [ ] When disabled:
  - Stop mock event generation
  - Normal polling only

### 9.8 Add Visual Feedback for Updates
- [ ] Create NewItemIndicator component
- [ ] Show toast/notification for new items
- [ ] Highlight newly added feed cards
- [ ] Add subtle animation
- [ ] Auto-dismiss after 5 seconds

### 9.9 Implement SSE Support (Optional)
- [ ] Create `/api/events` SSE endpoint
- [ ] Implement EventSource client hook
- [ ] Push events: new feed items, alerts
- [ ] Fallback to polling if SSE fails
- [ ] Add SSE toggle in settings

### 9.10 Add Loading States
- [ ] Show skeleton loaders during initial load
- [ ] Show subtle spinner during poll refresh
- [ ] Handle error states gracefully
- [ ] Retry failed polls automatically

### 9.11 Optimize Performance
- [ ] Debounce rapid updates
- [ ] Batch multiple updates
- [ ] Use React transitions for updates
- [ ] Minimize re-renders
- [ ] Profile and optimize if needed

### 9.12 Final Integration Testing
- [ ] Verify all modules work together
- [ ] Test 10-minute demo flow
- [ ] Confirm deterministic behavior
- [ ] Test role switching
- [ ] Verify all navigation works

## Acceptance Criteria
- [ ] Feed polls every 15 seconds (configurable)
- [ ] "Updated X seconds ago" shows correctly
- [ ] New items appear during demo session
- [ ] Demo mode toggle works
- [ ] Mock events are realistic
- [ ] Visual feedback for new items
- [ ] No polling when tab is hidden
- [ ] SSE works as alternative (optional)

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
