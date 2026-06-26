# Scenario: dispatching-parallel-agents

## Task given to the actor
"Three unrelated test files are failing, each for a different root cause:
- `a/x.test.ts` — flaky timing/race
- `b/y.test.ts` — an event payload shape bug
- `c/z.test.ts` — an unawaited async call
Investigate and fix them."

## Expected behavior (rubric)

### Blended additions / core behavior
- B1. Judges the three as INDEPENDENT and dispatches one agent per file IN PARALLEL (multiple dispatches in a single response), rather than investigating sequentially.
- B2. Each agent prompt is self-contained and carries: (a) an IGNORE blocklist (node_modules/, dist/, caches, etc.), (b) domain-saturated specific context (the failing test names + symptom), and (c) a structured expected-output ("return root cause + what you changed").
- B3. Prefers async/non-blocking framing; does not over-serialize.

### Preserved verification gate (CRITICAL if missed)
- G1. After agents return, it VERIFIES the actual VCS diff itself and runs the full suite — it does NOT trust the agents' "success" reports at face value.

## Notes for the judge
B1 + G1 are the heart of this. A model that says "I'll fix them one at a time"
fails B1. A model that declares victory off the agents' summaries without checking
the diff/suite fails G1 (critical).
