# ThaiBev Mock Data Redesign - Ralph Iteration

## Context

You are implementing ThaiBev-themed mock data for the Call Center Intelligence Control Tower. This iteration is part of an automated Ralph loop that processes user stories one at a time.

## Companies Covered

- **ThaiBev** - Beer & Spirits (Chang, Mekhong, Sangsom)
- **Sermsuk** - Non-Alcoholic Beverages (est Cola, Crystal Water, 100 Plus)
- **Oishi** - Japanese Food & Beverage (Green Tea, Oishi Restaurants, Shabushi)
- **KFC Thailand** - Fast Food (delivery, dine-in, Colonel's Club)

## Your Task

1. **Read the PRD**: Load `scripts/ralph/thaibev-data/prd.json`
2. **Find next story**: Identify the highest priority story where `passes: false`
3. **Implement ONE story**: Complete only that single story
4. **Run quality checks**: Execute `npm run typecheck` and `npm run lint`
5. **Commit if passing**: Use message format `feat: [Story ID] - [Title]`
6. **Update PRD**: Set `passes: true` for the completed story
7. **Log progress**: Append learnings to `scripts/ralph/thaibev-data/progress.txt`

## Tech Stack Requirements

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Language**: TypeScript (strict mode)

## Quality Requirements

### Code Standards
- All code must pass `npm run typecheck`
- All code must pass `npm run lint`
- Use existing patterns from the codebase
- Follow existing file/folder conventions

### Data Verification
For data stories, verify by running:
- `npm run db:seed` - Should complete without errors
- Check browser at `http://localhost:3000/cases` - Should show ThaiBev data

## Commit Message Format

```
feat: TB-XXX - [Story Title]

- [Brief description of changes]
- [Files modified]
```

## Progress Logging

After completing a story, append to `scripts/ralph/thaibev-data/progress.txt`:

```
=== TB-XXX: [Title] ===
Date: [timestamp]
Files changed: [list]
Learnings: [any useful patterns or issues encountered]
Status: COMPLETE
---
```

## Stop Condition

When ALL stories in prd.json have `passes: true`, output:

```
<promise>THAIBEV DATA COMPLETE</promise>
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
