# Ralph Loop: My Experience Building an Autonomous AI Development System

This document contains article versions for Medium, LinkedIn, and X/Twitter about my experience building and using the Ralph autonomous development loop.

---

## MEDIUM ARTICLE

# I Built an Autonomous AI Agent That Implements Entire Features While I Sleep

## How the "Ralph Loop" pattern transformed my development workflow with AI coding assistants

### The Problem: Context Windows and AI Amnesia

If you've used AI coding assistants like Cursor, Claude Code, or Amp, you've hit the wall: context window limits. You're deep into implementing a feature, the AI has learned your codebase patterns, and suddenly... it forgets everything. You start over, re-explaining the same patterns, watching it make the same mistakes.

I spent months fighting this problem before discovering a pattern that changed everything.

### Enter Ralph: The Autonomous Development Loop

Ralph is named after Geoffrey Huntley's original concept. The core insight is simple but powerful:

**What if we designed AI development to work *with* context limits instead of against them?**

The answer: break features into small, atomic stories that each complete within a single context window, then run them in a loop with persistent memory between iterations.

### How It Works

```
┌─────────────────────────────────────────────────┐
│                 RALPH LOOP                       │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│   │  Fresh  │───>│  Pick   │───>│Implement│    │
│   │ Context │    │  Story  │    │  Story  │    │
│   └─────────┘    └─────────┘    └─────────┘    │
│        │              │              │          │
│        │         prd.json       Git Commit      │
│        │              │              │          │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│   │  Exit?  │<───│ Update  │<───│ Quality │    │
│   │         │    │  State  │    │ Checks  │    │
│   └─────────┘    └─────────┘    └─────────┘    │
│        │              │                         │
│        │        progress.txt                    │
│        └──────────────┘                         │
│         (Loop until all stories pass)           │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Each iteration:**
1. Spawns a fresh AI instance with clean context
2. Reads `prd.json` to find the next incomplete story
3. Reads `progress.txt` to learn patterns from previous iterations
4. Implements exactly ONE story
5. Runs quality checks (typecheck, lint, tests)
6. Commits if passing
7. Updates state files and appends learnings
8. Loops until complete

### The Key Innovation: Persistent Memory Without Persistent Context

Memory persists through three mechanisms:

**1. Git History** - Each successful story is committed. The next iteration sees the actual code changes.

**2. `prd.json`** - Tracks which stories are done (`passes: true/false`). The AI knows what's left.

**3. `progress.txt`** - An append-only log of learnings:

```markdown
## Codebase Patterns
- Use `sql<number>` template for aggregations
- Always use `IF NOT EXISTS` for migrations
- Export types from actions.ts for UI components

## 2024-01-22 - TB-003: Rewrite seed.ts
Files changed: lib/db/seed.ts
Learnings:
- Used weighted distribution for BU selection
- Created 3 predictive alert scenarios
Status: COMPLETE
```

This is the magic. Each iteration reads patterns discovered by previous iterations. The AI learns from itself across context boundaries.

### Story Sizing: The Critical Skill

The #1 factor in Ralph success is story sizing. Each story must complete in one context window.

**Right-sized stories:**
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic
- Add a filter dropdown to a list

**Too big (split these):**
- "Build the entire dashboard"
- "Add authentication"
- "Refactor the API"

**Rule of thumb:** If you can't describe the change in 2-3 sentences, it's too big.

### Two Implementations: Amp CLI and Cursor IDE

I built two versions:

**Amp CLI Version (`ralph.sh`):**
```bash
for i in $(seq 1 $MAX_ITERATIONS); do
  OUTPUT=$(cat prompt.md | amp --dangerously-allow-all)
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    exit 0
  fi
done
```

Each iteration is a fresh Amp process. True context isolation.

**Cursor IDE Version:**
The AI auto-continues within the same conversation, tracking state in `.ralph-state.json`:

```json
{
  "currentIteration": 5,
  "maxIterations": 10,
  "status": "running",
  "lastStoryCompleted": "US-005"
}
```

Commands: "Run Ralph", "Resume Ralph", "Stop Ralph"

### Real Results: Call Center Intelligence Dashboard

I used Ralph to build a complete call center intelligence dashboard with 9 modules:

| Story | Description | Result |
|-------|-------------|--------|
| PRD-01 | Project Setup | 2,139 seeded cases |
| PRD-02 | Cases Module | Filters, badges, share/escalate |
| PRD-03 | Alerts Module | Spike/threshold alerts |
| PRD-04 | Live Feed | Mixed card types, Pulse sidebar |
| PRD-05 | Trending | Topic scoring, predictions |
| PRD-06 | Semantic Search | NL queries, Cmd+K |
| PRD-07 | Chat Assistant | Intent parsing, actions |
| PRD-08 | Upload/Export | CSV/XLSX support |
| PRD-09 | Real-Time | Polling, SSE, demo mode |

**Total: 6 iterations to complete 6 stories for a mock data redesign.**

The progress log shows patterns accumulating:
- "Schema uses text columns - actual values defined in seed data"
- "Used weighted distribution for BU selection"
- "Simple array updates for businessUnits and categories"

Each learning helped subsequent iterations work faster.

### The PRD Skills: From Idea to Executable Tasks

I built two companion skills:

**PRD Generator (`/prd`):**
1. Takes a feature description
2. Asks 3-5 clarifying questions with lettered options
3. Generates structured PRD with user stories
4. Each story has verifiable acceptance criteria

**Ralph Converter (`/ralph`):**
1. Takes a PRD markdown file
2. Converts to `prd.json` format
3. Ensures correct dependency ordering
4. Validates story sizing

Example flow:
```
You: Create a PRD for task priority system

AI: Let me ask some clarifying questions:
1. What priority levels do you need?
   A. Simple (high/low)
   B. Standard (high/medium/low)
   C. Extended (urgent/high/medium/low/none)

You: 1B

AI: [Generates full PRD with 4 user stories]

You: Convert to Ralph format

AI: [Creates prd.json ready for autonomous execution]
```

### Browser Verification: UI Stories Need Visual Proof

Frontend stories include a critical acceptance criterion:
```
"Verify in browser using dev-browser skill"
```

Ralph uses browser automation to:
1. Navigate to the relevant page
2. Interact with UI elements
3. Confirm changes work visually
4. Take screenshots for the progress log

A UI story is NOT complete until browser verification passes.

### Lessons Learned

**1. Dependencies First**
Order matters. Schema changes before backend logic before UI components. If story #3 needs story #5's schema, Ralph fails.

**2. Verifiable Criteria**
"Works correctly" is useless. "Button shows confirmation dialog before deleting" is verifiable. Ralph needs to check boxes, not make judgments.

**3. Quality Gates Matter**
`npm run typecheck` after every change. Tests must pass before commits. Broken code compounds across iterations.

**4. The 80/20 of Learnings**
Most pattern discoveries happen in the first few iterations. The `## Codebase Patterns` section at the top of progress.txt captures the essential 20% that helps 80% of future work.

**5. Know When to Stop**
Sometimes a story is genuinely too complex. Ralph will get stuck. That's fine - the human reviews progress.txt, splits the story, and resumes.

### The Future: AGENTS.md and Institutional Memory

Beyond progress.txt, Ralph updates `AGENTS.md` files throughout the codebase:

```markdown
# AGENTS.md - /lib/db

## Patterns
- Migrations use IF NOT EXISTS for idempotency
- All queries return typed results via sql<Type>

## Gotchas
- SQLite doesn't support ALTER COLUMN - recreate table instead
```

These persist beyond any single Ralph run. They're institutional memory for the codebase itself.

### Try It Yourself

Ralph is open source. The core components:

1. `ralph.sh` - 80 lines of bash
2. `prompt.md` - Instructions for each iteration
3. `prd.json` - Your task list
4. `progress.txt` - Learning accumulator

The pattern works with any AI coding assistant that supports:
- Reading/writing files
- Running shell commands
- Following structured prompts

### Conclusion

Ralph isn't about replacing developers. It's about working *with* AI limitations instead of against them.

Context windows aren't bugs - they're features that force us to break work into atomic, verifiable chunks. Persistent memory isn't magic - it's just well-structured text files that survive across sessions.

The result: I can describe a feature, convert it to stories, and let Ralph implement it while I focus on higher-level thinking. Or sleep.

The AI does the typing. The human does the thinking. And progress.txt bridges the gap.

---

*Want to try Ralph? Check out the implementation at [repo link] or read Geoffrey Huntley's original article at ghuntley.com/ralph*

---
---

## LINKEDIN POST

### I Built an AI System That Implements Features Autonomously

After months of fighting context window limits in AI coding assistants, I discovered a pattern that changed my workflow: the **Ralph Loop**.

**The Problem:**
AI assistants forget everything when context fills up. You're deep into a feature, and suddenly... amnesia. Start over.

**The Solution:**
Break features into atomic stories, run them in a loop with persistent memory.

**How it works:**
1. Each iteration spawns a fresh AI with clean context
2. Reads `prd.json` to find the next incomplete story
3. Reads `progress.txt` to learn from previous iterations
4. Implements ONE story, runs quality checks, commits
5. Loops until complete

**The magic:** Memory persists through:
- Git history (actual code changes)
- prd.json (tracks what's done)
- progress.txt (accumulates learnings)

Each iteration reads patterns discovered by previous iterations. The AI learns from itself across context boundaries.

**Real results:**
Built a complete call center dashboard (9 modules, 2,139 seeded records) using this pattern. Progress log shows learnings accumulating:
- "Schema uses text columns - values defined in seed data"
- "Used weighted distribution for BU selection"
- "Simple array updates for filter components"

**Key insight:**
Context windows aren't bugs - they're features that force atomic, verifiable work. The human does the thinking. The AI does the typing. And progress.txt bridges the gap.

The pattern works with Cursor, Claude Code, Amp, or any AI assistant that can read/write files and run commands.

#AI #SoftwareEngineering #DeveloperProductivity #LLM #CodingAssistant #Automation

---
---

## X/TWITTER THREAD

**Thread: I built an autonomous AI agent that implements features while I sleep**

🧵 1/12

I've been fighting AI context window limits for months.

You're deep into a feature, the AI learns your codebase... then forgets everything.

I finally cracked it with a pattern called "Ralph Loop."

Here's how it works:

---

2/12

The insight: work WITH context limits, not against them.

Break features into atomic stories that each complete in one context window.

Run them in a loop with persistent memory between iterations.

---

3/12

Each iteration:
1. Fresh AI instance (clean context)
2. Read prd.json (find next story)
3. Read progress.txt (learn from past iterations)
4. Implement ONE story
5. Run quality checks
6. Commit if passing
7. Loop until done

---

4/12

Memory persists through 3 files:

**Git history** - actual code changes
**prd.json** - tracks which stories are done
**progress.txt** - accumulates learnings

The AI learns from itself across context boundaries.

---

5/12

progress.txt is the magic:

```
## Codebase Patterns
- Use sql<Type> for typed queries
- Always IF NOT EXISTS for migrations

## Story US-003
Learnings:
- Weighted distribution for seeding
Status: COMPLETE
```

---

6/12

Story sizing is CRITICAL.

Right-sized:
- Add a database column
- Add a UI component
- Update a server action

Too big (split these):
- "Build the entire dashboard"
- "Add authentication"

Rule: If you can't describe it in 2-3 sentences, split it.

---

7/12

I built two versions:

**Amp CLI:** Fresh process each iteration. True isolation.

**Cursor IDE:** Auto-continues in conversation, tracks state in .ralph-state.json

Commands: "Run Ralph", "Resume Ralph", "Stop Ralph"

---

8/12

Real results: Built a call center dashboard with 9 modules.

6 iterations, 6 stories completed.
2,139 seeded records.
Full typecheck, lint, tests passing.

All while I did other work.

---

9/12

UI stories need browser verification:

"Verify in browser using dev-browser skill"

Ralph navigates, clicks, confirms visually.

A UI story isn't done until the browser says so.

---

10/12

Key lessons:

1. Dependencies first (schema → backend → UI)
2. Verifiable criteria only ("shows dialog" not "works well")
3. Quality gates matter (typecheck EVERY change)
4. Know when to stop (some stories need human splitting)

---

11/12

This isn't about replacing developers.

Context windows force atomic, verifiable work.
progress.txt creates institutional memory.
Git captures actual results.

Human does thinking. AI does typing.

---

12/12

Ralph is ~80 lines of bash + prompt files.

Works with Cursor, Claude Code, Amp, or any AI that reads files and runs commands.

Based on @GeoffreyHuntley's original pattern.

The future of AI dev isn't bigger context windows - it's better loops.

---

**End of thread. Like/repost if this was useful!**

---
---

## SUMMARY & HASHTAGS

### Medium
- **Title:** I Built an Autonomous AI Agent That Implements Entire Features While I Sleep
- **Subtitle:** How the "Ralph Loop" pattern transformed my development workflow with AI coding assistants
- **Tags:** AI, Programming, Software Development, Automation, Productivity

### LinkedIn
- **Hashtags:** #AI #SoftwareEngineering #DeveloperProductivity #LLM #CodingAssistant #Automation

### X/Twitter
- **Hashtags:** #AI #DevTools #LLM #Coding #Automation
- **Mentions:** @GeoffreyHuntley (credit for original concept)

---

## OPTIONAL VISUALS TO CREATE

1. **Flowchart diagram** - The Ralph loop visualization (already exists in repo)
2. **Before/After comparison** - Manual AI dev vs Ralph loop
3. **progress.txt example** - Screenshot of real learnings accumulating
4. **prd.json structure** - Visual showing story → implementation flow
5. **Results dashboard** - Screenshot of completed call center app

---

*Document created: 2026-01-22*
*Based on Ralph implementation in call-center-intelligence repository*
