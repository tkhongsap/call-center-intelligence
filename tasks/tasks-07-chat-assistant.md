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
- [ ] Create ChatDrawer component
- [ ] Add floating chat button (bottom-right)
- [ ] Implement slide-in drawer animation
- [ ] Add close button and minimize option
- [ ] Style like Intercom/modern chat widget

### 7.2 Build Message Components
- [ ] Create ChatMessage component
- [ ] Style user messages (right-aligned)
- [ ] Style assistant messages (left-aligned)
- [ ] Add timestamp display
- [ ] Support markdown in responses

### 7.3 Implement Chat Input
- [ ] Create ChatInput component
- [ ] Add text input with send button
- [ ] Support Enter to send
- [ ] Add typing indicator
- [ ] Clear input on send

### 7.4 Build Intent Recognition
- [ ] Create `lib/chatIntents.ts`
- [ ] Implement intent classification:
  - **show_trends**: "what's trending", "show trends"
  - **find_cases**: "find cases about X", "search for X"
  - **show_urgent**: "show urgent", "escalations needed"
  - **what_happening**: "what's happening", "today's summary"
  - **apply_filter**: "filter to BU X", "show only channel Y"
  - **general_question**: fallback for other queries
- [ ] Extract entities (BU names, dates, topics)

### 7.5 Create Response Generators
- [ ] Create `lib/chatResponses.ts`

#### show_trends Response
- [ ] Return top 3 trending topics as cards
- [ ] Include trend direction and percentage
- [ ] Add [View all trends] button

#### find_cases Response
- [ ] Search for matching cases
- [ ] Return count + top 3 results
- [ ] Add [See all results] button

#### show_urgent Response
- [ ] Return urgent cases and alerts
- [ ] Show counts by severity
- [ ] Add [View urgent cases] button

#### what_happening Response
- [ ] Return today's summary:
  - Total cases today
  - Active alerts count
  - Top trending topic
  - Notable highlights
- [ ] Add quick action buttons

#### apply_filter Response
- [ ] Confirm filter application
- [ ] Show current filter state
- [ ] Actually apply filter to main UI

### 7.6 Build Response Cards
- [ ] Create ChatCard component
- [ ] Support different card types:
  - Stats card (KPIs)
  - Case list card
  - Alert card
  - Trend card
- [ ] Add action buttons to cards

### 7.7 Implement Filter Application
- [ ] Create filter context/state management
- [ ] Allow chat to update global filters
- [ ] Show confirmation when filters applied
- [ ] Add "Reset filters" option

### 7.8 Add Quick Actions
- [ ] Create QuickActions component
- [ ] Show suggested questions:
  - "What's happening today?"
  - "Show trending topics"
  - "Find urgent cases"
- [ ] Display on empty chat state

### 7.9 Create Chat API
- [ ] `POST /api/chat` - Process chat message
  - Accept message text
  - Return intent + response
  - Include action payloads

## Acceptance Criteria
- [ ] Chat drawer opens from floating button
- [ ] Messages display correctly (user/assistant)
- [ ] "What's happening today?" returns summary
- [ ] "Show trends" returns trending topics
- [ ] "Find cases about refund" returns matching cases
- [ ] "Filter to BU Food" applies filter in main UI
- [ ] Response cards include action buttons
- [ ] Actions work (navigate, apply filter)

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
