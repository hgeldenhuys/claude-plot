# Plot — Lightweight Story-Driven SDLC

**Plot** is a minimal, zero-dependency SDLC that runs entirely inside Claude Code. No external CLI tools, no databases, no MCP servers — just skills, files, and folders.

## Quick Start

```bash
cd plot
claude
# Then use the skills:
# /plot-ideate         — describe your idea
# /plot-plan PLOT-001  — break it into tasks
# /plot-execute PLOT-001 — spawn agents to build it
# /plot-verify PLOT-001  — verify with evidence
# /plot-close PLOT-001   — retrospective and archive
# /plot-run PLOT-001     — full pipeline at once
```

## How It Works

### The Board

The `board/` folder IS the board. Each `.md` file is a story.

```
board/
├── config.yaml     # Project config (prefix, counter, DoR, DoD)
├── PLOT-001.md     # Active story
├── PLOT-002.md     # Another story
└── PLOT-003.md     # ...
```

`ls board/PLOT-*.md` shows all active stories. That's your board view.

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
| `archived` | Retrospective done, moved to `archive/` |

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
| `/plot-ideate` | Rough idea | `board/PLOT-NNN.md` with status `idea` |
| `/plot-plan` | Story ID | Tasks added, status → `planned` |
| `/plot-execute` | Story ID | Agents spawned, status → `verifying` |
| `/plot-verify` | Story ID | ACs evaluated, status → `done` |
| `/plot-close` | Story ID | Retro generated, story → `archive/` |
| `/plot-run` | Story ID | Full pipeline with gates |

## Structure

```
plot/
├── board/           # Active stories + config
├── archive/         # Completed stories
├── retros/          # Retrospectives
├── learnings.md     # Accumulated tactical learnings
├── .claude/         # Claude project (skills + config)
│   ├── CLAUDE.md
│   ├── settings.json
│   └── skills/plot-*/SKILL.md
└── tests/           # Headless Claude test harness
```

## Config

`board/config.yaml`:

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
cd plot
bash tests/run.sh
```

Tests invoke Claude in headless mode (`-p`) to validate each skill produces correct file changes.

## Design Principles

- **No dependencies.** Skills use only Claude Code built-in tools (Read, Write, Edit, Glob, Grep, Task, Bash).
- **Board = folder.** `ls board/` is your board view.
- **Stories are self-describing.** One file = all state.
- **Short field names.** `do` not `title`, `what` not `description`, `proof` not `evidence`. Saves tokens.
- **6 statuses.** No unnecessary states. `idea → planned → active → verifying → done → archived`.
- **Single learnings file.** No per-role memory overhead.

## Copying to Another Project

Plot is standalone. To use it in a different project:

1. Copy the `plot/` folder into your project
2. Edit `board/config.yaml` (set project name, prefix)
3. `cd plot && claude` — skills are discovered automatically
