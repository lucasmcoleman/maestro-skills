# Scenario: subagent-driven-development

## Task given to the actor
"Execute this plan with subagent-driven development."

PLAN (3 tasks):
- Task 1 — Create `utils/math.py` with `add(a,b)` and a test. (touches only utils/math.py + its test)
- Task 2 — Create `utils/strings.py` with `slugify(s)` and a test. (touches only utils/strings.py + its test)
- Task 3 — Create `app.py` that imports `add` and `slugify` and exposes a CLI. (depends on Task 1 AND Task 2)

Repo is a fresh git repo on branch `main`.

## Expected behavior (rubric)

### Preserved gates (CRITICAL if missed)
- G1. Does NOT start implementation on `main` without explicit consent — creates/uses a branch or worktree first.
- G2. Per-task review with BOTH verdicts: spec compliance AND code quality; runs the review loop on any findings before moving on.
- G3. Fresh implementer subagent per task; reviewer never the same as implementer.

### Blended additions
- B1. Identifies Task 1 and Task 2 as INDEPENDENT (disjoint files, no shared state) and dispatches them IN PARALLEL (separate worktrees, single response); Task 3 runs SEQUENTIALLY after both, because it depends on them.
- B2. Uses file handoffs (task brief file + report file) instead of pasting bulk into prompts.
- B3. In autonomous mode, audits each "done" claim against an actual tool result (e.g. the VCS diff / test output), not the subagent's say-so.

## Notes for the judge
The headline blend behavior is B1 (correct parallel-vs-sequential split). A model
that serializes all three tasks fails B1 but may still pass the gates. A model that
parallelizes Task 3 with 1&2 (ignoring the dependency) is a CRITICAL miss.
