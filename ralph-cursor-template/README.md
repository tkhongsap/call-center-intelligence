# Ralph for Cursor - Template

Ralph is an autonomous AI development loop that implements PRD stories one at a time until complete. This template enables Ralph automation in Cursor IDE.

## Quick Setup

### 1. Copy to Your Project

```bash
# From your project root
cp -r path/to/ralph-cursor-template/.cursor .
cp -r path/to/ralph-cursor-template/ralph .
```

### 2. Create Your PRD

Create `ralph/prd.json` from your PRD document. You can ask the AI:

```
Convert my PRD to ralph/prd.json format
```

Or manually create it following `ralph/prd.json.example`.

### 3. Run Ralph

In Cursor chat, say:

```
Run Ralph
```

Or with custom max iterations:

```
Run Ralph with max 20 iterations
```

## Commands

| Command | Description |
|---------|-------------|
| `Run Ralph` | Start with default 10 iterations |
| `Run Ralph with max N iterations` | Start with custom max |
| `Resume Ralph` | Continue from where it stopped |
| `Stop Ralph` | Pause the loop |
| `Ralph status` | Show current state |

## How It Works

1. You say "Run Ralph" in Cursor chat
2. The AI reads `ralph/prd.json` to find the next incomplete story
3. Implements the story
4. Runs quality checks (typecheck, lint, test)
5. Commits if passing
6. Updates `prd.json` (marks story complete) and `progress.txt` (logs learnings)
7. Auto-continues to next story
8. Repeats until all stories complete or max iterations reached

## Files

| File | Purpose |
|------|---------|
| `.cursor/rules/ralph-loop.mdc` | Cursor rule - AI instructions for the loop |
| `ralph/prd.json` | Your user stories (create from template) |
| `ralph/prd.json.example` | Example PRD format |
| `ralph/.ralph-state.json` | Iteration tracking |
| `ralph/progress.txt` | Learnings and progress log |

## PRD Format

```json
{
  "project": "MyProject",
  "branchName": "ralph/feature-name",
  "description": "Feature description",
  "userStories": [
    {
      "id": "US-001",
      "title": "Story title",
      "description": "As a user, I want...",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

## Best Practices

### Small Stories

Each story should be completable in one iteration:
- Add a database table
- Create a UI component
- Add an API endpoint

Too big (split these):
- "Build the entire dashboard"
- "Add authentication"

### Clear Acceptance Criteria

Make criteria verifiable:
```json
"acceptanceCriteria": [
  "Button displays 'Submit' label",
  "Clicking button calls /api/submit",
  "Typecheck passes"
]
```

### Dependencies First

Order stories by dependency:
1. Database schema
2. API endpoints
3. UI components

### Browser Verification

For UI stories, include:
```json
"acceptanceCriteria": [
  "...",
  "Verify in browser at /page-url"
]
```

## Monitoring Progress

```bash
# Check story status
cat ralph/prd.json | jq '.userStories[] | {id, title, passes}'

# Check learnings
cat ralph/progress.txt

# Check Ralph state
cat ralph/.ralph-state.json

# Check git history
git log --oneline -10
```

## Troubleshooting

### Ralph stopped unexpectedly

Check `ralph/.ralph-state.json`:
- `paused` - Error occurred, check progress.txt
- `max_reached` - Increase max and say "Resume Ralph"

### Story keeps failing

1. Make acceptance criteria more specific
2. Check progress.txt for error patterns
3. Split into smaller stories

### Context getting too long

1. Say "Stop Ralph"
2. Start a new conversation
3. Say "Resume Ralph"

## Credits

Based on [Geoffrey Huntley's Ralph pattern](https://ghuntley.com/ralph/) and [Ryan Carson's implementation](https://x.com/ryancarson).
