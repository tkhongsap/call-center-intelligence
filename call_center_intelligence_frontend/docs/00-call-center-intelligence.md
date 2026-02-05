Below is an updated **PID/PRD v2** that captures everything we discussed: **world-class “social feed” dashboard**, **real-time feel**, **trending + prediction**, **semantic search**, **chat-style insight assistant**, and **sharing/escalation**—while still staying realistic for a **mock-data but fully functional prototype (Next.js Option A)**.

---

# PID / PRD v2.0 — Call Center Intelligence Control Tower (World-Class Prototype)

## 0) One-liner

A **world-class Call Center Intelligence Control Tower** that unifies cases from multiple channels into a single system, then surfaces **what’s happening now** via a **social-media style feed**, **trending topics**, **smart alerts**, **semantic search**, and **one-click sharing/escalation** to management.

---

## 1) Purpose

Build a **fully functional prototype** (mock data, real workflows) to align PM/PO + stakeholders on:

* What the app is
* What decisions it enables
* What “world-class call center” experience feels like (not Power BI vibes)

**Prototype must be demo-ready**, deterministic, and easy to iterate on.

---

## 2) Goals (What success looks like)

### 2.1 Primary outcomes

1. Users can instantly answer:

   * “What’s happening now?”
   * “What’s trending?”
   * “What needs escalation?”
2. Management visibility improves through:

   * Smart alerting + “share/escalate” workflows
3. PM/PO can validate scope via a working product (not slides).

### 2.2 Non-goals (Prototype)

* Real integration to TBCT / LINE / email gateway
* Real SSO/permissions (use role switcher)
* Production ML (use deterministic mock + statistical trend logic)
* Complex ticket workflow engine

---

## 3) Users & Roles

### Roles (via Role Switcher)

1. **PM/PO (Admin View)**

   * Sees all BU, all channels, config panels (alert rules, thresholds)
2. **BU Manager**

   * BU-scoped view only, sees escalations, can share internally
3. **Call Center Supervisor**

   * Operational view: incoming spikes, urgent cases, queue health

---

## 4) Core Concept: Not a dashboard — a “Live Intelligence Feed”

The home experience should feel like **X/Twitter**:

* A **Today Feed** with highlights, alerts, trending topics, “breaking issues”
* Numbers still exist, but are **supporting context**, not the main show

---

## 5) Product Pillars (Features)

## 5.1 Home: “Live Feed” (World-class differentiator)

**Screen:** `/home` (or replace `/dashboard`)

### Layout (suggested)

* **Left/main column: “Today Feed”**

  * Cards that look like posts:

    * 🚨 Alert cards (spike, threshold, urgent)
    * 🔥 Trending topic cards
    * 📌 Highlight cards (“Top issue today”, “New emerging complaint”)
    * ✅ Resolution highlight cards (“Resolved major spike”, “SLA improved”)
* **Right sidebar: “Pulse”**

  * KPI tiles (small)
  * Mini trend sparkline
  * Word cloud
  * Quick filters
* **Top bar**

  * Semantic search bar (global)
  * Role switcher
  * Share inbox (sent shares) badge

### Feed Item types (must-have)

1. **Alert Post**

   * Title: “Spike in BU X: Delivery Delay +65% vs last week”
   * Why flagged (human readable)
   * CTA: “View cases” “Share” “Escalate”
2. **Trending Post**

   * “Trending: ‘Broken bottle’ mentions rising in last 24h”
   * Top phrases, sample cases
3. **Highlight Post**

   * “Today’s highlight: Top 3 complaint themes”
   * “Hot BU today”
4. **New Upload Post** (when ingestion happens)

   * “Upload batch added 120 new cases”

### Acceptance Criteria

* Feed updates when filters change
* Clicking any feed item routes to relevant drilldown
* Feed is deterministic with seed data (always shows meaningful items)

---

## 5.2 Real-time feel (without real integrations)

**Goal:** feels live and alive, even with mock data.

### Implementation options

* Prototype “real-time” by:

  1. **Polling every 10–20s** for feed updates, alerts count, new cases
  2. Optional **SSE** (server-sent events) for pushing feed updates
  3. A **mock event generator** that injects a few “new cases” periodically (toggleable in Admin)

### Acceptance Criteria

* Users see “Updated X seconds ago”
* At least one “new activity” appears during demo (toggle on/off)

---

## 5.3 Semantic Search (world-class usability)

**Screen:** Global search bar + `/search`

### What it should do

User types natural language:

* “urgent refund cases last week”
* “delivery delay trend in Food BU”
* “complaints about taste change”
* “show spike this month”
  The system returns:
* Matching cases
* Suggested filters applied
* Related topics / categories

### Prototype approach (practical)

Pick one approach (team can choose based on speed):

**Option A (fastest): Hybrid “semantic-like”**

* Full-text search + synonyms + keyword expansion
* Rule-based query parser (date range, severity, BU, channel)
* Example:

  * “urgent” → severity High/Critical
  * “refund” → category/keywords map
  * “last week” → date range

**Option B (stronger demo): Embedding-based semantic search**

* Precompute embeddings for `title + description + summaryText` during seed
* Store in DB (SQLite JSON) + use cosine similarity in app layer
* Lightweight embedding model in Node (or offline script) OR precomputed vectors shipped with seed

### Acceptance Criteria

* Search works in < 2 seconds on 2k cases
* Returns relevant results + auto-suggested filters
* At least 10 demo queries prepared with expected outcomes

---

## 5.4 “Ask the Control Tower” Chat Interface (Insight Assistant)

**Screen:** chat drawer on right side (like Intercom)

### What it does (prototype)

* User asks: “What’s happening today?”
* Assistant returns:

  * Top alerts
  * Top trending topics
  * Suggested drilldowns (buttons)
* User asks: “Filter to BU Food, last 30 days”

  * Assistant applies filters in UI

### Scope boundaries (prototype)

* Not a full LLM product; it’s an **intent router**:

  * parse intent → call internal APIs → render response cards
* Must support:

  * “show trends…”
  * “find cases about…”
  * “what’s trending…”
  * “show urgent/escalation…”

### Acceptance Criteria

* Chat responses are structured cards (not plain text only)
* Includes buttons like “Apply filter”, “Open cases”, “Share alert”

---

## 5.5 Alerts 2.0 (Visibility + escalation)

**Screens:** feed + `/alerts`

### Alert types

1. **Spike alert** (trend-based)
2. **Threshold alert** (count exceeds X)
3. **Urgency alert** (severity + keywords like safety/legal)
4. **Misclassification suspicion** (optional prototype feature)

   * Example: severity low but contains “injury / legal / refund”
   * Creates “Needs review” flag

### Alert explanation (“Why flagged”)

Always show:

* baseline vs current
* time window
* top sample cases
* top phrases that contributed

### Acceptance Criteria

* Alerts are stable/deterministic for demo
* Each alert has drilldown + share

---

## 5.6 Trending & Prediction (make it feel “alive”)

### “Trending Now”

Compute trending topics using simple, believable analytics:

* Compare term/category frequency in:

  * last 24h vs previous 24h
  * last 7 days vs previous 7 days
* Generate “trend score”:

  * z-score or percent change with minimum counts
* Output:

  * Top 5 trending topics
  * Top BUs impacted
  * Example cases

### “Prediction / What’s next” (prototype-friendly)

This can be **lightweight** but impressive:

* **Forecast next period** using moving average / exponential smoothing
* Surface “Likely to spike” if:

  * trend score rising for 3 consecutive windows
  * approaching threshold

### Acceptance Criteria

* Trending panel produces consistent results on seed data
* At least 3 “predicted risk” cards appear with reasonable explanations

---

## 5.7 Sharing & Escalation (critical business value)

This is your “management visibility” feature.

### Actions available on Alert and Case

* **Share** (internal share object; no real email needed)

  * Choose recipients (mock directory)
  * Add note
  * Generates share link
* **Escalate** (marks as escalated + priority)

  * Adds to “Management Inbox” view
  * Creates timeline entry

### Delivery channels (prototype)

* Phase 1 (must): In-app sharing + copy link
* Phase 2 (optional): send email via SMTP stub OR log to “Outbox”
* Phase 2 (optional): “Post to Teams/Slack” simulated webhook log

### Acceptance Criteria

* Sharing creates an auditable record:

  * who shared, to whom, when, what note
* Recipients can view shared item in “Inbox”

---

## 5.8 Cases: List + Detail (same as before but improved)

**Screens:** `/cases`, `/cases/:id`

### Improvements

* “Urgent” badge when riskFlag true
* “Needs review” badge for misclassification suspicion
* “Share/Escalate” buttons on case detail
* “AI summary” section (mock) with consistent template:

  * What happened
  * Impact
  * Suggested next action

---

## 5.9 Upload + Ingestion (same as before, but feed-aware)

**Screen:** `/uploads`

### Enhancements

* After successful upload:

  * create a “New batch uploaded” feed item
  * recompute alerts/trending (async simulated)
* Provide “Download sample template” button
* Upload errors include:

  * row number
  * column
  * reason
  * suggested fix

---

## 5.10 Exports & Reporting

* Export filtered cases to CSV/XLSX (must)
* “Snapshot report” PDF (optional)
* “Share report” creates share object with attached export (optional)

---

## 6) Information Architecture & Screens

1. `/home` — Live Feed + Pulse sidebar + Search + Chat drawer
2. `/alerts` — alert list + filter + drilldown
3. `/cases` — list + filters + export
4. `/cases/:id` — detail + timeline + share/escalate
5. `/uploads` — upload + history + errors
6. `/inbox` — received shares + escalations (management visibility)
7. `/search` — semantic search results + suggested filters

---

## 7) Data Model (Prototype)

### Case

* id, createdAt, BU, channel, category, subcategory, severity
* title, description, summaryText
* status, ownerTeam
* topicLabel, sentiment, riskFlag, needsReviewFlag
* tags (array)

### Alert

* id, createdAt, type, BU?, category?
* windowStart, windowEnd
* metricName, baselineValue, currentValue, trendScore
* reasonText, sampleCaseIds (array)

### Share

* id, createdAt, createdBy
* type: `CASE | ALERT | REPORT`
* targetId (caseId/alertId)
* recipients (array of mock users)
* message
* status: sent/read
* linkToken (for shareable URLs)

### Event (for real-time feel)

* id, createdAt, type: `NEW_CASE | NEW_UPLOAD | NEW_ALERT | ESCALATION`
* payload (json)

---

## 8) API Contracts (Internal)

Keep stable so real data can swap later.

* `GET /api/feed?filters…`

  * returns array of FeedItems (alerts, trending, highlights)
* `GET /api/pulse?filters…`

  * returns KPI mini tiles + sparklines
* `GET /api/trending?filters…`
* `GET /api/predictions?filters…`
* `GET /api/search?q=…&filters…`
* `GET /api/cases…`, `GET /api/cases/:id`
* `GET /api/alerts…`, `GET /api/alerts/:id`
* `POST /api/shares` (create share)
* `GET /api/inbox` (shares + escalations)
* `POST /api/escalate` (case/alert)
* `POST /api/uploads` (ingest)
* `GET /api/export?format=csv|xlsx`

---

## 9) Seed Data (Demo Design)

Must guarantee:

* Always shows:

  * ≥2 alerts in default last-30-days view
  * ≥3 trending topics
  * ≥1 predicted risk card
* Include:

  * 15 BUs
  * multiple channels
  * rich text for word cloud/search
* Include “misclassified” examples (low severity but risky keywords)

---

## 10) Non-Functional Requirements

* Load home feed in < 2s on seeded dataset (~2k cases)
* Deterministic demo mode (toggle real-time generator on/off)
* Clean UI (not overly BI)
* URL-shareable state (filters encoded)

---

## 11) Delivery Plan (2 sprints, prototype-first)

### Sprint 1: Core world-class UX foundations

* Home feed (static from computed feed API)
* Filters + pulse sidebar
* Cases list + detail
* Alerts list + drilldowns
* Sharing (in-app) + Inbox
* Seed data with guaranteed spikes

### Sprint 2: “Wow features”

* Semantic search (hybrid or embeddings)
* Chat insight assistant (intent routing)
* Trending + predictions
* Real-time feel (polling/SSE + mock event generator)
* Upload ingestion → feed post + recompute
* Export XLSX

---

## 12) Definition of Done (Demo Checklist)

In a 10-minute PM/PO demo, we must be able to:

1. Open Home → see Today Feed + trending + pulse
2. Click an alert post → case list filtered
3. Open a case detail → see flags + summary
4. Share the case/alert to “Management” → appears in Inbox
5. Search: “urgent refund last week” → relevant cases + suggested filters
6. Show “Trending now” + “Predicted risks”
7. Upload CSV template → new cases appear + feed shows upload post

---

## 13) Open Decisions for PM/PO

* BU names + taxonomy (categories/subcategories)
* “Complaint” KPI definition (category-based vs severity-based)
* Alert thresholds/spike factor defaults
* Which sharing channels to simulate (Email vs Teams vs in-app only)
* Semantic search approach (hybrid vs embeddings)

---

If you want, I can also produce a **“dev ticket pack”** from this PID (epics → stories → acceptance criteria per ticket) so your team can start building immediately without interpretation.
