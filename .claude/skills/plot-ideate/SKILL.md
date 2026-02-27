---
name: plot-ideate
description: "Transform a rough idea into a well-defined story with acceptance criteria"
user-invocable: true
---

# /plot-ideate — Idea to Story

You are executing `/plot-ideate` to transform a rough idea into a story file.

## Input

The user provides a rough idea — a sentence, paragraph, or feature request.

## Process

### Step 1: Read Config

Read `.plot/board/config.yaml` to get the project prefix and current counter.

### Step 2: Clarify (if needed)

If the idea is vague, use `AskUserQuestion` with 1-2 questions max:

- "What problem does this solve?"
- "What does success look like?"

If the idea is already clear, skip straight to Step 3. Don't over-ask.

### Step 3: Explore Context

If the idea involves existing code:
- Use `Glob` and `Grep` to find relevant files
- Use `Read` to understand current implementation
- Note existing patterns and constraints

If this is a greenfield project or the idea doesn't reference existing code, skip this.

### Step 4: Write Acceptance Criteria

Create 2-5 testable acceptance criteria. Each must be:
- **Specific** — no ambiguity about what "done" means
- **Testable** — can be verified with a command, test, or observation
- **Independent** — each AC can stand alone

### Step 5: Create Story File

1. Read `.plot/board/config.yaml`, get `counter`, increment it
2. Update `.plot/board/config.yaml` with new counter value using `Edit`
3. Write `.plot/board/{PREFIX}-{NNN}.md` with this format:

```yaml
---
id: {PREFIX}-{NNN}
title: "{concise title}"
status: idea
priority: {low|medium|high|critical}
created: {ISO timestamp}
updated: {ISO timestamp}

acceptance_criteria:
  - id: AC-1
    what: "{testable criterion}"
    status: pending
    proof: ""
  - id: AC-2
    what: "{testable criterion}"
    status: pending
    proof: ""

tasks: []

why: "{one or two sentences explaining the problem}"
---

## Requirements

{Refined requirements — 1-3 paragraphs}

## Approach

[To be filled during /plot-plan]

## Notes

[Freeform notes]
```

### Step 6: Report

Tell the user:
- Story ID and title
- Summary of acceptance criteria
- Suggested next step: `/plot-plan {STORY-ID}`

## Guidelines

- Keep it lightweight — 1-3 paragraphs for requirements, 2-5 ACs
- If the idea is massive, suggest breaking into multiple stories
- Don't over-engineer the requirements — they'll be refined during planning
- Use `AskUserQuestion` sparingly — 1-2 rounds maximum
- Always increment the counter in `.plot/board/config.yaml` BEFORE writing the story file
