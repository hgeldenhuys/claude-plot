---
name: plot-run
description: "Run a story through the full pipeline: plan → execute → verify → close"
user-invocable: true
---

# /plot-run — Full Pipeline

You are executing `/plot-run` to take a story through its complete lifecycle.

## Input

The user provides a story ID (e.g., `PLOT-001`).

Optional flags after the story ID:
- `--from <phase>` — Start from a specific phase: `plan`, `execute`, `verify`, `close`
- `--stop <phase>` — Stop after a specific phase

Examples:
```
/plot-run PLOT-001                    # Full: plan → execute → verify → close
/plot-run PLOT-001 --from execute     # Resume from execute
/plot-run PLOT-001 --stop verify      # Plan + execute + verify, skip close
```

## Process

### Step 0: Determine Pipeline

Read `.plot/board/{STORY-ID}.md` and determine entry point from status:

| Story Status | Default Start |
|---|---|
| `idea` | plan |
| `planned` | execute |
| `active` | verify |
| `verifying` | verify |
| `done` | close |

Override with `--from` flag if provided. Build the pipeline:

```
plan → execute → verify → close
```

Trim based on start point and `--stop` flag. Report the pipeline:

```
Pipeline: plan → execute → verify → close
Story: PLOT-001 — {title}
Starting at: plan (current status: idea)
```

### Step 1: PLAN Phase

**Gate in:** Status is `idea`
**Gate out:** Status is `planned`, tasks array populated

Execute the `/plot-plan` logic:
1. Read story ACs, requirements, why
2. Explore codebase
3. Write "Approach" section
4. Create 2-6 tasks covering all ACs
5. Validate coverage
6. Set status to `planned`

**Gate check:** Tasks exist? All ACs covered? Status is `planned`?
If gate fails → STOP and report.

### Step 2: EXECUTE Phase

**Gate in:** Status is `planned`
**Gate out:** All tasks done, status is `verifying`

Execute the `/plot-execute` logic:
1. Set status to `active`
2. Group tasks by dependency phase
3. Spawn agents in parallel per phase
4. Update task statuses in story file
5. Set status to `verifying`

**Gate check:** All tasks done?
If any task failed → STOP and report.

### Step 3: VERIFY Phase

**Gate in:** Status is `verifying` or `active`
**Gate out:** All ACs passing, status is `done`

Execute the `/plot-verify` logic:
1. Run DoD basics (compile, test)
2. Verify each AC with proof
3. Update AC statuses in story
4. Set status to `done` if all pass

**Gate check:** All ACs passing? DoD met?
If any AC fails → STOP and report.

### Step 4: CLOSE Phase

**Gate in:** Status is `done`
**Gate out:** Retrospective generated, story archived

Execute the `/plot-close` logic:
1. Generate retrospective
2. Extract learnings
3. Archive story

### Step 5: Final Report

```
## Plot Run: {STORY-ID} — {title}

### Pipeline
plan ✓ → execute ✓ → verify ✓ → close ✓

### Summary
- Tasks: {N} completed
- ACs: {N}/{N} passing
- Retro: .plot/retros/{STORY-ID}.md
- Archived: .plot/archive/{STORY-ID}.md

### Learnings Captured
- {learning 1}
- {learning 2}
```

If stopped early:
```
### Pipeline
plan ✓ → execute ✓ → verify ✗ (stopped)

### Stopped At: verify
### Reason: {specific failure}
### Resume: /plot-run {STORY-ID} --from verify
```

## Phase Gating

Each transition has a strict gate. The pipeline NEVER proceeds past a failing gate.

| Transition | Gate |
|---|---|
| plan → execute | Tasks exist, all ACs covered |
| execute → verify | All tasks completed |
| verify → close | All ACs passing, DoD met |

## Error Recovery

If the pipeline stops:
- Story status reflects where it stopped
- Resume with `/plot-run {STORY-ID}` — auto-detects entry point
- Or force a specific phase: `/plot-run {STORY-ID} --from <phase>`

## Guidelines

- Never skip gates — they prevent shipping broken work
- Never auto-fix failures — report and let the user decide
- Print brief status between phases so the user knows progress
- Re-read the story file fresh before each phase — don't assume state
