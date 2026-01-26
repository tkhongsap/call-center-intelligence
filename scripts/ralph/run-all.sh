#!/bin/bash
#
# Run All Ralph PRDs - Sequential execution of PRDs 01-09
# Usage: ./run-all.sh
#        MAX_ITERATIONS=30 ./run-all.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
MAX_ITERATIONS=${MAX_ITERATIONS:-50}
PAUSE_BETWEEN_PRDS=${PAUSE_BETWEEN_PRDS:-10}

# Change to project root for consistent execution
cd "$PROJECT_ROOT"

# PRDs to run (01-09, in order)
PRDS=(
  "prd/01-project-setup.json"
  "prd/02-cases-module.json"
  "prd/03-alerts-module.json"
  "prd/04-live-feed.json"
  "prd/05-trending-prediction.json"
  "prd/06-semantic-search.json"
  "prd/07-chat-assistant.json"
  "prd/08-upload-export.json"
  "prd/09-realtime-polish.json"
)

TOTAL_PRDS=${#PRDS[@]}
COMPLETED=0
FAILED=0
FAILED_PRDS=()

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Ralph Loop - Run All PRDs (01-09)                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Total PRDs to process:${NC} $TOTAL_PRDS"
echo -e "${BLUE}Max iterations per PRD:${NC} $MAX_ITERATIONS"
echo -e "${BLUE}Pause between PRDs:${NC} ${PAUSE_BETWEEN_PRDS}s"
echo ""

START_TIME=$(date +%s)

# Log batch start to progress file
echo "" >> "$PROGRESS_FILE"
echo "=== BATCH RUN STARTED ===" >> "$PROGRESS_FILE"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')" >> "$PROGRESS_FILE"
echo "PRDs to process: $TOTAL_PRDS" >> "$PROGRESS_FILE"
echo "Max iterations per PRD: $MAX_ITERATIONS" >> "$PROGRESS_FILE"
echo "" >> "$PROGRESS_FILE"

for i in "${!PRDS[@]}"; do
  prd="${PRDS[$i]}"
  prd_num=$((i + 1))

  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}  PRD $prd_num/$TOTAL_PRDS: $prd${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Run ralph.sh for this PRD
  if "$SCRIPT_DIR/ralph.sh" "$prd"; then
    echo ""
    echo -e "${GREEN}✓ Completed: $prd${NC}"
    COMPLETED=$((COMPLETED + 1))
    # Log success to progress file
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ COMPLETED: $prd" >> "$PROGRESS_FILE"
  else
    echo ""
    echo -e "${RED}✗ Failed: $prd${NC}"
    FAILED=$((FAILED + 1))
    FAILED_PRDS+=("$prd")
    # Log failure to progress file
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ FAILED: $prd" >> "$PROGRESS_FILE"

    # Ask whether to continue on failure
    echo -e "${YELLOW}Continue with remaining PRDs? (y/n)${NC}"
    read -r -t 10 response || response="y"
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
      echo -e "${RED}Aborting...${NC}"
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] BATCH ABORTED by user" >> "$PROGRESS_FILE"
      break
    fi
  fi

  # Pause between PRDs (except after the last one)
  if [ $prd_num -lt $TOTAL_PRDS ]; then
    echo -e "${BLUE}Pausing ${PAUSE_BETWEEN_PRDS}s before next PRD...${NC}"
    sleep "$PAUSE_BETWEEN_PRDS"
  fi

  echo ""
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                      Summary                                  ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Completed:${NC} $COMPLETED/$TOTAL_PRDS"
echo -e "${RED}Failed:${NC} $FAILED/$TOTAL_PRDS"
echo -e "${BLUE}Duration:${NC} ${MINUTES}m ${SECONDS}s"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed PRDs:${NC}"
  for prd in "${FAILED_PRDS[@]}"; do
    echo "  - $prd"
  done
  echo ""
fi

if [ $COMPLETED -eq $TOTAL_PRDS ]; then
  echo -e "${GREEN}🎉 All PRDs completed successfully!${NC}"
else
  echo -e "${YELLOW}⚠️  Some PRDs need attention${NC}"
fi

# Log batch summary to progress file
echo "" >> "$PROGRESS_FILE"
echo "=== BATCH RUN COMPLETED ===" >> "$PROGRESS_FILE"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')" >> "$PROGRESS_FILE"
echo "Completed: $COMPLETED/$TOTAL_PRDS" >> "$PROGRESS_FILE"
echo "Failed: $FAILED/$TOTAL_PRDS" >> "$PROGRESS_FILE"
echo "Duration: ${MINUTES}m ${SECONDS}s" >> "$PROGRESS_FILE"
if [ $FAILED -gt 0 ]; then
  echo "Failed PRDs:" >> "$PROGRESS_FILE"
  for prd in "${FAILED_PRDS[@]}"; do
    echo "  - $prd" >> "$PROGRESS_FILE"
  done
fi
echo "" >> "$PROGRESS_FILE"

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Run: npm run typecheck"
echo "  2. Run: npm run build"
echo "  3. Run: npm run dev"
echo "  4. Visit: http://localhost:3000"
echo ""
