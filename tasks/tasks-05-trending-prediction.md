# Task 05: Trending & Prediction

## Overview
Implement trending topic computation, trend scoring, and predicted risk cards.

## Priority
**5** (Enhances feed with predictive insights)

## Dependencies
- Task 01: Project Setup (database)
- Task 04: Live Feed (trending cards display)

## Functional Requirements Covered
- **FR36**: Compute trending topics by comparing term frequency (24h vs prev 24h, 7d vs prev 7d)
- **FR37**: Display Top 5 trending topics with impacted BUs and example cases
- **FR38**: Generate "trend score" using percent change with minimum count thresholds
- **FR39**: Display "Predicted Risk" cards when trends rise for 3 consecutive windows or approach thresholds
- **FR40**: At least 3 predicted risk cards appear on seed data with reasonable explanations

## Tasks

### 5.1 Implement Term Extraction
- [x] Create `lib/trending.ts`
- [x] Extract significant terms from case descriptions
- [x] Implement stop word removal
- [x] Extract bigrams (two-word phrases)
- [x] Normalize terms (lowercase, stemming optional)

### 5.2 Build Trend Computation
- [x] Count term frequency for time windows:
  - Last 24 hours
  - Previous 24 hours (24-48h ago)
  - Last 7 days
  - Previous 7 days (7-14d ago)
- [x] Calculate percent change: `(current - baseline) / baseline * 100`
- [x] Apply minimum count threshold (e.g., min 5 occurrences)
- [x] Rank by trend score (highest % increase first)

### 5.3 Calculate Trend Scores
- [x] Implement trend score formula:
  ```
  trend_score = percent_change * log(current_count + 1)
  ```
- [x] Apply velocity bonus for rapid growth
- [x] Cap maximum score to prevent outliers
- [x] Store computed scores in `trending_topics` table

### 5.4 Create Trending Topics View
- [x] Create `/trending` route (or section in home)
- [x] Display Top 5 trending topics
- [x] For each topic show:
  - Topic name/phrase
  - Trend score and direction
  - Percent change
  - Impacted BUs
  - Case count (current vs baseline)
  - 2-3 example cases
- [x] Add time window toggle (24h / 7d)

### 5.5 Implement Predicted Risk Detection
- [x] Detect trends rising for 3+ consecutive windows
- [x] Detect trends approaching alert thresholds (80%+ of threshold)
- [x] Create prediction explanations:
  - "This topic has increased for 3 consecutive days"
  - "At current rate, will trigger spike alert in ~2 days"
  - "Approaching threshold: 85 / 100 cases"

### 5.6 Build Predicted Risk Cards
- [x] Create PredictedRiskCard component
- [x] Header: Warning icon + "Predicted Risk"
- [x] Title: Topic + risk type
- [x] Body: Explanation of why flagged
- [x] Stats: Current trajectory visualization
- [x] Footer: [View trend] [Take action] buttons

### 5.7 Ensure Seed Data Contains Predictions
- [x] Verify seed data generates 3+ predicted risk scenarios
- [x] Create scenarios in seed:
  - Topic with 3-day consecutive increase
  - Topic at 85% of threshold
  - Topic with accelerating growth rate
- [x] Document predicted risk explanations

**Implemented Scenarios (in `lib/db/seed.ts` `seedPredictedRiskCases` function):**

1. **Wire Transfer (Consecutive Increase):**
   - Day 3: 2 cases → Day 2: 4 cases → Day 1: 7 cases → Today: 12 cases
   - Terms: "wire transfer", "failed", "international"
   - Triggers `consecutive_increase` prediction
   - Explanation: "wire transfer has increased for 4 consecutive days..."

2. **System Outage (Approaching Threshold):**
   - Baseline (days 7-14): ~24 cases
   - Current (days 0-7): ~88 cases (88% of 100 threshold)
   - Terms: "system outage", "transactions", "access"
   - Triggers `approaching_threshold` prediction
   - Explanation: "system outage is at 88 cases, approaching the alert threshold of 100..."

3. **Overdraft Fee (Accelerating Growth):**
   - Earlier growth: 3→4 (33% growth)
   - Recent growth: 9→15 (67% growth, much faster acceleration)
   - Terms: "overdraft fee", "charges", "balance"
   - Triggers `accelerating_growth` prediction
   - Explanation: "overdraft fee shows accelerating growth at 67% daily rate..."

### 5.8 Create API Routes
- [x] `GET /api/trending` - Get trending topics
- [x] `GET /api/trending/[topic]` - Get topic detail
- [x] `GET /api/predictions` - Get predicted risk items
- [x] `POST /api/trending/compute` - Trigger recomputation

### 5.9 Add Trend Visualization
- [x] Create TrendChart component
- [x] Show daily counts over time
- [x] Highlight baseline vs current periods
- [x] Show trend line direction

## Acceptance Criteria
- [x] Top 5 trending topics display with scores
- [x] Each topic shows impacted BUs and example cases
- [x] Trend scores reflect meaningful changes
- [x] At least 3 predicted risk cards appear
- [x] Predicted risks have reasonable explanations
- [x] Time window toggle works (24h/7d)
- [x] Trend chart visualizes data correctly

## Estimated Complexity
Medium-High

## Files to Create
```
app/
  trending/
    page.tsx
    [topic]/
      page.tsx
components/
  trending/
    TrendingList.tsx
    TrendingTopicCard.tsx
    TrendChart.tsx
    PredictedRiskCard.tsx
    PredictionExplanation.tsx
lib/
  trending.ts
  predictions.ts
app/api/
  trending/
    route.ts
    compute/
      route.ts
    [topic]/
      route.ts
  predictions/
    route.ts
```
