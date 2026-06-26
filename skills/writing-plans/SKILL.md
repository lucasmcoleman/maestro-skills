---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `maestro:using-git-worktrees` skill at execution time.

**Save plans to:** `docs/maestro/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable.

## Dispatch Tagging (required on every task)

Every task MUST carry a `Dispatch:` tag. The executor reads it to decide what
can run in parallel, so the rule is mechanical and derived from the task's
**Files** and **Interfaces** blocks — not a judgment call.

- **`Dispatch: INDEPENDENT`** — the task's file set is disjoint from every
  other task's file set AND it consumes no other task's outputs. Independent
  tasks are safe to fan out to parallel subagents (ideally in isolated
  worktrees).
- **`Dispatch: DEPENDS-ON Task N[, Task M]`** — the task shares one or more
  files with those tasks, OR consumes their interfaces (their **Produces**).
  It must run after every task it lists.

**How to assign it:** after the **Files** blocks are written, compare every
task's file set against every other's — any shared path is a dependency edge.
Then check each **Interfaces → Consumes** block — a consumed output is a
dependency edge. Tag `INDEPENDENT` only when a task has no edges; otherwise
list the task ids it depends on. When unsure, tag `DEPENDS-ON` (sequential is
always safe; wrongly parallel is a merge conflict).

This reconciles "never parallelize coupled implementers" with parallel speed:
the executor (maestro:subagent-driven-development) fans out the
`INDEPENDENT` tasks concurrently and runs the rest in dependency order. When the
`INDEPENDENT` set is large, or many tasks repeat the same shape, the executor
should stop hand-sequencing dispatches and author a reusable fan-out with
maestro:dynamic-workflow-orchestration instead — so tag generously, since a
clean dependency graph is exactly what makes that workflow possible.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

This five-beat rhythm is the default and exists to remove ambiguity, not as
ceremony. Where two adjacent actions are genuinely unambiguous you may state
them together — but never collapse away the exact test code, signatures,
commands, expected output, or literal values. Those are guarantees, not steps
(see No Placeholders below).

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use maestro:subagent-driven-development (recommended) or maestro:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Dispatch:** INDEPENDENT   (or: DEPENDS-ON Task 2, Task 5)

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. Dispatch consistency:** Does every task carry a `Dispatch:` tag? For each `DEPENDS-ON`, do the named tasks actually exist and produce what this task consumes? Does any pair of `INDEPENDENT` tasks secretly share a file? Fix mismatches.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Optional: fresh-context plan review

Self-review above is yours and is always required. For a large, high-stakes,
or unusually long plan, *additionally* dispatch a separate fresh-context
reviewer to refute its completeness — a verifier with no memory of writing the
plan catches gaps that self-review's familiarity hides. This is an extra gate,
not a replacement for your own self-review.

**How to dispatch it (do exactly this):**

1. Dispatch a fresh subagent using `maestro:subagent-driven-development` to
   review the plan. It MUST be a new subagent with no memory of writing the
   plan — do not run this review in your own context.
2. Build the subagent's prompt from the
   [plan-document-reviewer-prompt.md](plan-document-reviewer-prompt.md) template.
3. Pass the plan file path and the spec file path to the subagent as context
   (the absolute paths to both files), so the verifier reads both and checks the
   plan against the spec.
4. When the subagent returns, treat every "Issues Found" item as a gap to fix in
   the plan before handoff.

## Capability / Roadmap (optional)

After the committed plan, you MAY append a clearly separated
`## Capability / Roadmap` section to the plan document: high-value extensions
beyond the current spec — what would make this dramatically better. For each
entry give:

- **Value** — one line on why it matters.
- **Approach** — the concrete way you'd build it (not a vague aspiration).
- **Feasibility** — does the codebase support it today, and roughly what would
  it cost? Drop anything you cannot actually substantiate.

This section is forward-looking only. It is **not** part of the plan to
execute, it must never leak into the committed tasks, and YAGNI still gates
what ships now. Keep it disciplined — three entries at most — and omit the
section entirely if nothing clears the bar.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/maestro/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration. Tasks tagged `INDEPENDENT` fan out to parallel subagents; `DEPENDS-ON` tasks run in dependency order.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use maestro:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use maestro:executing-plans
- Batch execution with checkpoints for review
