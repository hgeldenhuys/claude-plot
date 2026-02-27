# Plot — Lightweight Story-Driven SDLC

This project uses **Plot**, a minimal SDLC powered by Claude Code skills.

## How It Works

- **Board:** `board/` folder contains story files (Markdown + YAML frontmatter)
- **Archive:** `archive/` holds completed stories
- **Retros:** `retros/` holds retrospectives
- **Learnings:** `learnings.md` accumulates tactical learnings across stories

## Story Lifecycle

```
idea → planned → active → verifying → done → archived
```

## Skills

| Command | What it does |
|---------|-------------|
| `/plot-ideate` | Transform rough idea into story with acceptance criteria |
| `/plot-plan PLOT-NNN` | Break story into tasks with roles and dependencies |
| `/plot-execute PLOT-NNN` | Spawn agents to implement tasks |
| `/plot-verify PLOT-NNN` | Verify each AC with concrete evidence |
| `/plot-close PLOT-NNN` | Generate retrospective, capture learnings, archive |
| `/plot-run PLOT-NNN` | Full pipeline: plan → execute → verify → close |

## Story Format

Stories are Markdown files with YAML frontmatter in `board/`. Fields use short names:
- `do` (task title), `what` (AC description), `proof` (evidence)
- `needs` (dependencies), `covers` (AC coverage), `role` (agent type)

## Config

`board/config.yaml` holds project prefix, counter, Definition of Ready, and Definition of Done.

## Conventions

- Use Bun runtime
- Prefer for-loops over forEach
- No external CLI dependencies — skills use only built-in Claude Code tools
