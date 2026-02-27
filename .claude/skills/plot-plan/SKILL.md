---
name: plot-plan
description: "Break a story into tasks with roles, dependencies, and AC coverage"
user-invocable: true
---

# /plot-plan — Story to Tasks

You are executing `/plot-plan` to decompose a story into actionable tasks.

## Input

The user provides a story ID (e.g., `PLOT-001`). The story must exist in `.plot/board/` with status `idea`.

## Process

### Step 1: Read Story

Read `.plot/board/{STORY-ID}.md` and extract:
- Acceptance criteria
- Requirements
- Why context

Also read `.plot/board/config.yaml` for conventions.

### Step 2: Explore Codebase

Use `Glob`, `Grep`, and `Read` to understand:
- Which files need to change
- Existing patterns and conventions
- Dependencies between modules
- Test infrastructure available

This is critical — tasks must be grounded in the actual codebase, not hypothetical.

### Step 3: Design Approach

Fill in the "Approach" section of the story with:
- Architecture decisions (with brief rationale)
- File-level change plan
- Any API contracts or schemas needed

### Step 4: Decompose into Tasks

Create 2-6 tasks following these rules:
- Each task is **atomic** — one role, one responsibility
- Each task maps to **at least one AC** via `covers`
- Every AC must be covered by **at least one task**
- Dependencies via `needs` form a **DAG** (no cycles)
- Tasks are ordered by dependency (T-1 before T-2 if T-2 needs T-1)

Task format in YAML frontmatter:

```yaml
tasks:
  - id: T-1
    do: "{clear, actionable description}"
    role: backend           # backend | frontend | test | docs | ops
    status: pending
    needs: []               # task IDs this depends on
    covers: [AC-1, AC-2]    # which ACs this satisfies
  - id: T-2
    do: "{description}"
    role: test
    status: pending
    needs: [T-1]
    covers: [AC-1, AC-2]
```

### Step 5: Ask for Decisions (if needed)

Use `AskUserQuestion` for architectural decisions only if genuinely ambiguous:
- "Should we use approach X or Y?"
- "New module or extend existing?"

### Step 6: Validate

Check:
- Every AC is covered by at least one task
- No orphan tasks (every task covers at least one AC)
- Dependencies are valid (no cycles)
- Role assignments make sense

### Step 7: Update Story File

Use `Edit` to update the story file:
- Set `status: planned`
- Update `updated` timestamp
- Add `tasks` array to frontmatter
- Fill in "Approach" section in the body

### Step 8: Report

Tell the user:
- Number of tasks created
- Task order with dependencies
- Role assignments
- Suggested next step: `/plot-execute {STORY-ID}`

## Role Assignment Guide

| Task Type | Role |
|-----------|------|
| Backend code, APIs, services, data | backend |
| UI components, styling, client-side | frontend |
| Tests, verification, quality | test |
| Documentation, READMEs | docs |
| Infrastructure, deployment, CI/CD | ops |

## Guidelines

- Prefer fewer, larger tasks (2-6 is ideal)
- Test tasks should depend on implementation tasks
- Group independent tasks that can run in parallel
- Don't create tasks for trivial changes — fold them into larger tasks
- The "Approach" section should be 1-3 paragraphs, not a design doc
