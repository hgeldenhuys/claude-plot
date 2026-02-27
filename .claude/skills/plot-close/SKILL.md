---
name: plot-close
description: "Generate retrospective, capture learnings, and archive the story"
user-invocable: true
---

# /plot-close — Retrospective and Archive

You are executing `/plot-close` to finalize a completed story.

## Input

The user provides a story ID (e.g., `PLOT-001`). The story must be in `board/` with status `done`.

## Process

### Step 1: Read Story

Read `board/{STORY-ID}.md` to gather:
- Full context (title, why, requirements)
- Task completion details
- AC results with proof
- Timestamps

### Step 2: Generate Retrospective

Create `retros/{STORY-ID}.md` with this format:

```markdown
# Retrospective: {STORY-ID} — {title}

**Completed:** {date}
**Priority:** {priority}
**Tasks:** {N completed}
**ACs:** {N}/{N} passing

---

## Summary

{What was accomplished and why it matters — 2-3 sentences}

## What Went Well

- {Effective patterns, smooth workflows, good decisions}

## What Could Improve

- {Obstacles, inefficiencies, surprises — be honest}

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| {choice made} | {why} |

## Effort

| Task | Role | What |
|------|------|------|
| T-1 | backend | {brief description} |
| T-2 | test | {brief description} |
```

### Step 3: Extract Learnings

Identify tactical learnings from this story:
- Patterns that worked well
- Gotchas and pitfalls encountered
- Project-specific knowledge gained

Read `learnings.md`, then use `Edit` to append new learnings after the `---` separator:

```markdown
## {STORY-ID}: {title} ({date})
- {Learning 1}
- {Learning 2}
- {Learning 3}
```

If `learnings.md` exceeds 100 lines, consolidate older entries — merge related items, remove duplicates, tighten wording.

### Step 4: Archive Story

1. Read the full content of `board/{STORY-ID}.md`
2. Use `Edit` to change `status: done` to `status: archived` in the frontmatter
3. Use `Write` to create `archive/{STORY-ID}.md` with the full content (now with archived status)
4. Delete the original from `board/` using `Bash`: `rm board/{STORY-ID}.md`

### Step 5: Report

Tell the user:
- Retrospective location: `retros/{STORY-ID}.md`
- Number of learnings captured
- Story archived to: `archive/{STORY-ID}.md`
- Suggest: create a git commit with all changes

## Retrospective Quality

A good retrospective:
- Is **specific** — references actual files and decisions
- Is **actionable** — learnings can be applied to future stories
- Is **balanced** — celebrates successes AND identifies improvements
- Is **concise** — 1 page, not a novel

## Guidelines

- Don't inflate the retrospective — be honest
- Keep `learnings.md` lean — consolidate when it grows
- The archive is permanent — make sure the story file is complete
- If no real learnings, don't force it — skip the learnings step
- Include concrete metrics: files changed, tests written, tasks completed
