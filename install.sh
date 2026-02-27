#!/usr/bin/env bash
# Plot Installer — install skills globally, init .plot/ in a project
#
# Usage:
#   bash install.sh                # Install skills globally + init .plot/ in CWD
#   bash install.sh --global       # Only install skills globally
#   bash install.sh --init         # Only init .plot/ in CWD
#   bash install.sh --init /path   # Init .plot/ in a specific directory
#   bash install.sh --uninstall    # Remove global skills

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GLOBAL_SKILLS="$HOME/.claude/skills"
TARGET_DIR=""
ACTION=""

# ─── Parse args ───────────────────────────────────────────

case "${1:-}" in
  --global)
    ACTION="global"
    ;;
  --init)
    ACTION="init"
    TARGET_DIR="${2:-$(pwd)}"
    ;;
  --uninstall)
    ACTION="uninstall"
    ;;
  --help|-h)
    echo "Plot Installer"
    echo ""
    echo "Usage:"
    echo "  bash install.sh                # Install globally + init .plot/ in CWD"
    echo "  bash install.sh --global       # Only install skills to ~/.claude/skills/"
    echo "  bash install.sh --init [path]  # Only init .plot/ in directory (default: CWD)"
    echo "  bash install.sh --uninstall    # Remove global skills"
    echo ""
    echo "What it does:"
    echo "  --global:    Copies plot-* skills to ~/.claude/skills/ (available everywhere)"
    echo "  --init:      Creates .plot/ folder with board, archive, retros, learnings"
    echo "  (no flag):   Both --global and --init in CWD"
    exit 0
    ;;
  "")
    ACTION="both"
    TARGET_DIR="$(pwd)"
    ;;
  *)
    echo "Unknown option: $1 (try --help)"
    exit 1
    ;;
esac

# ─── Install skills globally ─────────────────────────────

install_global() {
  echo "Installing Plot skills to $GLOBAL_SKILLS/ ..."

  mkdir -p "$GLOBAL_SKILLS"

  local count=0
  for skill_dir in "$SCRIPT_DIR/.claude/skills"/plot-*; do
    local name
    name="$(basename "$skill_dir")"
    if [ -d "$skill_dir" ] && [ -f "$skill_dir/SKILL.md" ]; then
      mkdir -p "$GLOBAL_SKILLS/$name"
      cp "$skill_dir/SKILL.md" "$GLOBAL_SKILLS/$name/SKILL.md"
      echo "  ✓ $name"
      count=$((count + 1))
    fi
  done

  echo "Installed $count skills globally."
  echo ""
  echo "Skills are now available in every Claude Code session."
  echo "Run 'claude' in any project and use /plot-ideate, /plot-plan, etc."
}

# ─── Init .plot/ in a project ─────────────────────────────

init_project() {
  local dir="$1"

  # Resolve to absolute path
  dir="$(cd "$dir" 2>/dev/null && pwd)" || {
    echo "Error: directory '$1' does not exist."
    exit 1
  }

  echo "Initializing .plot/ in $dir ..."

  if [ -d "$dir/.plot" ]; then
    echo "  .plot/ already exists — updating config if needed."
  fi

  mkdir -p "$dir/.plot/board" "$dir/.plot/archive" "$dir/.plot/retros"

  # Config — only create if missing
  if [ ! -f "$dir/.plot/board/config.yaml" ]; then
    local project_name
    project_name="$(basename "$dir")"
    local prefix
    prefix="$(echo "$project_name" | tr '[:lower:]-' '[:upper:]_' | cut -c1-8)"

    cat > "$dir/.plot/board/config.yaml" <<YAML
project: $project_name
prefix: $prefix
counter: 0

# Definition of Ready — checked before planning
ready_when:
  - "Why is clear — we know what problem this solves"
  - "At least 2 acceptance criteria"
  - "Priority is set"

# Definition of Done — checked before closing
done_when:
  - "All ACs pass with proof"
  - "Code compiles without errors"
  - "Tests pass"

# Conventions
roles: [backend, frontend, test, docs, ops]
max_agents: 3
YAML
    echo "  ✓ .plot/board/config.yaml (prefix: $prefix)"
  else
    echo "  · .plot/board/config.yaml (already exists, skipped)"
  fi

  # Learnings — only create if missing
  if [ ! -f "$dir/.plot/learnings.md" ]; then
    cat > "$dir/.plot/learnings.md" <<'MD'
# Learnings

Tactical learnings accumulated from completed stories. Newest first.

---
MD
    echo "  ✓ .plot/learnings.md"
  else
    echo "  · .plot/learnings.md (already exists, skipped)"
  fi

  # .gitkeep for empty dirs
  touch "$dir/.plot/archive/.gitkeep" "$dir/.plot/retros/.gitkeep"

  echo ""
  echo "Project initialized. Run 'claude' and use /plot-ideate to start."
}

# ─── Uninstall ────────────────────────────────────────────

uninstall_global() {
  echo "Removing Plot skills from $GLOBAL_SKILLS/ ..."

  local count=0
  for name in plot-ideate plot-plan plot-execute plot-verify plot-close plot-run; do
    if [ -d "$GLOBAL_SKILLS/$name" ]; then
      rm -rf "$GLOBAL_SKILLS/$name"
      echo "  ✓ removed $name"
      count=$((count + 1))
    fi
  done

  if [ "$count" -eq 0 ]; then
    echo "  No Plot skills found."
  else
    echo "Removed $count skills."
  fi
}

# ─── Execute ──────────────────────────────────────────────

case "$ACTION" in
  global)
    install_global
    ;;
  init)
    init_project "$TARGET_DIR"
    ;;
  uninstall)
    uninstall_global
    ;;
  both)
    install_global
    echo ""
    init_project "$TARGET_DIR"
    ;;
esac
