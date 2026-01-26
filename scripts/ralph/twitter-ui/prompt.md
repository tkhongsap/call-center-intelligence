# Twitter UI Redesign - Ralph Iteration

## Context

You are implementing the Twitter-inspired UI redesign for the Call Center Intelligence Control Tower. This iteration is part of an automated Ralph loop that processes user stories one at a time.

## Your Task

1. **Read the PRD**: Load `scripts/ralph/twitter-ui/prd.json`
2. **Find next story**: Identify the highest priority story where `passes: false`
3. **Implement ONE story**: Complete only that single story
4. **Run quality checks**: Execute `npm run typecheck` and `npm run lint`
5. **Commit if passing**: Use message format `feat: [Story ID] - [Title]`
6. **Update PRD**: Set `passes: true` for the completed story
7. **Log progress**: Append learnings to `scripts/ralph/twitter-ui/progress.txt`

## Design Reference

Refer to `docs/01-twitter-inspired-ui-redesign.md` for complete design specifications including:
- Color palette values
- Component specifications
- Layout proportions
- Interaction patterns

## Tech Stack Requirements

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS only (no CSS modules)
- **Icons**: lucide-react
- **Language**: TypeScript (strict mode)

## Quality Requirements

### Code Standards
- All code must pass `npm run typecheck`
- All code must pass `npm run lint`
- Use existing patterns from the codebase
- Components should be self-contained and reusable
- Follow existing file/folder conventions

### Visual Verification
For UI stories, verify in the browser at `http://localhost:3000`:
- Components render correctly
- Interactions work as expected
- No console errors
- Responsive behavior is correct

## Twitter Color Reference

```css
--twitter-blue: #1DA1F2
--twitter-blue-hover: #1a91da
--twitter-dark: #14171A
--twitter-gray: #657786
--twitter-light-gray: #AAB8C2
--twitter-extra-light: #E1E8ED
--twitter-bg: #F5F8FA
```

## Commit Message Format

```
feat: US-XXX - [Story Title]

- [Brief description of changes]
- [Files modified]
```

## Progress Logging

After completing a story, append to `scripts/ralph/twitter-ui/progress.txt`:

```
=== US-XXX: [Title] ===
Date: [timestamp]
Files changed: [list]
Learnings: [any useful patterns or issues encountered]
Status: COMPLETE
---
```

## Stop Condition

When ALL stories in prd.json have `passes: true`, output:

```
<promise>TWITTER UI COMPLETE</promise>
```

This signals the Ralph loop to terminate successfully.

## Error Handling

If a story cannot be completed:
1. Do NOT mark it as `passes: true`
2. Log the blocker in progress.txt
3. Continue to next iteration (Ralph will retry)

## Important Notes

- Each iteration starts with fresh context - rely on git history and progress.txt for memory
- Do not skip stories - process in priority order
- One story per iteration only
- Always verify quality gates before committing
- Frontend changes require visual verification before marking complete
