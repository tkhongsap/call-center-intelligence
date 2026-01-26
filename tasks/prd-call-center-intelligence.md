# PRD: Call Center Intelligence Control Tower

## 1. Introduction/Overview

The **Call Center Intelligence Control Tower** is a world-class dashboard that unifies customer service cases from multiple channels (phone, email, LINE, web) into a single system. Unlike traditional BI dashboards, it surfaces **what's happening now** through a social-media style live feed, trending topics, smart alerts, semantic search, and one-click sharing/escalation to management.

### Problem Statement

Call center teams currently lack a unified view of customer issues across channels and business units. Key challenges include:
- No real-time visibility into emerging issues or spikes
- Difficulty identifying trending problems before they escalate
- Manual effort required to share insights with management
- Scattered data across multiple systems makes pattern recognition difficult

### Target

Build a **fully functional prototype** (mock data, real workflows) to validate the product concept with PM/PO and stakeholders. The prototype must demonstrate:
- What the application does
- What decisions it enables
- What a "world-class call center experience" feels like (not Power BI vibes)

---

## 2. Goals

### Primary Outcomes

1. **Real-time Awareness**: Users can instantly answer:
   - "What's happening now?"
   - "What's trending?"
   - "What needs escalation?"

2. **Management Visibility**: Improve visibility through smart alerting and share/escalate workflows

3. **Product Validation**: PM/PO can validate scope via a working prototype (not slides)

### Measurable Objectives

- Complete a 10-minute demo showing all key workflows
- Feed loads in < 2 seconds on seeded dataset (~2k cases)
- Search returns results in < 2 seconds on 2k cases
- Deterministic demo mode works reliably every time

---

## 3. User Stories

### PM/PO (Admin)

- As a PM/PO, I want to see all BU data across all channels so that I can understand the overall health of customer service operations
- As a PM/PO, I want to configure alert rules and thresholds so that the system flags issues that matter to the business
- As a PM/PO, I want to toggle demo mode on/off so that I can run reliable demonstrations for stakeholders

### BU Manager

- As a BU Manager, I want to view only my BU's escalations and cases so that I can focus on issues relevant to my team
- As a BU Manager, I want to see trending topics within my BU so that I can proactively address emerging issues
- As a BU Manager, I want to share alerts and cases internally so that I can coordinate responses with my team

### Call Center Supervisor

- As a supervisor, I want to monitor incoming spikes in real-time so that I can adjust staffing or escalate as needed
- As a supervisor, I want to see urgent cases flagged automatically so that I can prioritize high-risk issues
- As a supervisor, I want to view queue health metrics so that I can manage operational efficiency

---

## 4. Functional Requirements

### Live Feed (FR1-FR10)

| ID | Requirement |
|----|-------------|
| FR1 | The system shall display a "Today Feed" as the home page showing alerts, trending topics, and highlights in a social-media card format |
| FR2 | The system shall display Alert cards showing spikes, threshold breaches, and urgent issues with title, reason, and action buttons |
| FR3 | The system shall display Trending cards showing rising topics with top phrases and sample cases |
| FR4 | The system shall display Highlight cards showing daily summaries like "Top 3 complaint themes" or "Hot BU today" |
| FR5 | The system shall display Upload cards when new case batches are ingested |
| FR6 | The feed shall update when filters change without page reload |
| FR7 | Clicking any feed item shall route to the relevant drilldown view |
| FR8 | The feed shall be deterministic with seed data (always shows meaningful items) |
| FR9 | Each feed card shall include "View cases", "Share", and "Escalate" action buttons |
| FR10 | The feed shall display a "Pulse" sidebar with KPI tiles, sparklines, word cloud, and quick filters |

### Real-Time Feel (FR11-FR15)

| ID | Requirement |
|----|-------------|
| FR11 | The system shall poll for feed updates, alert counts, and new cases every 10-20 seconds |
| FR12 | The system shall display "Updated X seconds ago" timestamp on the feed |
| FR13 | At least one "new activity" shall appear during a demo session |
| FR14 | Admin shall be able to toggle the mock event generator on/off |
| FR15 | The system shall optionally support SSE (server-sent events) for pushing feed updates |

### Semantic Search (FR16-FR20)

| ID | Requirement |
|----|-------------|
| FR16 | The system shall provide a global search bar visible on all pages |
| FR17 | The system shall accept natural language queries like "urgent refund cases last week" or "delivery delay trend in Food BU" |
| FR18 | Search results shall include matching cases with relevance ranking |
| FR19 | Search shall display suggested/auto-applied filters based on the query |
| FR20 | Search shall return results in < 2 seconds for 2k cases |

### Chat Assistant (FR21-FR25)

| ID | Requirement |
|----|-------------|
| FR21 | The system shall provide a chat drawer accessible from the right side (like Intercom) |
| FR22 | The assistant shall respond to questions like "What's happening today?" with structured card responses |
| FR23 | The assistant shall support intents: "show trends", "find cases about", "what's trending", "show urgent/escalation" |
| FR24 | Chat responses shall include action buttons like "Apply filter", "Open cases", "Share alert" |
| FR25 | The assistant shall be able to apply filters in the UI when requested (e.g., "Filter to BU Food, last 30 days") |

### Alerts & Escalation (FR26-FR35)

| ID | Requirement |
|----|-------------|
| FR26 | The system shall generate Spike alerts based on trend analysis |
| FR27 | The system shall generate Threshold alerts when counts exceed configured limits |
| FR28 | The system shall generate Urgency alerts based on severity and keywords (safety, legal) |
| FR29 | The system shall optionally generate Misclassification alerts when low severity cases contain risky keywords |
| FR30 | Each alert shall display: baseline vs current values, time window, sample cases, and contributing phrases |
| FR31 | Users shall be able to Share an alert with selectable recipients from a mock directory |
| FR32 | Users shall be able to add a note when sharing |
| FR33 | Users shall be able to Escalate an alert, marking it as escalated with increased priority |
| FR34 | Escalated items shall appear in a "Management Inbox" view |
| FR35 | All shares shall create an auditable record (who, to whom, when, note, link) |

### Trending & Prediction (FR36-FR40)

| ID | Requirement |
|----|-------------|
| FR36 | The system shall compute trending topics by comparing term frequency (last 24h vs previous 24h, last 7d vs previous 7d) |
| FR37 | The system shall display Top 5 trending topics with impacted BUs and example cases |
| FR38 | The system shall generate "trend score" using percent change with minimum count thresholds |
| FR39 | The system shall display "Predicted Risk" cards when trends rise for 3 consecutive windows or approach thresholds |
| FR40 | At least 3 predicted risk cards shall appear on seed data with reasonable explanations |

### Cases List & Detail (FR41-FR45)

| ID | Requirement |
|----|-------------|
| FR41 | The system shall display a filterable list of cases with columns: date, BU, channel, category, severity, status |
| FR42 | Cases with riskFlag=true shall display an "Urgent" badge |
| FR43 | Cases with needsReviewFlag=true shall display a "Needs Review" badge |
| FR44 | Case detail view shall display: full case info, timeline, AI summary (mock), and Share/Escalate buttons |
| FR45 | AI summary shall follow template: What happened, Impact, Suggested next action |

### Upload & Export (FR46-FR50)

| ID | Requirement |
|----|-------------|
| FR46 | Users shall be able to upload case data via CSV file |
| FR47 | After upload, the system shall create a "New batch uploaded" feed item |
| FR48 | After upload, the system shall recompute alerts and trending (simulated async) |
| FR49 | Upload errors shall include: row number, column, reason, suggested fix |
| FR50 | Users shall be able to export filtered cases to CSV and XLSX formats |

---

## 5. Non-Goals (Out of Scope)

The following are explicitly **not** included in this prototype:

| Item | Reason |
|------|--------|
| Real integration to TBCT / LINE / email gateway | Prototype uses mock data only |
| Real SSO/permissions | Use role switcher for demo purposes |
| Production ML models | Use deterministic mock + statistical trend logic |
| Complex ticket workflow engine | Focus on visibility, not ticket management |
| Real email/Teams/Slack delivery | Use in-app sharing and mock outbox |
| Mobile-responsive design | Desktop-first for prototype |
| Multi-language support | English only for prototype |
| Historical data beyond seed dataset | ~2k cases in seed data |

---

## 6. Design Considerations

### Screen Layout

**Home Page (`/home`)**
```
+----------------------------------+-------------+
|  [Search Bar]    [Role]  [Inbox] |             |
+----------------------------------+             |
|                                  |   PULSE     |
|       TODAY FEED                 |  SIDEBAR    |
|                                  |             |
|  +---------------------------+   | - KPI tiles |
|  | Alert Card               |   | - Sparkline |
|  | "Spike in BU X..."       |   | - Word cloud|
|  | [View] [Share] [Escalate]|   | - Filters   |
|  +---------------------------+   |             |
|                                  |             |
|  +---------------------------+   |             |
|  | Trending Card            |   |             |
|  | "Rising: Broken bottle"  |   |             |
|  +---------------------------+   |             |
|                                  |             |
+----------------------------------+-------------+
                                   | Chat Drawer |
                                   +-------------+
```

### Feed Card Types

1. **Alert Card**
   - Header: Alert type icon + severity color
   - Title: "Spike in BU X: Delivery Delay +65% vs last week"
   - Body: Human-readable explanation of why flagged
   - Footer: [View cases] [Share] [Escalate] buttons

2. **Trending Card**
   - Header: Fire icon + "Trending"
   - Title: Topic name with trend direction
   - Body: Top phrases, case count, sample case preview
   - Footer: [View cases] [Share] buttons

3. **Highlight Card**
   - Header: Pin icon + "Today's Highlight"
   - Body: Summary content (top themes, hot BU, etc.)
   - Footer: [Learn more] button

4. **Upload Card**
   - Header: Upload icon + timestamp
   - Body: "Upload batch added 120 new cases"
   - Footer: [View cases] button

### Information Architecture

| Route | Purpose |
|-------|---------|
| `/home` | Live Feed + Pulse sidebar + Search + Chat drawer |
| `/alerts` | Alert list with filters and drilldown |
| `/cases` | Case list with filters and export |
| `/cases/:id` | Case detail with timeline and share/escalate |
| `/uploads` | Upload interface with history and errors |
| `/inbox` | Received shares and escalations (management visibility) |
| `/search` | Semantic search results with suggested filters |

---

## 7. Technical Considerations (High-Level)

### Approach

- **Framework**: Next.js for full-stack prototype
- **Database**: SQLite with seed data (~2k cases, 15 BUs, multiple channels)
- **Real-time**: Polling (10-20s) or SSE for feed updates
- **Search**: Hybrid approach (full-text + keyword expansion) or embedding-based semantic search

### Key Technical Notes

- All data is mock/seeded; no external integrations required
- Seed data must guarantee: 2+ alerts, 3+ trending topics, 1+ predicted risk in default view
- URL-shareable state (filters encoded in URL)
- Deterministic demo mode for reliable demonstrations

*Note: Detailed API contracts and data models are available in the source PID document but omitted from this PRD per scope decisions.*

---

## 8. Success Metrics

### Demo Checklist (10-minute demo must cover)

| # | Scenario | Validation |
|---|----------|------------|
| 1 | Open Home | See Today Feed + trending + pulse sidebar |
| 2 | Click alert post | Case list filters to relevant cases |
| 3 | Open case detail | See flags + AI summary |
| 4 | Share case/alert | Appears in recipient's Inbox |
| 5 | Search "urgent refund last week" | Relevant cases + suggested filters appear |
| 6 | View Trending panel | See "Trending now" + "Predicted risks" |
| 7 | Upload CSV template | New cases appear + feed shows upload post |

### Performance Metrics

| Metric | Target |
|--------|--------|
| Home feed load time | < 2 seconds |
| Search response time | < 2 seconds on 2k cases |
| Demo mode reliability | 100% deterministic results |

---

## 9. Open Questions

The following items require PM/PO decisions before or during implementation:

| # | Question | Options/Notes |
|---|----------|---------------|
| 1 | What are the BU names and taxonomy (categories/subcategories)? | Need list of 15 BUs with category hierarchy |
| 2 | How should "Complaint" KPI be defined? | A) Category-based (certain categories = complaint) or B) Severity-based (high/critical = complaint) |
| 3 | What are the default alert thresholds and spike factors? | e.g., 50% increase = spike, 100 cases/day = threshold |
| 4 | Which sharing channels should be simulated? | A) In-app only, B) In-app + mock email, C) In-app + mock Teams/Slack |
| 5 | Which semantic search approach should be used? | A) Hybrid (full-text + keyword expansion) - faster to build, or B) Embedding-based - stronger demo |

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| BU | Business Unit - organizational division (e.g., Food, Retail) |
| Feed | Social-media style stream of cards showing alerts, trends, and highlights |
| Pulse | Sidebar showing KPIs, sparklines, and quick filters |
| Spike | Sudden increase in case volume or specific issue frequency |
| Trending | Topics showing increased mention frequency vs previous period |
| Escalation | Formal flag marking an issue for management attention |
| Risk Flag | Automated indicator that a case may need urgent attention |
