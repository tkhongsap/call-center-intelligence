#!/bin/bash
#
# Ralph Loop - Autonomous Claude Code Development Loop
# Usage: ./ralph.sh prd/01-project-setup.json
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
MAX_ITERATIONS=${MAX_ITERATIONS:-50}
PAUSE_BETWEEN=${PAUSE_BETWEEN:-5}

# ═══════════════════════════════════════════════════════════════════════════════
# GitHub Issue Integration Functions
# ═══════════════════════════════════════════════════════════════════════════════

# Post comment to GitHub issue
gh_comment() {
    local message="$1"
    if [ -n "$GITHUB_ISSUE" ] && [ "$GITHUB_ISSUE" != "null" ]; then
        gh issue comment "$GITHUB_ISSUE" --body "$message" 2>/dev/null || true
    fi
}

# Update issue labels
gh_label() {
    local label="$1"
    if [ -n "$GITHUB_ISSUE" ] && [ "$GITHUB_ISSUE" != "null" ]; then
        gh issue edit "$GITHUB_ISSUE" --add-label "$label" 2>/dev/null || true
    fi
}

# Remove issue label
gh_remove_label() {
    local label="$1"
    if [ -n "$GITHUB_ISSUE" ] && [ "$GITHUB_ISSUE" != "null" ]; then
        gh issue edit "$GITHUB_ISSUE" --remove-label "$label" 2>/dev/null || true
    fi
}

# Close issue with comment
gh_close() {
    local message="$1"
    if [ -n "$GITHUB_ISSUE" ] && [ "$GITHUB_ISSUE" != "null" ]; then
        gh_comment "$message"
        gh issue close "$GITHUB_ISSUE" 2>/dev/null || true
    fi
}

# Notify loop start
gh_notify_start() {
    gh_label "in-progress"
    gh_comment "🚀 **Ralph Loop Started**

- **PRD:** $PRD_NAME
- **Max Iterations:** $MAX_ITERATIONS
- **Started:** $(date '+%Y-%m-%d %H:%M:%S')

_Autonomous development loop is now running..._"
}

# Notify progress update (every N iterations)
gh_notify_progress() {
    local iteration=$1
    local completed_count=$(jq '[.stories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "?")
    local total_count=$(jq '.stories | length' "$PRD_FILE" 2>/dev/null || echo "?")

    gh_comment "📊 **Progress Update - Iteration $iteration/$MAX_ITERATIONS**

- **Stories Completed:** $completed_count / $total_count
- **Timestamp:** $(date '+%Y-%m-%d %H:%M:%S')

_Loop continuing..._"
}

# Notify blocker encountered
gh_notify_blocker() {
    local blocker="$1"
    gh_label "needs-attention"
    gh_comment "🚧 **Blocker Encountered**

\`\`\`
$blocker
\`\`\`

_Loop will attempt to continue..._"
}

# Notify loop completion
gh_notify_complete() {
    gh_remove_label "in-progress"
    gh_close "✅ **Ralph Loop Completed**

- **Total Iterations:** $1
- **Completed:** $(date '+%Y-%m-%d %H:%M:%S')

All tasks have been implemented successfully!"
}

# Notify loop failure
gh_notify_failure() {
    local iteration=$1
    local error="$2"
    gh_label "needs-attention"
    gh_remove_label "in-progress"
    gh_comment "❌ **Ralph Loop Failed**

- **Failed at Iteration:** $iteration/$MAX_ITERATIONS
- **Timestamp:** $(date '+%Y-%m-%d %H:%M:%S')

\`\`\`
$error
\`\`\`

_Manual intervention may be required._"
}

# Validate arguments
if [ -z "$1" ]; then
    echo -e "${RED}Error: PRD file required${NC}"
    echo "Usage: ./ralph.sh prd/01-project-setup.json"
    exit 1
fi

PRD_FILE="$SCRIPT_DIR/$1"
if [ ! -f "$PRD_FILE" ]; then
    echo -e "${RED}Error: PRD file not found: $PRD_FILE${NC}"
    exit 1
fi

# Extract PRD info
PRD_NAME=$(basename "$PRD_FILE" .json)
TASK_FILE=$(jq -r '.taskFile' "$PRD_FILE")
GITHUB_ISSUE=$(jq -r '.githubIssue' "$PRD_FILE")

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Ralph Loop - Autonomous Builder               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}PRD:${NC} $PRD_NAME"
echo -e "${GREEN}Task File:${NC} $TASK_FILE"
echo -e "${GREEN}GitHub Issue:${NC} $GITHUB_ISSUE"
echo -e "${GREEN}Max Iterations:${NC} $MAX_ITERATIONS"
echo ""

# Log start
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting Ralph Loop for $PRD_NAME" >> "$PROGRESS_FILE"

# Change to project root
cd "$PROJECT_ROOT"

# Build the prompt
build_prompt() {
    local iteration=$1

    cat <<EOF
# Ralph Loop - Iteration $iteration of $MAX_ITERATIONS

You are in a Ralph Loop - an autonomous development cycle.

## Current PRD
$(cat "$PRD_FILE")

## Task File
Read and follow the tasks in: $TASK_FILE

## Prompt Instructions
$(cat "$PROMPT_FILE")

## Progress Log
Recent learnings and blockers:
$(tail -20 "$PROGRESS_FILE" 2>/dev/null || echo "No previous progress")

## Your Mission
1. Read the task file to understand what needs to be done
2. Implement the next incomplete task
3. Run tests/typecheck after changes
4. Log any learnings or blockers to progress

## Rules
- Focus on ONE task at a time
- Write working code, not placeholders
- Test your changes before marking complete
- If blocked, log the blocker and move on
- Be concise in responses

Start by reading the task file and implementing the next incomplete task.
EOF
}

# Run a single iteration
run_iteration() {
    local iteration=$1

    echo -e "${YELLOW}━━━ Iteration $iteration of $MAX_ITERATIONS ━━━${NC}"

    # Build prompt and run Claude Code
    PROMPT=$(build_prompt "$iteration")

    # Run Claude Code with the prompt
    # Using -p (--print) for non-interactive mode
    echo "$PROMPT" | claude -p --dangerously-skip-permissions

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Iteration $iteration completed${NC}"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Iteration $iteration completed successfully" >> "$PROGRESS_FILE"
    else
        echo -e "${RED}✗ Iteration $iteration failed with exit code $exit_code${NC}"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Iteration $iteration failed (exit code: $exit_code)" >> "$PROGRESS_FILE"
    fi

    return $exit_code
}

# Check if all tasks are complete
check_completion() {
    local task_file_path="$PROJECT_ROOT/$TASK_FILE"

    if [ ! -f "$task_file_path" ]; then
        echo -e "${RED}Task file not found: $task_file_path${NC}"
        return 1  # Continue if file not found
    fi

    # Count unchecked boxes (- [ ])
    # grep -c returns count to stdout, but exit code 1 if no matches
    local unchecked
    unchecked=$(grep -c '\- \[ \]' "$task_file_path" 2>/dev/null) || unchecked=0

    if [ "$unchecked" -eq 0 ]; then
        echo -e "${GREEN}All tasks complete in $TASK_FILE${NC}"
        return 0  # All complete
    else
        echo -e "${YELLOW}$unchecked tasks remaining in $TASK_FILE${NC}"
        return 1  # Continue
    fi
}

# Main loop
echo -e "${BLUE}Starting Ralph Loop...${NC}"
echo ""

# Notify GitHub of loop start
gh_notify_start

LAST_ITERATION=0
LOOP_SUCCESS=false

for i in $(seq 1 $MAX_ITERATIONS); do
    LAST_ITERATION=$i
    run_iteration $i
    iteration_result=$?

    # Post progress update every 5 iterations
    if [ $((i % 5)) -eq 0 ]; then
        gh_notify_progress $i
    fi

    # Handle iteration failure
    if [ $iteration_result -ne 0 ]; then
        gh_notify_failure $i "Iteration failed with exit code $iteration_result"
        break
    fi

    # Check if we should continue
    if check_completion; then
        echo -e "${GREEN}✓ All tasks complete!${NC}"
        LOOP_SUCCESS=true
        gh_notify_complete $i
        break
    fi

    # Pause between iterations (unless last)
    if [ $i -lt $MAX_ITERATIONS ]; then
        echo -e "${YELLOW}Pausing for $PAUSE_BETWEEN seconds...${NC}"
        sleep $PAUSE_BETWEEN
    fi
done

# If we exhausted all iterations without completing
if [ "$LOOP_SUCCESS" = false ] && [ $LAST_ITERATION -eq $MAX_ITERATIONS ]; then
    gh_notify_failure $MAX_ITERATIONS "Max iterations reached without completion"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Ralph Loop Complete                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Run: npm run typecheck"
echo "  2. Run: npm test"
echo "  3. Check: http://localhost:3000"
echo "  4. Close issue: gh issue close $GITHUB_ISSUE"
echo ""

# Log completion
echo "$(date '+%Y-%m-%d %H:%M:%S') - Ralph Loop completed for $PRD_NAME" >> "$PROGRESS_FILE"
