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
    # Using --print for non-interactive mode
    echo "$PROMPT" | claude --dangerously-skip-permissions

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
    # This is a simple check - could be enhanced to parse task files
    # For now, we rely on Claude Code to signal completion
    return 1  # Continue by default
}

# Main loop
echo -e "${BLUE}Starting Ralph Loop...${NC}"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
    run_iteration $i

    # Check if we should continue
    if check_completion; then
        echo -e "${GREEN}✓ All tasks complete!${NC}"
        break
    fi

    # Pause between iterations (unless last)
    if [ $i -lt $MAX_ITERATIONS ]; then
        echo -e "${YELLOW}Pausing for $PAUSE_BETWEEN seconds...${NC}"
        sleep $PAUSE_BETWEEN
    fi
done

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
