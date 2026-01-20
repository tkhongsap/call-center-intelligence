# Using Ralph in Cursor

Ralph is an autonomous AI development loop that implements PRD stories one at a time until complete. This guide explains how to use Ralph in Cursor IDE.

> **Note:** This is the Cursor IDE adaptation. For the original Amp CLI version, see [README.md](README.md).

## Prerequisites

1. A `ralph/prd.json` file with user stories (see `prd.json.example`)
2. A git repository for your project
3. Quality checks set up (typecheck, lint, tests)

## Quick Start

### 1. Create your PRD

Either manually create `ralph/prd.json` or ask the AI:
```
Convert tasks/prd-my-feature.md to ralph/prd.json format
```

### 2. Run Ralph

Simply say:
```
Run Ralph
```

Or with a custom max iteration count:
```
Run Ralph with max 15 iterations
```

### 3. Watch it work

Ralph will:
1. Initialize the state file
2. Pick the first incomplete story
3. Implement it
4. Run quality checks
5. Commit if passing
6. Update prd.json and progress.txt
7. Auto-continue to the next story
8. Repeat until complete or max iterations reached

## Commands

| Command | Description |
|---------|-------------|
| `Run Ralph` | Start Ralph with default 10 iterations |
| `Run Ralph with max N iterations` | Start with custom max |
| `Resume Ralph` | Continue from where it stopped |
| `Stop Ralph` | Pause the loop |
| `Ralph status` | Show current state |

## How It Works

### State Tracking

Ralph tracks its progress in `ralph/.ralph-state.json`:

```json
{
  "currentIteration": 5,
  "maxIterations": 10,
  "status": "running",
  "startedAt": "2024-01-20T10:00:00Z",
  "lastStoryCompleted": "US-005"
}
```

### Auto-Continuation

Unlike the original Ralph (which spawns new CLI processes), Cursor's Ralph auto-continues within the same conversation:

1. Complete story → increment iteration → check if more stories
2. If yes and under max → immediately start next story
3. No user interaction needed between iterations

### Stop Conditions

Ralph stops when:
- **All Complete**: Every story has `passes: true`
- **Max Reached**: Hit the iteration limit
- **Error**: Quality checks fail repeatedly
- **User Interrupt**: You say "stop ralph"

## Files

| File | Purpose |
|------|---------|
| `ralph/prd.json` | User stories with `passes` status |
| `ralph/progress.txt` | Learnings and progress log |
| `ralph/.ralph-state.json` | Iteration tracking |
| `ralph/prompt-cursor.md` | Instructions for the AI |
| `.cursor/rules/ralph-loop.mdc` | Cursor rule for automation |

## Best Practices

### 1. Small Stories

Each story should be completable in one iteration. Right-sized examples:
- Add a database table
- Create a UI component
- Add an API endpoint
- Implement a filter

Too big (split these):
- "Build the entire dashboard"
- "Add authentication"

### 2. Clear Acceptance Criteria

Each story needs verifiable criteria:
```json
{
  "acceptanceCriteria": [
    "Button displays 'Submit' label",
    "Clicking button calls API endpoint",
    "Loading spinner shows during request",
    "Typecheck passes"
  ]
}
```

### 3. Dependencies First

Order stories by dependency:
1. Database schema
2. API endpoints
3. UI components
4. Integration features

### 4. Browser Verification

For UI stories, include:
```json
{
  "acceptanceCriteria": [
    "...",
    "Verify in browser at /page-url"
  ]
}
```

Ralph will use Cursor's browser MCP to verify.

## Monitoring Progress

### Check story status
```bash
cat ralph/prd.json | jq '.userStories[] | {id, title, passes}'
```

### Check learnings
```bash
cat ralph/progress.txt
```

### Check git history
```bash
git log --oneline -10
```

### Check Ralph state
```bash
cat ralph/.ralph-state.json
```

## Troubleshooting

### Ralph stopped unexpectedly

Check `ralph/.ralph-state.json` for status:
- `paused` - Error occurred, check progress.txt
- `max_reached` - Increase max and resume

### Story keeps failing

1. Check the acceptance criteria - make them more specific
2. Check progress.txt for error patterns
3. Consider splitting the story into smaller pieces

### Context getting too long

If the conversation gets very long:
1. Say "Stop Ralph"
2. Start a new conversation
3. Say "Resume Ralph" - it will pick up from the state file

## Differences from Original Ralph

| Aspect | Original (Amp CLI) | Cursor Edition |
|--------|-------------------|----------------|
| Loop mechanism | Bash `for` loop | AI auto-continuation |
| Fresh context | New process each iteration | Same conversation |
| State tracking | prd.json + progress.txt | Same + .ralph-state.json |
| Browser testing | dev-browser skill | cursor-ide-browser MCP |
| Trigger | `./ralph.sh` | "Run Ralph" in chat |

## Example Session

```
You: Run Ralph with max 5 iterations

AI: ═══════════════════════════════════════════════════════
    Ralph Iteration 1 of 5
    ═══════════════════════════════════════════════════════
    
    Implementing US-001: Project setup and configuration
    [... implements story ...]
    ✓ Committed: feat: US-001 - Project setup and configuration
    
    ═══════════════════════════════════════════════════════
    Ralph Iteration 2 of 5
    ═══════════════════════════════════════════════════════
    
    Implementing US-002: Database schema
    [... implements story ...]
    ✓ Committed: feat: US-002 - Database schema
    
    [... continues automatically ...]
    
    Ralph completed all tasks!
    
    Summary:
    - Iterations used: 4 of 5
    - Stories completed: 4
    - See ralph/progress.txt for details
```
