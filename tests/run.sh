#!/usr/bin/env bash
# Plot Test Suite — runs headless Claude to validate skills
#
# Usage: cd plot && bash tests/run.sh
#
# Prerequisites:
#   - claude CLI on PATH
#   - Valid API credentials
#
# Each test invokes claude in headless mode (-p) with --dangerously-skip-permissions
# and verifies that the skill produced the expected file changes.

set -euo pipefail

PLOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PLOT_DIR"

PASS=0
FAIL=0
TESTS_RUN=0

pass() {
  PASS=$((PASS + 1))
  echo "  ✓ $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo "  ✗ $1"
}

check_file_exists() {
  if [ -f "$1" ]; then
    pass "$2"
  else
    fail "$2 (file not found: $1)"
  fi
}

check_file_contains() {
  if grep -q "$2" "$1" 2>/dev/null; then
    pass "$3"
  else
    fail "$3 (pattern '$2' not found in $1)"
  fi
}

# ─── Cleanup ──────────────────────────────────────────────

cleanup() {
  # Reset config counter
  if [ -f board/config.yaml ]; then
    sed -i '' 's/^counter: .*/counter: 0/' board/config.yaml 2>/dev/null || true
  fi
  # Remove test artifacts
  rm -f board/PLOT-*.md
  rm -f archive/PLOT-*.md
  rm -f retros/PLOT-*.md
}

# ─── Test 1: Ideate ──────────────────────────────────────

test_ideate() {
  echo ""
  echo "── Test 1: /plot-ideate ──"
  TESTS_RUN=$((TESTS_RUN + 1))

  cleanup

  claude -p "I want to add a function that calculates fibonacci numbers. Use /plot-ideate to create a story for this." \
    --output-format json \
    --max-turns 10 \
    --dangerously-skip-permissions \
    > /dev/null 2>&1 || true

  # Check story was created
  local story_file
  story_file=$(ls board/PLOT-*.md 2>/dev/null | head -1)

  if [ -n "$story_file" ]; then
    pass "Story file created: $(basename "$story_file")"
    check_file_contains "$story_file" "^id:" "Has id field"
    check_file_contains "$story_file" "status: idea" "Status is idea"
    check_file_contains "$story_file" "acceptance_criteria:" "Has acceptance criteria"
    check_file_contains "$story_file" "why:" "Has why field"
  else
    fail "No story file created in board/"
  fi
}

# ─── Test 2: Plan ────────────────────────────────────────

test_plan() {
  echo ""
  echo "── Test 2: /plot-plan ──"
  TESTS_RUN=$((TESTS_RUN + 1))

  cleanup
  # Place fixture
  cp tests/fixtures/sample-story.md board/PLOT-099.md

  claude -p "/plot-plan PLOT-099" \
    --output-format json \
    --max-turns 15 \
    --dangerously-skip-permissions \
    > /dev/null 2>&1 || true

  check_file_contains "board/PLOT-099.md" "status: planned" "Status changed to planned"
  check_file_contains "board/PLOT-099.md" "  - id: T-1" "Has at least one task"
  check_file_contains "board/PLOT-099.md" "role:" "Tasks have roles"
  check_file_contains "board/PLOT-099.md" "covers:" "Tasks have AC coverage"
}

# ─── Test 3: Verify (with pre-built story) ───────────────

test_verify() {
  echo ""
  echo "── Test 3: /plot-verify ──"
  TESTS_RUN=$((TESTS_RUN + 1))

  cleanup
  # Place fixture and set to verifying
  cp tests/fixtures/sample-story.md board/PLOT-099.md
  sed -i '' 's/status: idea/status: verifying/' board/PLOT-099.md

  claude -p "/plot-verify PLOT-099" \
    --output-format json \
    --max-turns 10 \
    --dangerously-skip-permissions \
    > /dev/null 2>&1 || true

  # Check that ACs have been evaluated (status changed from pending)
  if grep -q "status: pass\|status: fail" board/PLOT-099.md 2>/dev/null; then
    pass "ACs were evaluated"
  else
    fail "ACs still pending — verify didn't run"
  fi
}

# ─── Test 4: Close (with pre-built done story) ──────────

test_close() {
  echo ""
  echo "── Test 4: /plot-close ──"
  TESTS_RUN=$((TESTS_RUN + 1))

  cleanup
  # Place fixture as done
  cp tests/fixtures/sample-story.md board/PLOT-099.md
  sed -i '' 's/status: idea/status: done/' board/PLOT-099.md
  # Mark ACs as passing
  sed -i '' 's/status: pending/status: pass/' board/PLOT-099.md

  claude -p "/plot-close PLOT-099" \
    --output-format json \
    --max-turns 10 \
    --dangerously-skip-permissions \
    > /dev/null 2>&1 || true

  check_file_exists "retros/PLOT-099.md" "Retrospective generated"
  check_file_exists "archive/PLOT-099.md" "Story archived"

  # Board should no longer have it
  if [ ! -f board/PLOT-099.md ]; then
    pass "Story removed from board"
  else
    fail "Story still on board after close"
  fi
}

# ─── Run All ─────────────────────────────────────────────

echo "=== Plot Test Suite ==="
echo "Directory: $PLOT_DIR"
echo ""

test_ideate
test_plan
test_verify
test_close

cleanup

echo ""
echo "─────────────────────────"
echo "Tests: $TESTS_RUN | Pass: $PASS | Fail: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  echo "RESULT: FAIL"
  exit 1
else
  echo "RESULT: PASS"
  exit 0
fi
