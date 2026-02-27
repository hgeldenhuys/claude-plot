---
name: plot-execute
description: "Execute planned tasks by spawning agents in dependency order"
user-invocable: true
---

# /plot-execute — Tasks to Code

You are executing `/plot-execute` to implement planned tasks by spawning specialized agents.

## Input

The user provides a story ID (e.g., `PLOT-001`). The story must exist in `.plot/board/` with status `planned`.

## Process

### Step 1: Read and Validate

Read `.plot/board/{STORY-ID}.md` and validate:
- Status is `planned`
- Tasks array is populated
- Dependencies are valid (no cycles, all referenced tasks exist)

Also read `.plot/board/config.yaml` for `max_agents`.

### Step 2: Set Active

Use `Edit` to update the story:
- Set `status: active`
- Set or add `started_at: {ISO timestamp}` below the `updated` field

### Step 3: Create Built-in Tasks

For each task in the story, create a corresponding built-in task via `TaskCreate`:
- Subject: `{STORY-ID} {task-id}: {task-do}`
- Description: Include story path, task deliverables, AC coverage
- Set up `addBlockedBy` for dependencies

### Step 4: Phase-Based Execution

Group tasks by dependency phase:
- **Phase 1:** Tasks with no dependencies (run in parallel)
- **Phase 2:** Tasks that depend only on Phase 1 tasks
- **Phase 3:** etc.

For each phase:

1. **Spawn agents** using the `Task` tool with appropriate `subagent_type`:
   - `backend` → `backend-dev`
   - `frontend` → `frontend-dev`
   - `test` → `qa-engineer`
   - `docs` → `tech-writer`
   - `ops` → `devops`
   - If no match → `general-purpose`

2. **Agent prompt template:**

```
You are working on story {STORY-ID}: "{title}"

Your task: {task-id} — {task-do}

Read the story file at `.plot/board/{STORY-ID}.md` for full context.

Your built-in task ID is #{builtin-task-id}. Update it:
- TaskUpdate taskId="{id}" status="in_progress" when you start
- TaskUpdate taskId="{id}" status="completed" when you finish

AC Coverage: This task covers {covers list}

Deliverables:
{what the task should produce}

When done, include a brief summary of what you did and any issues encountered.
```

3. **Spawn independent tasks in parallel** (multiple `Task` calls in one message)
4. **Respect `max_agents`** from config — if more tasks than limit, batch them
5. **Wait for each phase** to complete before starting the next

### Step 5: Update Story After Each Agent

After each agent completes:
1. Read `.plot/board/{STORY-ID}.md` fresh
2. Find the completed task in the `tasks:` array
3. Use `Edit` to change its `status:` from `pending` to `done`

The story file is the source of truth — built-in TaskUpdate alone is NOT sufficient.

### Step 6: Completion

When all tasks are done:
- Use `Edit` to set `status: verifying` in the story
- Update `updated` timestamp
- Tell the user: run `/plot-verify {STORY-ID}`

### Failure Handling

If an agent reports failure:
1. Read the failure — extract the actual error
2. Report to the user with:
   - Which task failed
   - The specific error
   - Your diagnosis
3. Do NOT auto-retry — let the user decide
4. Keep the story status as `active`

## Guidelines

- Always spawn independent tasks in parallel for efficiency
- Never skip the TaskUpdate instructions in agent prompts
- If a task fails, report clearly and stop — don't retry blindly
- The story file is the source of truth — always update it
- After all agents complete, verify the story file reflects all task completions
