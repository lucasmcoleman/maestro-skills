---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load the plan, review it critically, execute every task, report when done.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Subagents change the game.** Maestro works much better with subagent access (Claude Code, Codex CLI/App, Copilot CLI, and Gemini CLI all qualify; see the per-platform tool refs in `../using-maestro/references/`). If subagents are available, do not execute by hand — delegate:
- For tasks that share state and must run **in order with per-task review**, use **maestro:subagent-driven-development** instead of this skill.
- For a large set of **independent** tasks (disjoint files, ideally isolated worktrees) that repeat the same shape, author a fan-out with **maestro:dynamic-workflow-orchestration** rather than hand-sequencing subagents.
- For all other cases with subagents available, use **maestro:subagent-driven-development**.

## The Process

### Step 1: Load and Review Plan
1. Read the plan file.
2. Review it critically — identify any questions or concerns about the plan.
3. If concerns: raise them with your human partner before starting.
4. If the plan is sound: create todos for the plan's tasks and proceed.

### Step 2: Execute Tasks

For each task:
1. Mark the todo as `in_progress`.
2. Follow each step exactly — the plan is written in bite-sized steps by design.
3. Run the verifications the step specifies.
4. Reference any skill the plan names at the point it names it.
5. Mark the todo `completed`.

**Run continuously.** Do not pause to check in with your partner between tasks, and do not post "should I continue?" or progress summaries — they asked you to execute the plan, so execute it. Stop only for one of three reasons: a blocker you cannot resolve, genuine ambiguity that prevents progress, or all tasks complete (see "When to Stop and Ask").

**Audit before you claim — no completion claim without fresh evidence.** Every "done," "passing," or "verified" must trace to a tool result *from this session*: re-read the file you edited, re-run the test, read the command output. Do not mark a task complete on memory or assumption — confirm it against an actual tool result first.

### Step 3: Complete Development

After all tasks are complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use maestro:finishing-a-development-branch.
- Follow that skill to verify tests, present the integration options, and execute the choice.

## When to Stop and Ask

**Stop executing immediately when:**
- You hit a blocker (missing dependency, failing test, an instruction you don't understand).
- The plan has a critical gap that prevents starting.
- Verification fails repeatedly.

Ask for clarification rather than guessing. Don't force through blockers.

## When to Revisit Earlier Steps

**Return to Step 1 (Load and Review) when:**
- Your partner updates the plan based on your feedback.
- The fundamental approach needs rethinking.

## Invariants

- Review the plan critically first; follow its steps exactly; never skip verifications.
- Reference skills at the point the plan names them.
- Stop when blocked — ask, don't guess your way through.
- No completion claim without a fresh tool-result from this session.
- **Never start implementation on main/master without explicit user consent.**

## Integration

**Required workflow skills:**
- **maestro:using-git-worktrees** — ensures an isolated workspace (creates one or verifies an existing one).
- **maestro:writing-plans** — creates the plan this skill executes.
- **maestro:finishing-a-development-branch** — completes development after all tasks.

**When subagents are available (alternatives to this skill):**
- **maestro:subagent-driven-development** — same-session execution with a fresh subagent and review per task.
- **maestro:dynamic-workflow-orchestration** — fan out a large set of independent tasks as a reusable workflow.
