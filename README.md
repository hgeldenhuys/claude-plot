# Plot — Lightweight Story-Driven SDLC

**Plot** is a minimal, zero-dependency SDLC that runs entirely inside Claude Code. No external CLI tools, no databases, no MCP servers — just skills, files, and folders.

## Quick Start

```bash
cd your-project

# Copy Plot into your project (or clone it)
git clone https://github.com/hgeldenhuys/claude-plot.git
cp -r claude-plot/.claude .claude
cp -r claude-plot/.plot .plot

# Start Claude and use the skills
claude
# /plot-ideate         — describe your idea
# /plot-plan PLOT-001  — break it into tasks
# /plot-execute PLOT-001 — spawn agents to build it
# /plot-verify PLOT-001  — verify with evidence
# /plot-close PLOT-001   — retrospective and archive
# /plot-run PLOT-001     — full pipeline at once
```

## How It Works

### The Board

The `.plot/board/` folder IS the board. Each `.md` file is a story.

```
.plot/
├── board/
│   ├── config.yaml     # Project config (prefix, counter, DoR, DoD)
│   ├── PLOT-001.md     # Active story
│   └── PLOT-002.md     # Another story
├── archive/            # Completed stories
├── retros/             # Retrospectives
└── learnings.md        # Accumulated tactical learnings
```

`ls .plot/board/PLOT-*.md` shows all active stories. That's your board view.

### Story Lifecycle

```
idea → planned → active → verifying → done → archived
```

| Status | Meaning |
|--------|---------|
| `idea` | Requirements and ACs defined, not yet planned |
| `planned` | Tasks created with roles and dependencies |
| `active` | Agents are working on tasks |
| `verifying` | Implementation done, collecting evidence |
| `done` | All ACs passing with proof |
| `archived` | Retrospective done, moved to `.plot/archive/` |

### Story Format

Markdown with YAML frontmatter. Short field names to save tokens:

```yaml
---
id: PLOT-001
title: "Add user authentication"
status: idea
priority: high
created: 2026-02-26T12:00:00Z
updated: 2026-02-26T12:00:00Z

acceptance_criteria:
  - id: AC-1
    what: "Login returns JWT on valid creds"
    status: pending     # pending | pass | fail
    proof: ""
  - id: AC-2
    what: "Invalid creds return 401"
    status: pending
    proof: ""

tasks:
  - id: T-1
    do: "Implement auth service"
    role: backend       # backend | frontend | test | docs | ops
    status: pending     # pending | active | done | skip
    needs: []           # dependency task IDs
    covers: [AC-1, AC-2]

why: "All endpoints are currently public."
---

## Requirements
...

## Approach
...

## Notes
...
```

## Skills

| Skill | Input | Output |
|-------|-------|--------|
| `/plot-ideate` | Rough idea | `.plot/board/PLOT-NNN.md` with status `idea` |
| `/plot-plan` | Story ID | Tasks added, status → `planned` |
| `/plot-execute` | Story ID | Agents spawned, status → `verifying` |
| `/plot-verify` | Story ID | ACs evaluated, status → `done` |
| `/plot-close` | Story ID | Retro generated, story → `.plot/archive/` |
| `/plot-run` | Story ID | Full pipeline with gates |

## Structure

```
your-project/
├── .plot/              # All Plot data (hidden, like .git/)
│   ├── board/          # Active stories + config
│   ├── archive/        # Completed stories
│   ├── retros/         # Retrospectives
│   └── learnings.md    # Accumulated tactical learnings
├── .claude/            # Claude Code project config
│   ├── CLAUDE.md       # Project instructions (Plot-aware)
│   ├── settings.json
│   └── skills/plot-*/SKILL.md  # The 6 Plot skills
└── tests/              # Optional: headless Claude test harness
```

## Config

`.plot/board/config.yaml`:

```yaml
project: my-project
prefix: PLOT
counter: 0

ready_when:           # Definition of Ready
  - "Why is clear"
  - "At least 2 ACs"
  - "Priority is set"

done_when:            # Definition of Done
  - "All ACs pass with proof"
  - "Code compiles"
  - "Tests pass"

roles: [backend, frontend, test, docs, ops]
max_agents: 3
```

## Testing

Run the headless test suite:

```bash
bash tests/run.sh
```

Tests invoke Claude in headless mode (`-p`) to validate each skill produces correct file changes.

## Design Principles

- **No dependencies.** Skills use only Claude Code built-in tools (Read, Write, Edit, Glob, Grep, Task, Bash).
- **Board = folder.** `ls .plot/board/` is your board view.
- **Stories are self-describing.** One file = all state.
- **Short field names.** `do` not `title`, `what` not `description`, `proof` not `evidence`. Saves tokens.
- **6 statuses.** No unnecessary states. `idea → planned → active → verifying → done → archived`.
- **Single learnings file.** No per-role memory overhead.
- **Hidden data folder.** `.plot/` keeps working data out of your project root, like `.git/`.

## Installing Into an Existing Project

1. Copy `.claude/skills/plot-*/` into your project's `.claude/skills/`
2. Copy `.plot/` into your project root
3. Add Plot info to your `.claude/CLAUDE.md`
4. Edit `.plot/board/config.yaml` (set project name, prefix)
5. `claude` — skills are discovered automatically
