---
name: plot-verify
description: "Verify all acceptance criteria are met with concrete evidence"
user-invocable: true
---

# /plot-verify — Evidence Collection

You are executing `/plot-verify` to verify that all acceptance criteria are met with proof.

## Input

The user provides a story ID (e.g., `PLOT-001`). The story should be in `board/` with status `verifying` or `active`.

## Process

### Step 1: Read Story and Config

Read `board/{STORY-ID}.md` to get:
- Acceptance criteria (the checklist to verify)
- Tasks and their completion status

Read `board/config.yaml` to get:
- Definition of Done items (`done_when`)

### Step 2: Check Definition of Done First

Run the DoD basics before verifying individual ACs. For each `done_when` item, determine the appropriate check:

- "Code compiles without errors" → run `bun run typecheck` or equivalent
- "Tests pass" → run `bun test` or equivalent
- "All ACs pass with proof" → this is what Step 3 checks

If any DoD basic fails (compilation, tests), report immediately — no point checking ACs if the code doesn't build.

Use `Bash` to run these checks and capture output.

### Step 3: Verify Each Acceptance Criterion

For each AC, determine the verification method:

**Automated verification** (preferred):
- Run specific test files that cover this AC
- Execute commands that demonstrate the behavior
- Check file existence, content, or structure
- Use `Bash`, `Glob`, `Grep`, `Read` as needed

**Agent verification** (when automation isn't practical):
- Spawn a `qa-engineer` agent via `Task` tool to investigate
- Give them the specific AC to verify and what commands to run

For each AC, record:
- `status`: `pass` or `fail`
- `proof`: Actual command output, test results, or observation (keep concise — first 10-20 lines)

### Step 4: Update Story

Use `Edit` to update each AC in the story frontmatter:

```yaml
acceptance_criteria:
  - id: AC-1
    what: "Login endpoint returns JWT"
    status: pass
    proof: "bun test tests/auth.test.ts — 5/5 passed"
  - id: AC-2
    what: "Invalid creds return 401"
    status: fail
    proof: "No test file found for this case"
```

### Step 5: Judgment

**All ACs passing + DoD met:**
- Set `status: done` in the story
- Tell user: "All ACs verified. Run `/plot-close {STORY-ID}` to finalize."

**Any AC failing:**
- Keep status as `verifying`
- Report which ACs failed with details
- Suggest specific fixes

**DoD not met:**
- Keep status as `verifying`
- Report the DoD failures (e.g., "3 test failures in foo.test.ts")

### Step 6: Report

Provide a clear summary:

```
## Verification: {STORY-ID}

### Definition of Done
- [x] Code compiles — PASS
- [x] Tests pass — PASS (12/12)
- [ ] All ACs pass — see below

### Acceptance Criteria
- [x] AC-1: Login returns JWT — PASS (test output: ...)
- [ ] AC-2: Invalid creds 401 — FAIL (no test coverage)

### Verdict: 1/2 ACs passing. Fix AC-2 before closing.
```

## Guidelines

- **Trust nothing** — run actual commands, don't rely on claims
- **Concrete proof** — every judgment must have command output or test results
- **Fail fast** — if DoD basics fail, report immediately
- **Be specific** — "Test failed" is useless. Show the actual error.
- Prefer automated verification over spawning agents
- Keep proof concise but complete
