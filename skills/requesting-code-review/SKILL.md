---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch a code reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — **never your session's history**. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often. A fresh-context reviewer outperforms your own self-critique — you are too close to the work to see its gaps.

## Fresh Context Is the Whole Point

The reviewer must start cold. Do NOT paste your reasoning, your plan-as-you-understood-it, or "what I was trying to do." Hand it only:
- the filled template (description, requirements, SHAs),
- the diff (it pulls this itself from the SHAs),
- pointers to files it should read, never the file contents inline.

If a finding only holds because you explained your intent, it is not a real finding. The reviewer must reach its verdict from the code and the stated requirements alone.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing a major feature
- Before merge to main (whole-branch review)

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing a complex bug

## Choose the Review Shape

Pick the shape from the size and risk of the diff before dispatching:

| Shape | Diff | Reviewers to dispatch |
|---|---|---|
| **Shape 1** | Small / low-risk (few files, no security/data/concurrency surface) | **One** `general-purpose` reviewer, standard mode |
| **Shape 2** | Large (many files / many call sites) OR risky | **Three** perspective-diverse reviewers **in parallel** (correctness / security / performance), each fresh-context |
| **Shape 3** | High-risk (auth, payments, migrations, deletes, concurrency, crypto, anything touching data integrity) | **Three** parallel reviewers (same three lenses) **in adversarial / refute-by-default mode** |

"Risky" = touches money, auth, user data, schema/migrations, concurrency, deletion, or a security boundary. When unsure, treat it as risky.

Do NOT over-orchestrate a one-file typo fix. Do NOT send a 40-file auth rewrite to a single generic reviewer.

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code reviewer subagent(s) — the COUNT comes from the Shape:**

| Shape (from the table above) | How many to dispatch | What each reviewer gets |
|---|---|---|
| **Shape 1** — small / low-risk | **ONE** `general-purpose` reviewer | the filled [code-reviewer.md](code-reviewer.md) template, standard mode |
| **Shape 2** — large / risky | **THREE** `general-purpose` reviewers **in parallel** (one message, three subagent calls) | the SAME filled template + ONE appended lens each (correctness / security / performance — one lens per reviewer; lens text in the section below) |
| **Shape 3** — high-risk | **THREE** parallel reviewers, exactly as Shape 2 | the SAME filled template + one lens each + the ADVERSARIAL directive (in the section below) appended to all three |

Fill these placeholders in the template for every dispatch:
- `{DESCRIPTION}` — Brief summary of what you built
- `{PLAN_OR_REQUIREMENTS}` — What it should do
- `{BASE_SHA}` — Starting commit
- `{HEAD_SHA}` — Ending commit

**IGNORE blocklist — append this to EVERY reviewer prompt** (Shape 1, 2, and 3 alike), and add it to your copy of [code-reviewer.md](code-reviewer.md) so all reviewers inherit it. It keeps reviewers cheap and focused on hand-written source:

```
IGNORE (do not read, diff, or report findings on) anything under these —
it is not your code and findings there are noise:
- node_modules/, vendor/, third_party/   (vendored dependencies)
- venv/, .venv/, env/                     (virtualenvs)
- dist/, build/, out/, target/            (build output)
- *.lock, package-lock.json, yarn.lock, poetry.lock, Cargo.lock  (lockfiles)
- generated code (*_pb2.py, *.g.dart, codegen output, snapshots)
- model/weight blobs (*.bin, *.safetensors, *.gguf, *.onnx, *.ckpt, *.pt)
Review ONLY the hand-written source changed in [BASE_SHA]..[HEAD_SHA].
```

Every dispatch is fresh-context and read-only on the checkout.

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if the reviewer is wrong (with reasoning)

## Perspective-Diverse Parallel Reviewers (large / risky diffs)

For large or risky changes, dispatch three reviewers **in parallel** (one message, multiple subagent calls). They are read-only on the checkout and share no state, so parallelizing is safe — see `dispatching-parallel-agents`. Each gets the filled [code-reviewer.md](code-reviewer.md) template plus a lens appended to its prompt:

- **Correctness lens:** "Focus on logic errors, wrong results, unhandled edge cases, broken control flow, off-by-one, null/empty inputs, error-path bugs. Trace the actual data flow."
- **Security lens:** "Focus on injection, authz/authn gaps, secret/PII exposure, unsafe deserialization, SSRF, path traversal, missing input validation, privilege boundaries."
- **Performance lens:** "Focus on N+1 queries, unbounded loops/memory, missing indexes, blocking I/O on hot paths, redundant work, pathological complexity."

Append the **IGNORE blocklist from Step 2** to each lens prompt as well, so every reviewer stays cheap and focused on hand-written source.

**Synthesize the returns yourself (two-tier):**
1. Per-lens: keep each reviewer's graded Strengths / Issues / Assessment.
2. Cross-lens roadmap: merge all findings, dedupe overlaps, sort by **highest severity (Critical > Important > Minor)**, produce one ordered fix list. Resolve verdict conflicts by taking the **highest severity (Critical > Important > Minor)**: any Critical ⇒ do not merge until it is fixed and re-reviewed; any unresolved Important ⇒ fix before proceeding.

## Adversarial / Refute-By-Default Mode (high-risk diffs)

For high-risk diffs, append this directive to each reviewer's prompt:

```
ADVERSARIAL MODE. Assume this change is broken or unsafe until the code
proves otherwise. Treat every concern as a hypothesis you must REFUTE:
- State the failure ("an unauthenticated caller can reach X").
- Try to find the exact code path / guard that prevents it.
- Only clear the concern if you can cite the lines that make it safe.
- If you cannot trace a guarantee, report it as a defect, not a maybe.
Do not give the benefit of the doubt. "Looks fine" is not a verdict.
```

Combine with the parallel lenses above for the highest-risk diffs: three fresh-context reviewers, each in refute-by-default mode within its lens. This is the strongest gate before merging anything that can lose data, leak secrets, or breach auth.

## Example

### Shape 1 example — small / low-risk diff (one reviewer)

```
[Just completed Task 2: Add verification function — small, low-risk diff → one reviewer]

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code reviewer subagent — fresh context]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/maestro/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

### Shape 2 / 3 example — large, high-risk diff (fan-out + two-tier synthesis)

A new auth middleware touching 20 files is large AND high-risk → **Shape 3**: three parallel reviewers, each in adversarial mode.

```
BASE_SHA=$(git rev-parse origin/main)
HEAD_SHA=$(git rev-parse HEAD)

[ONE message containing THREE general-purpose subagent calls (parallel).
 Each reviewer = filled code-reviewer.md template (same DESCRIPTION /
 REQUIREMENTS / BASE_SHA / HEAD_SHA) + the IGNORE blocklist + its own lens.
 Shape 3 → also append the ADVERSARIAL MODE block to all three.]

  Reviewer A — CORRECTNESS lens:
    LENS: logic errors, wrong results, unhandled edge cases, broken control
          flow, off-by-one, null/empty inputs, error-path bugs; trace data flow.
    + ADVERSARIAL MODE block

  Reviewer B — SECURITY lens:
    LENS: injection, authz/authn gaps, secret/PII exposure, unsafe
          deserialization, SSRF, path traversal, missing input validation,
          privilege boundaries.
    + ADVERSARIAL MODE block  (adversarial security directive in force:
      assume an UNAUTHENTICATED / unauthorized caller CAN reach every guarded
      path until you can cite the exact lines that stop them; an unprovable
      guard is a defect, not a "maybe").

  Reviewer C — PERFORMANCE lens:
    LENS: N+1 queries, unbounded loops/memory, missing indexes, blocking I/O
          on hot paths, redundant work, pathological complexity.
    + ADVERSARIAL MODE block

[The three return independently — synthesize as they land:]

  A (correctness) → Strengths: token-refresh path well tested.
                    Issues: Important — session id reused after login,
                            enabling fixation (auth.ts:88).
                    Assessment: With fixes
  B (security)    → Strengths: queries are parameterized.
                    Issues: CRITICAL — /admin checks authn but not authz; any
                            logged-in user reaches it, no role guard found
                            (middleware.ts:142).
                    Assessment: No
  C (performance) → Strengths: none blocking.
                    Issues: Minor — permissions re-fetched from DB per request,
                            no cache (perms.ts:30).
                    Assessment: With fixes

[TWO-TIER SYNTHESIS — you do this yourself, do not delegate it:]

  Tier 1 (per-lens graded): keep A's, B's, C's Strengths/Issues/Assessment
  exactly as returned (above).

  Tier 2 (cross-lens ordered fix list): merge, dedupe, sort by highest
  severity (Critical > Important > Minor):
    1. [Critical · security]     Add authz/role check to /admin (middleware.ts:142)
    2. [Important · correctness] Rotate session id on login (auth.ts:88)
    3. [Minor · performance]     Cache per-request permission lookup (perms.ts:30)

  Merged verdict = highest severity wins. A Critical is present ⇒ DO NOT MERGE
  until item 1 is fixed and re-reviewed.
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to the next task

**Executing Plans:**
- Review after each task or at natural checkpoints
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

**Dynamic-workflow candidates:** the **final whole-branch review before merge** and **recurring risky-diff reviews** are repeated, structured, multi-subagent procedures — good candidates to encode as a reusable dynamic workflow (scripted SHA capture → parallel lens fan-out → adversarial gate → two-tier synthesis) you rerun on each branch. See `dynamic-workflow-orchestration`.

## Red Flags

**Never:**
- Skip review because "it's simple" when the diff is risky
- Send a high-risk diff to a single generic reviewer
- Feed the reviewer your session history or intent
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If the reviewer is wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: [code-reviewer.md](code-reviewer.md)
