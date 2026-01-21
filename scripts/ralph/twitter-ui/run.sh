#!/bin/bash
#
# Ralph Loop Runner for Twitter UI Redesign
#
# Usage: ./run.sh [max_iterations]
#
# This script runs the Ralph autonomous development loop to implement
# the Twitter-inspired UI redesign user stories defined in prd.json.
#

set -e

# Configuration
MAX_ITERATIONS=${1:-15}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
OUTPUT_FILE="/tmp/ralph-twitter-ui-output.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Ralph Loop - Twitter UI Redesign Implementation       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verify required files exist
if [ ! -f "$PRD_FILE" ]; then
    echo -e "${RED}Error: prd.json not found at $PRD_FILE${NC}"
    exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
    echo -e "${RED}Error: prompt.md not found at $PROMPT_FILE${NC}"
    exit 1
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
    echo "# Twitter UI Redesign - Ralph Progress Log" > "$PROGRESS_FILE"
    echo "# Started: $(date)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
fi

# Change to project root
cd "$PROJECT_ROOT"

# Count stories
TOTAL_STORIES=$(jq '.userStories | length' "$PRD_FILE")
echo -e "${YELLOW}Total stories to implement: $TOTAL_STORIES${NC}"
echo -e "${YELLOW}Max iterations: $MAX_ITERATIONS${NC}"
echo ""

# Main loop
for i in $(seq 1 $MAX_ITERATIONS); do
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Iteration $i of $MAX_ITERATIONS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

    # Check how many stories are complete
    COMPLETED=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")
    REMAINING=$((TOTAL_STORIES - COMPLETED))

    echo -e "${GREEN}Progress: $COMPLETED/$TOTAL_STORIES stories complete${NC}"
    echo -e "${YELLOW}Remaining: $REMAINING stories${NC}"
    echo ""

    # Check if all stories are done
    if [ "$REMAINING" -eq 0 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║     🎉 ALL STORIES COMPLETE! Twitter UI redesign done.   ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"

        # Log completion
        echo "" >> "$PROGRESS_FILE"
        echo "=== RALPH LOOP COMPLETE ===" >> "$PROGRESS_FILE"
        echo "Date: $(date)" >> "$PROGRESS_FILE"
        echo "Total iterations: $i" >> "$PROGRESS_FILE"
        echo "All $TOTAL_STORIES stories implemented successfully." >> "$PROGRESS_FILE"

        exit 0
    fi

    # Find next story to implement
    NEXT_STORY=$(jq -r '[.userStories[] | select(.passes == false)] | sort_by(.priority) | .[0] | "\(.id): \(.title)"' "$PRD_FILE")
    echo -e "${YELLOW}Next story: $NEXT_STORY${NC}"
    echo ""

    # Run Claude with the prompt
    echo -e "${BLUE}Starting Claude agent...${NC}"

    # Use claude with continue flag to maintain conversation context
    # The prompt is provided via stdin
    if cat "$PROMPT_FILE" | claude --continue 2>&1 | tee "$OUTPUT_FILE"; then
        echo -e "${GREEN}Claude iteration completed${NC}"
    else
        echo -e "${YELLOW}Claude exited with non-zero status${NC}"
    fi

    # Check for completion signal
    if grep -q "TWITTER UI COMPLETE" "$OUTPUT_FILE" 2>/dev/null; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║     ✅ Twitter UI Complete signal received!               ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
        exit 0
    fi

    # Small delay between iterations
    echo ""
    echo -e "${YELLOW}Pausing 5 seconds before next iteration...${NC}"
    sleep 5

done

echo ""
echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  ⚠️  Max iterations ($MAX_ITERATIONS) reached              ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"

# Log max iterations reached
echo "" >> "$PROGRESS_FILE"
echo "=== MAX ITERATIONS REACHED ===" >> "$PROGRESS_FILE"
echo "Date: $(date)" >> "$PROGRESS_FILE"
echo "Completed $COMPLETED of $TOTAL_STORIES stories." >> "$PROGRESS_FILE"

exit 1
