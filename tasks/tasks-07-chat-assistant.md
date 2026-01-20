# Task 07: Chat Assistant

## Overview
Build the chat drawer with an AI assistant that responds to questions and can apply filters in the UI.

## Priority
**7** (Enhanced UX feature)

## Dependencies
- Task 01: Project Setup
- Task 04: Live Feed (filter application)
- Task 06: Semantic Search (query understanding)

## Functional Requirements Covered
- **FR21**: Chat drawer accessible from right side (like Intercom)
- **FR22**: Respond to questions like "What's happening today?" with structured card responses
- **FR23**: Support intents: "show trends", "find cases about", "what's trending", "show urgent/escalation"
- **FR24**: Chat responses include action buttons like [Apply filter] [Open cases] [Share alert]
- **FR25**: Apply filters in UI when requested ("Filter to BU Food, last 30 days")

## Tasks

### 7.1 Create Chat Drawer UI
- [x] Create ChatDrawer component
- [x] Add floating chat button (bottom-right)
- [x] Implement slide-in drawer animation
- [x] Add close button and minimize option
- [x] Style like Intercom/modern chat widget

### 7.2 Build Message Components
- [x] Create ChatMessage component
- [x] Style user messages (right-aligned)
- [x] Style assistant messages (left-aligned)
- [x] Add timestamp display
- [x] Support markdown in responses

### 7.3 Implement Chat Input
- [x] Create ChatInput component
- [x] Add text input with send button
- [x] Support Enter to send
- [x] Add typing indicator
- [x] Clear input on send

### 7.4 Build Intent Recognition
- [x] Create `lib/chatIntents.ts`
- [x] Implement intent classification:
  - **show_trends**: "what's trending", "show trends"
  - **find_cases**: "find cases about X", "search for X"
  - **show_urgent**: "show urgent", "escalations needed"
  - **what_happening**: "what's happening", "today's summary"
  - **apply_filter**: "filter to BU X", "show only channel Y"
  - **general_question**: fallback for other queries
- [x] Extract entities (BU names, dates, topics)

### 7.5 Create Response Generators
- [x] Create `lib/chatResponses.ts`

#### show_trends Response
- [x] Return top 3 trending topics as cards
- [x] Include trend direction and percentage
- [x] Add [View all trends] button

#### find_cases Response
- [x] Search for matching cases
- [x] Return count + top 3 results
- [x] Add [See all results] button

#### show_urgent Response
- [x] Return urgent cases and alerts
- [x] Show counts by severity
- [x] Add [View urgent cases] button

#### what_happening Response
- [x] Return today's summary:
  - Total cases today
  - Active alerts count
  - Top trending topic
  - Notable highlights
- [x] Add quick action buttons

#### apply_filter Response
- [x] Confirm filter application
- [x] Show current filter state
- [x] Actually apply filter to main UI

### 7.6 Build Response Cards
- [x] Create ChatCard component
- [x] Support different card types:
  - Stats card (KPIs)
  - Case list card
  - Alert card
  - Trend card
- [x] Add action buttons to cards

### 7.7 Implement Filter Application
- [x] Create filter context/state management
- [x] Allow chat to update global filters
- [x] Show confirmation when filters applied
- [x] Add "Reset filters" option

### 7.8 Add Quick Actions
- [x] Create QuickActions component
- [x] Show suggested questions:
  - "What's happening today?"
  - "Show trending topics"
  - "Find urgent cases"
- [x] Display on empty chat state

### 7.9 Create Chat API
- [x] `POST /api/chat` - Process chat message
  - Accept message text
  - Return intent + response
  - Include action payloads

## Acceptance Criteria
- [x] Chat drawer opens from floating button
- [x] Messages display correctly (user/assistant)
- [x] "What's happening today?" returns summary
- [x] "Show trends" returns trending topics
- [x] "Find cases about refund" returns matching cases
- [x] "Filter to BU Food" applies filter in main UI
- [x] Response cards include action buttons
- [x] Actions work (navigate, apply filter)

## Estimated Complexity
Medium-High

## Files to Create
```
components/
  chat/
    ChatDrawer.tsx
    ChatMessage.tsx
    ChatInput.tsx
    ChatCard.tsx
    QuickActions.tsx
lib/
  chatIntents.ts
  chatResponses.ts
contexts/
  FilterContext.tsx
app/api/
  chat/
    route.ts
```
