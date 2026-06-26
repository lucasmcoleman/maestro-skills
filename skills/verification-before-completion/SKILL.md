---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Audit Each Claim Against This Session

On long or autonomous runs, status fabrication creeps in: you start reporting from memory, or from "I changed the code, so it must work." Counter it with one named rule:

**Audit each claim against a tool result from THIS session.**

Before you write any status sentence, point to the specific tool output *in this session* that proves it:
- Can you name the message where the command ran and the output appeared? If not, the claim is unverified — re-run before you say it.
- "It passed earlier" / "it passed on the last run" does NOT count. Earlier is not this session's fresh evidence.
- Editing the code is not evidence the edit works. Only the post-edit tool result is.

## Refute-Gate for Non-Trivial Correctness Claims

Self-inspection from the same context that wrote the code is weak — you tend to confirm the story you already told yourself. **Fresh-context verifiers beat self-critique.** So for any non-trivial correctness claim (the bug is fixed, the algorithm is right, the edge case is handled, the migration is safe), do NOT rely on your own re-reading. Dispatch a fresh-context verifier subagent and prompt it to REFUTE the claim.

**When to use it:** any correctness claim whose failure would not be obvious from output you already hold. (A test runner that already printed `34/34 pass` is direct evidence — clear it on that evidence; don't spawn a subagent to re-read output you have.)

**How to dispatch (do every step):**
1. State the exact claim to refute, e.g. "repairIndex() never corrupts a valid index."
2. Dispatch a `general-purpose` subagent with FRESH context — never paste your session history into it.
3. Put these in its prompt:
   - The claim, framed adversarially: "Assume this is FALSE. Find an input or code path that breaks it. Default verdict is NOT VERIFIED unless you independently reproduce the passing/failing behavior."
   - The relevant file *paths* (hand bulk over as files; never paste large blobs into the prompt).
   - An IGNORE list so it stays cheap and focused: `venv/`, `node_modules/`, build caches, vendored deps, weight/data blobs.
   - The exact command(s) to run to reproduce, if any.
4. When a thing can fail multiple ways, dispatch perspective-diverse verifiers in parallel — one each for correctness / security / does-it-actually-reproduce — then reconcile their verdicts before claiming (procedure below).

**Reconciling multiple verifiers (do every step):**
1. Collect each verifier's verdict as exactly one of:
   - `REFUTATION FAILED` — it tried to break the claim and could not (this is the only passing verdict).
   - `REFUTED` — it found an input or code path that breaks the claim.
   - `NOT VERIFIED` — it could not reproduce the passing behavior (treat the same as a flag).
2. The claim passes ONLY IF every verifier returned `REFUTATION FAILED`. One verifier passing never cancels out another's flag — there is no averaging and no majority vote.
3. **If verifiers conflict, do NOT claim pass.** If ANY perspective returns `REFUTED` or `NOT VERIFIED` while others pass, treat the claim as NOT VERIFIED.
4. Report ALL verdicts, name which perspective flagged the flaw, and explicitly acknowledge the conflict. Do not silently drop the dissenting verifier.
5. Fix the flaw the dissenting verifier found, then re-run ALL verifiers fresh. A partial re-run of only the one that failed does not clear the gate.

```
Example — PASS (all agree):
  correctness: REFUTATION FAILED · security: REFUTATION FAILED · reproduce: REFUTATION FAILED
  → all three passed → claim "verified" WITH the cited evidence.

Example — FAIL (conflict):
  correctness: REFUTATION FAILED · security: REFUTED (SQL injection via `name`) · reproduce: REFUTATION FAILED
  → NOT VERIFIED. Report: "2 of 3 verifiers passed; security REFUTED the claim
     (SQL injection via `name`). Conflict acknowledged — NOT claiming pass.
     Fixing the flaw, then re-running all three." Do NOT say it passes.
```

**Done means:** the verifier reports that it tried to break the claim and could not (refutation failed), citing the code path or command output it checked. A bare "looks fine" is NOT done. If the verifier cannot reproduce the passing behavior, treat the claim as NOT VERIFIED.

## What Counts As Evidence

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | previous run, "should pass" |
| Linter clean | Linter output: 0 errors | partial check, extrapolation |
| Build succeeds | Build command: exit 0 | linter passed, logs look good |
| Bug fixed | Original symptom retested: passes | code changed, assumed fixed |
| Regression test works | Red → green cycle verified | test passes once |
| Agent/subagent done | VCS diff shows the changes | agent reports "success" |
| Requirements met | Line-by-line checklist | tests passing |

## Red Flags - STOP

Each of these is a rationalization. The rebuttal follows the dash.

- "should", "probably", "seems to" — not evidence; RUN the verification.
- "I'm confident" — confidence ≠ evidence.
- "Just this once" / "I'm tired" — no exceptions; exhaustion is not an excuse.
- "Linter passed" — linter ≠ compiler; run the build.
- "Partial check is enough" — partial proves nothing.
- "Agent said success" — verify independently against the VCS diff.
- "Different words, so the rule doesn't apply" — spirit over letter.
- Expressing satisfaction before evidence ("Great!", "Perfect!", "Done!").
- About to commit / push / PR without running verification.
- ANY wording implying success without having run verification.

## Patterns

**Tests:**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression test (TDD red-green):**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without the red-green cycle)
```

**Build:**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
✅ Re-read plan → checklist → verify each → report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**
```
✅ Agent reports success → check VCS diff → verify changes → report actual state
❌ Trust the agent report
```

**Non-trivial correctness:**
```
✅ Claim → fresh-context verifier prompted to refute → refutation fails → THEN claim
❌ Re-read your own code, decide it's fine, claim it
```

## When To Apply

**ALWAYS before:**
- ANY variation of a success / completion claim
- ANY expression of satisfaction or positive statement about work state
- Committing, PR creation, task completion
- Moving to the next task
- Delegating to, or accepting results from, agents

**The rule applies to** exact phrases, paraphrases and synonyms, implications of success, and ANY communication suggesting completion or correctness.

## Why This Matters

Verification failures are the most expensive kind:
- Your human partner says "I don't believe you" — trust, once broken, is slow to rebuild.
- Undefined functions / missing requirements ship, then crash or arrive incomplete.
- False completion forces a redirect-and-rework cycle that costs more than the verification would have.
- It violates a core value: honesty. If you claim success you didn't verify, you lied.

## The Bottom Line

Run the command. Read the output. Audit the claim against THIS session's evidence. For non-trivial correctness, let a fresh verifier try to refute it. THEN claim the result.

No shortcuts for verification. This is non-negotiable.
