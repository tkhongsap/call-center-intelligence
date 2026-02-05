# Twitter-Inspired UI Redesign Plan

## Summary

Transform the Call Center Intelligence Control Tower from an enterprise dashboard aesthetic to a Twitter-inspired social feed experience while maintaining full business functionality. The redesign focuses on creating a more engaging, dynamic interface with social-style interactions.

---

## Phase 1: Foundation - Design System Updates

### 1.1 Global CSS (`app/globals.css`)

Add Twitter color palette as CSS custom properties:

```css
:root {
  --twitter-blue: #1DA1F2;
  --twitter-blue-hover: #1a91da;
  --twitter-dark: #14171A;
  --twitter-gray: #657786;
  --twitter-light-gray: #AAB8C2;
  --twitter-extra-light: #E1E8ED;
  --twitter-bg: #F5F8FA;
}
```

Additional updates:
- Add engagement animations (heart pulse, bookmark fill)
- Add hover transition utilities
- Add Twitter-style focus rings

---

## Phase 2: New Base Components

### 2.1 Create Avatar Component (NEW)

**File:** `components/ui/Avatar.tsx`

- Icon avatar (for system cards - alert types)
- User avatar (image or initials)
- Sizes: sm (32px), md (40px), lg (48px)

### 2.2 Create EngagementBar Component (NEW)

**File:** `components/feed/EngagementBar.tsx`

- Horizontal row of action buttons with icons
- Hover color transitions to Twitter blue
- Actions by card type:
  - **Alert:** View Cases | Acknowledge | Bookmark | Share | Escalate
  - **Trending:** View Cases | Watch | Bookmark | Share
  - **Highlight:** Learn More | Bookmark | Share
  - **Upload:** View Batch | Bookmark

### 2.3 Create TwitterCard Base Component (NEW)

**File:** `components/feed/TwitterCard.tsx`

```
+------------------------------------------+
|  [Avatar]  Author Name       · 2h ago   |
|           @handle or subtitle           |
+------------------------------------------+
|  Content area (flexible)                |
+------------------------------------------+
|  [Actions via EngagementBar]            |
+------------------------------------------+
```

---

## Phase 3: Sidebar Redesign

### 3.1 Update Sidebar (`components/layout/Sidebar.tsx`)

**Changes:**

1. Light background option (white/slate-50 instead of slate-900)
2. Pill-shaped hover states for nav items
3. Larger icons (24px) with bolder active states
4. Add prominent "New Alert" compose button (Twitter blue)
5. User section at bottom with avatar and role

**Nav Item Style:**

```tsx
<Link className="flex items-center gap-5 px-4 py-3 rounded-full
  hover:bg-slate-100 transition-colors text-lg">
```

---

## Phase 4: Header Updates

### 4.1 Update Header (`components/layout/Header.tsx`)

- Add `backdrop-blur-md` for sticky blur effect
- Simplify to: Back arrow (when needed) | Title | Icons
- Twitter-style bell icon for notifications

---

## Phase 5: Feed Card Refactors

### 5.1 AlertFeedCard (`components/feed/AlertFeedCard.tsx`)

- Use TwitterCard base
- Avatar = Alert type icon (TrendingUp/AlertTriangle/etc.)
- Author = "System Alert"
- AuthorSub = `@alerts · ${businessUnit}`
- Content = Description + inline stats
- Footer = EngagementBar

### 5.2 TrendingCard (`components/feed/TrendingCard.tsx`)

- Avatar = Flame icon (orange bg)
- Author = Topic name
- AuthorSub = `${caseCount} cases · Trending`
- Hashtag-style pills for top phrases
- Sample case as "quoted tweet" nested card

### 5.3 HighlightCard (`components/feed/HighlightCard.tsx`)

- Avatar = Pin/Insight icon
- Author = "Daily Digest"
- Compact inline metrics

### 5.4 UploadCard (`components/feed/UploadCard.tsx`)

- Avatar = Upload icon with status color
- Author = Uploader name
- Prominent status badge and case count

---

## Phase 6: Pulse Sidebar → "What's Happening"

### 6.1 PulseSidebar Redesign (`components/pulse/PulseSidebar.tsx`)

1. Add search box at top (pill-shaped)
2. "What's happening" section header
3. Trending topics list (compact: category, topic, count)
4. "Teams to Watch" section (active BUs)
5. Compact KPI tiles with inline trends
6. "Show more" links

---

## Phase 7: Layout Updates

### 7.1 HomeContent (`components/feed/HomeContent.tsx`)

- Column widths: 600px feed | 350px right rail
- Remove white card wrapper around feed
- Cards should be individual units

### 7.2 Home Page (`app/home/page.tsx`)

- Sticky "Home" header with icon
- Full-width cards on mobile

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/globals.css` | Twitter color palette, animations |
| `components/layout/Sidebar.tsx` | Light theme, pill nav, compose button |
| `components/layout/Header.tsx` | Blur effect, simplified layout |
| `components/feed/AlertFeedCard.tsx` | Use TwitterCard pattern |
| `components/feed/TrendingCard.tsx` | Use TwitterCard pattern |
| `components/feed/HighlightCard.tsx` | Use TwitterCard pattern |
| `components/feed/UploadCard.tsx` | Use TwitterCard pattern |
| `components/feed/HomeContent.tsx` | Layout proportions |
| `components/pulse/PulseSidebar.tsx` | "What's Happening" style |

## New Files to Create

| File | Purpose |
|------|---------|
| `components/ui/Avatar.tsx` | Reusable avatar (icon/image) |
| `components/feed/EngagementBar.tsx` | Action buttons row |
| `components/feed/TwitterCard.tsx` | Base card layout |
| `components/ui/BookmarkButton.tsx` | Persistent bookmark toggle |

---

## Color Reference

| Element | Current | Twitter-Inspired |
|---------|---------|------------------|
| Primary Action | `bg-blue-600` | `bg-[#1DA1F2]` |
| Sidebar BG | `bg-slate-900` | `bg-white` |
| Card Hover | none | `hover:bg-gray-50` |
| Borders | `border-slate-200` | `border-[#E1E8ED]` |
| Body Text | `text-slate-600` | `text-[#14171A]` |
| Secondary | `text-slate-500` | `text-[#657786]` |

---

## Implementation Order

1. **Foundation:** globals.css + Avatar + EngagementBar + TwitterCard
2. **Sidebar:** Redesign with light theme and compose button
3. **Header:** Add blur effect and simplify
4. **Feed Cards:** Refactor all 4 card types to use TwitterCard
5. **Right Rail:** Transform PulseSidebar to "What's Happening"
6. **Polish:** Animations, hover states, responsive fixes

---

## Verification

1. `npm run lint` - Should pass
2. `npm run typecheck` - Should pass
3. `npm run build` - Should succeed
4. Manual testing at `http://localhost:3000`:
   - Verify sidebar navigation works
   - Verify all feed cards display correctly
   - Verify engagement actions (share, bookmark) work
   - Verify responsive layout on mobile
   - Verify "What's Happening" sidebar displays metrics
