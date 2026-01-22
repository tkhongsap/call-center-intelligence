# Ralph Loop Command Bank

A collection of reusable Ralph Loop prompts for common development tasks. Copy, remix, and adapt these for your needs.

---

## Mobile Responsiveness

**Use case:** Make the app fully responsive for mobile devices

```bash
/ralph-loop "Make the Call Center Intelligence app fully mobile responsive.

## Priority Order (complete in sequence):

### 1. Sidebar Mobile Menu
- Add hamburger menu button to header (visible on screens < lg)
- Hide sidebar by default on mobile (< lg breakpoint)
- Create slide-out drawer for mobile navigation with overlay
- Add close button and click-outside-to-close
- Files: src/components/layout/Sidebar.tsx, src/components/layout/Header.tsx

### 2. Header Responsiveness
- Make search bar collapse to icon on mobile, expand on tap
- Stack or hide action buttons on small screens
- Ensure role switcher works on mobile
- File: src/components/layout/Header.tsx

### 3. Chat Drawer Mobile Mode
- Change from fixed w-96 to full-screen on mobile (< md)
- Add close button visible on mobile
- Ensure keyboard doesn't push content off-screen
- File: src/components/chat/ChatDrawer.tsx

### 4. Tables to Card View
- Cases list: Show as cards on mobile, table on lg+
- Alerts list: Show as cards on mobile, table on lg+
- Use existing card component patterns from feed
- Files: src/app/cases/page.tsx, src/app/alerts/page.tsx

### 5. Modal Responsiveness
- ShareModal: Full width on mobile with proper padding
- Any other modals: Ensure they don't overflow viewport
- Files: src/components/modals/*.tsx

## Technical Requirements:
- Use Tailwind breakpoints: sm (640px), md (768px), lg (1024px)
- Follow existing patterns: 'hidden lg:block', 'lg:hidden', 'flex-col lg:flex-row'
- Maintain the Twitter-inspired design aesthetic
- Test at 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)

## Quality Checks Before Each Commit:
- npm run typecheck (must pass)
- npm run lint (must pass)
- Visually verify at mobile viewport in browser

## Completion Criteria:
- All 5 priority items complete
- No horizontal scroll at 375px viewport
- All navigation accessible on mobile
- All interactive elements have touch-friendly sizing (min 44px tap targets)

Output <promise>MOBILE RESPONSIVE COMPLETE</promise> when ALL items are done and quality checks pass." --completion-promise "MOBILE RESPONSIVE COMPLETE" --max-iterations 15
```

---

## Template: Generic Feature Implementation

**Use case:** Adapt this template for any feature

```bash
/ralph-loop "Implement [FEATURE NAME].

## Tasks (complete in sequence):

### 1. [First Component]
- [Requirement 1]
- [Requirement 2]
- Files: [file paths]

### 2. [Second Component]
- [Requirement 1]
- [Requirement 2]
- Files: [file paths]

## Technical Requirements:
- [Framework/library constraints]
- [Coding patterns to follow]
- [Testing requirements]

## Quality Checks:
- npm run typecheck (must pass)
- npm run lint (must pass)
- [Additional checks]

## Completion Criteria:
- [List all acceptance criteria]

Output <promise>[COMPLETION PHRASE]</promise> when done." --completion-promise "[COMPLETION PHRASE]" --max-iterations [N]
```

---

## Tips for Writing Ralph Loop Prompts

1. **Be specific about files** - Include exact file paths so Ralph knows where to work
2. **Order tasks by dependency** - Complete prerequisites first
3. **Include quality gates** - Require typecheck/lint to pass before commits
4. **Set realistic iterations** - Complex features need 15-20, simple fixes need 5-10
5. **Use clear completion promises** - Make them unique and obvious
6. **Test viewports/scenarios** - Specify exact test conditions

---

## Adding New Prompts

When you create a successful Ralph Loop prompt, add it here with:
- **Use case:** When to use this prompt
- **The command:** The full `/ralph-loop` command
- **Notes:** Any lessons learned or gotchas
