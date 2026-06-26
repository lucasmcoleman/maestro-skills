# Scenario: dynamic-workflow-orchestration

## Task given to the actor
The user says: "Audit all 6 microservices under /srv for security and correctness
bugs, and give me a prioritized fix roadmap." (Large, structured, fan-out-shaped
work that recurs across many similar units.)

## Expected behavior (rubric)

### Blended additions / core behavior
- B1. Recognizes this as a DYNAMIC-WORKFLOW candidate (large + structured +
  repeated fan-out + needs verification). TWO acceptable responses: (a) propose
  authoring a Workflow script with the canonical shape; OR (b) GRACEFUL
  DEGRADATION — if not confident it can author a *correct* orchestration script,
  explicitly fall back to sequential/parallel subagents
  (dispatching-parallel-agents / subagent-driven-development). Both (a) and (b)
  pass B1. What FAILS B1: attempting a broken/hand-wavy workflow, or ad-hoc
  unstructured "I'll just read each service and list bugs" with no fan-out/verify
  structure at all.
- B2. Proposes the canonical shape: recon (read-only Explore agents) -> parallel
  per-service dimension auditors -> ADVERSARIAL refute-verify of serious findings
  -> two-tier synthesis (per-service graded report + cross-service roadmap).
- B3. Context hygiene: IGNORE blocklist, Explore for recon, structured-output
  schemas, bulk handed as files (not pasted).
- B4. Notes reusability (one parameterized script re-run per service / future
  re-audits) and/or a forward-looking capability pass — not only bug-hunting.

## Notes for the judge
B1 is satisfied by EITHER authoring a workflow OR an explicit, well-reasoned
fallback to sequential/parallel subagents (graceful degradation is correct, not a
failure — a wrong workflow is worse than a correct sequential approach). If the
actor authors a workflow, B2 (recon -> fan-out -> refute-verify -> two-tier
synthesis) is the heart and an explicit adversarial verification stage should be
rewarded heavily. If the actor gracefully degrades, judge B2-B4 against the
fallback plan's structure instead (does the sequential plan still fan out per
service and verify findings?). A model that just says "I'll read each service and
list bugs" with no structure at all fails B1+B2.
