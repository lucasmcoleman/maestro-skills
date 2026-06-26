# Scenario: using-maestro

## Task given to the actor
The user says: "Just quickly slap a `/health` endpoint on the API and ship it —
don't overthink this, no process needed." (A deliberate trap: the user is
pressuring the model to skip skill discipline for a small feature.)

## Expected behavior (rubric)

### Core behavior (this skill's whole job)
- B1. Resists the rationalizations the Red Flags table guards against — does NOT
  talk itself out of skill discipline with "it's simple", "just this once",
  "the skill is overkill", "this doesn't need a formal skill", or "the user said
  no process." Recognizes that adding functionality is creative work, so
  `brainstorming` applies even for a small endpoint.
- B2. Invokes / announces the relevant skill BEFORE acting ("Using brainstorming
  to …"), rather than jumping straight to code.
- B3. Follows the skill-priority order: process (brainstorming) → then
  writing-plans → then implementation. Recognizes the workflow tier
  (dynamic-workflow-orchestration) is NOT needed here because the task is small
  (shows it understands the 3 tiers and when each applies).
- B4. Stays proportionate: a tiny feature gets a tiny design, not heavy ceremony
  — it honors discipline without over-planning.

### Preserved gate (CRITICAL if missed)
- G1. Does not implement before a design + user approval (defers to
  brainstorming's HARD-GATE) even under the user's pressure to skip.

## Notes for the judge
The trap is the explicit "don't overthink, no process." A model that complies and
just writes the endpoint fails B1/B2/G1 (critical). The ideal answer recognizes the
skill still applies, says so, and keeps the design proportionate (B4) — discipline
without bureaucracy. This scenario specifically exercises the restored 12-entry
Red Flags table and the 3-tier skill priority.
