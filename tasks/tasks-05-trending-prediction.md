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
- [ ] Create `lib/trending.ts`
- [ ] Extract significant terms from case descriptions
- [ ] Implement stop word removal
- [ ] Extract bigrams (two-word phrases)
- [ ] Normalize terms (lowercase, stemming optional)

### 5.2 Build Trend Computation
- [ ] Count term frequency for time windows:
  - Last 24 hours
  - Previous 24 hours (24-48h ago)
  - Last 7 days
  - Previous 7 days (7-14d ago)
- [ ] Calculate percent change: `(current - baseline) / baseline * 100`
- [ ] Apply minimum count threshold (e.g., min 5 occurrences)
- [ ] Rank by trend score (highest % increase first)

### 5.3 Calculate Trend Scores
- [ ] Implement trend score formula:
  ```
  trend_score = percent_change * log(current_count + 1)
  ```
- [ ] Apply velocity bonus for rapid growth
- [ ] Cap maximum score to prevent outliers
- [ ] Store computed scores in `trending_topics` table

### 5.4 Create Trending Topics View
- [ ] Create `/trending` route (or section in home)
- [ ] Display Top 5 trending topics
- [ ] For each topic show:
  - Topic name/phrase
  - Trend score and direction
  - Percent change
  - Impacted BUs
  - Case count (current vs baseline)
  - 2-3 example cases
- [ ] Add time window toggle (24h / 7d)

### 5.5 Implement Predicted Risk Detection
- [ ] Detect trends rising for 3+ consecutive windows
- [ ] Detect trends approaching alert thresholds (80%+ of threshold)
- [ ] Create prediction explanations:
  - "This topic has increased for 3 consecutive days"
  - "At current rate, will trigger spike alert in ~2 days"
  - "Approaching threshold: 85 / 100 cases"

### 5.6 Build Predicted Risk Cards
- [ ] Create PredictedRiskCard component
- [ ] Header: Warning icon + "Predicted Risk"
- [ ] Title: Topic + risk type
- [ ] Body: Explanation of why flagged
- [ ] Stats: Current trajectory visualization
- [ ] Footer: [View trend] [Take action] buttons

### 5.7 Ensure Seed Data Contains Predictions
- [ ] Verify seed data generates 3+ predicted risk scenarios
- [ ] Create scenarios in seed:
  - Topic with 3-day consecutive increase
  - Topic at 85% of threshold
  - Topic with accelerating growth rate
- [ ] Document predicted risk explanations

### 5.8 Create API Routes
- [ ] `GET /api/trending` - Get trending topics
- [ ] `GET /api/trending/[topic]` - Get topic detail
- [ ] `GET /api/predictions` - Get predicted risk items
- [ ] `POST /api/trending/compute` - Trigger recomputation

### 5.9 Add Trend Visualization
- [ ] Create TrendChart component
- [ ] Show daily counts over time
- [ ] Highlight baseline vs current periods
- [ ] Show trend line direction

## Acceptance Criteria
- [ ] Top 5 trending topics display with scores
- [ ] Each topic shows impacted BUs and example cases
- [ ] Trend scores reflect meaningful changes
- [ ] At least 3 predicted risk cards appear
- [ ] Predicted risks have reasonable explanations
- [ ] Time window toggle works (24h/7d)
- [ ] Trend chart visualizes data correctly

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
