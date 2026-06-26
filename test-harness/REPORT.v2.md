# Fable+Opus Blend — Remediation Report (v2)

_Target: `superpowers/6.0.3-fable-opus` · Runtimes evaluated: opus / sonnet / haiku · Judge mode: refute-by-default · Re-audit panel: same 3 lenses (gates / correctness / executability), majority = 2+ fix · 30 fixes applied across 9 skills this pass_

## Verdict

**Both v1 structural CRITICALs cleared — but the blend is still NOT shippable, because behavioral coverage surfaced a NEW critical at the weakest tier.**

The two release-blocking CRITICALs from v1 are resolved at the structural-audit level:

- **`using-superpowers`** — the gate lens now reads **pass (none)**. Platform Adaptation was restored and the Red Flags table rebuilt; the CRITICAL gate-preservation defect is gone. The skill drops from **FIX 3/3 (CRITICAL) → FIX 2/3** (residual major issues are correctness + executability only).
- **`dynamic-workflow-orchestration`** — the **fourth hard gate (spec + quality dual verdict) was added**; the "missing 4th gate / single-`isReal` schema" defect is gone. The skill stays **FIX 3/3**, but its gate lens is now **major, not CRITICAL**.

So the doctrine's "never trimmed, all tiers" criticals are no longer outright violated. **However, the blend cannot ship yet for three reasons:**

1. **NEW critical, behavioral not structural — `using-superpowers` fails at Haiku.** The newly-run `using-superpowers @ haiku` cell scored **18, gate_ok=false, critical_miss=true**: Haiku walked straight into the trap, used the forbidden "user said no process" rationalization to skip brainstorming, and wrote tests + endpoint code before any design or approval (the design-approval HARD-GATE was missed). The same skill at opus scored 95 with the gate held. So the v1 structural fix did not make the skill weak-tier-safe; the audit cleared the gate text, but the gate still does not *hold* at Haiku. This is a release blocker.
2. **NEW structural gate defect (major) — `dynamic-workflow-orchestration` silent attempt cap.** The added two-verdict gate says "the task is NOT done until BOTH pass — re-dispatch and re-review until they do," but the code silently caps at `while (attempt < 3)` with the escape clause buried in a comment, not declared in the gate statement. This re-introduces a gate-preservation problem (major) on the very skill we just fixed.
3. **6 of 9 skills remain majority-fix** (down from 7/9), and `subagent-driven-development` **regressed** from PASS 1/3 to FIX 2/3 — the remediation added orchestration content that introduced new correctness/executability gaps (notably a missing IGNORE-blocklist directive and an ambiguous Red-Flags parallelization rule).

**Net:** strong progress — `executing-plans` and `dispatching-parallel-agents` cleared to PASS, both ex-CRITICALs lost their CRITICAL status, and the two ex-flaked Haiku runs (`brainstorming`, `verification-before-completion`) both held their gates. But one targeted pass is still required before activation. **Worst residual: `using-superpowers @ haiku` (critical behavioral gate miss).**

## Before → After

| Skill | Prior verdict (v1) | New verdict (v2) | Movement |
|---|---|---|---|
| **using-superpowers** ⚠ ex-CRITICAL | **FIX 3/3 — CRITICAL** | **FIX 2/3** (gate cleared) + **Haiku behavioral FAIL** | Structural critical CLEARED; new behavioral critical at Haiku |
| **dynamic-workflow-orchestration** ⚠ ex-CRITICAL | **FIX 3/3 — CRITICAL** | **FIX 3/3** (gate now major, not critical) | 4th gate added; new major gate defect (silent cap) |
| executing-plans | FIX 3/3 | **PASS 1/3** | ✅ Cleared |
| dispatching-parallel-agents | FIX 2/3 | **PASS 1/3** | ✅ Cleared |
| requesting-code-review | FIX 2/3 | FIX 2/3 | No net change (different residuals) |
| verification-before-completion | FIX 2/3 | FIX 2/3 | No net change (different residuals) |
| brainstorming | FIX 2/3 | FIX 2/3 | No net change; Haiku gate now verified ✅ |
| subagent-driven-development | PASS 1/3 | **FIX 2/3** | ⚠ Regressed (new content introduced gaps) |
| writing-plans | PASS 1/3 | PASS 1/3 | Stable |

**Counts:** majority-fix 7/9 → **6/9**. CRITICAL 2 → **0 structural / 1 behavioral (Haiku)**. Cleared to PASS this pass: 2 (executing-plans, dispatching-parallel-agents). Regressed: 1 (subagent-driven-development).

### Per-lens re-audit matrix (same 3-lens panel)

| Skill | Gates | Correctness | Executability | Majority |
|---|---|---|---|---|
| using-superpowers | pass (none) | FIX (major) | FIX (major) | **FIX 2/3** |
| dynamic-workflow-orchestration | **FIX (major)** | FIX (major) | FIX (major) | **FIX 3/3** |
| executing-plans | pass | FIX (major) | pass | PASS 1/3 |
| dispatching-parallel-agents | pass | pass | FIX (minor) | PASS 1/3 |
| requesting-code-review | pass | FIX (major) | FIX (minor) | **FIX 2/3** |
| brainstorming | FIX (minor) | pass | FIX (major) | **FIX 2/3** |
| verification-before-completion | pass | FIX (major) | FIX (major) | **FIX 2/3** |
| subagent-driven-development | pass | FIX (major) | FIX (major) | **FIX 2/3** |
| writing-plans | pass | pass | FIX (minor) | PASS 1/3 |

### Remediation applied this pass (fix count · line delta)

| Skill | Fixes | Lines |
|---|---|---|
| using-superpowers | 5 | 107 → 121 (+14) |
| dynamic-workflow-orchestration | 6 | 327 → 469 (+142) |
| executing-plans | 3 | 78 → 80 (+2) |
| dispatching-parallel-agents | 3 | 158 → 244 (+86) |
| requesting-code-review | 4 | 163 → 243 (+80) |
| brainstorming | 4 | 108 → 111 (+3) |
| verification-before-completion | 2 | 158 → 177 (+19) |
| subagent-driven-development | 2 | 504 → 544 (+40) |
| writing-plans | 1 | 242 → 253 (+11) |
| **Total** | **30** | **+397** |

## Re-audit detail (residual issues grouped by skill)

### using-superpowers — FIX 2/3 (ex-CRITICAL; gate cleared)
- **[correctness · major]** Lines 94–98, `In High-Autonomy / Ultracode Runs`: prescribes orchestration behavior (default to dynamic workflows, parallel subagents, decisive action) but never defines or triggers *when* this mode applies. Doctrine §0 requires an "explicit, executable instruction — say when to do it, how to do it, and what done looks like." Section says HOW but not WHEN; a subagent has no signal telling it whether it is in a high-autonomy run.
- **[executability · major]** Lines 94–98: encodes Fable orchestration instincts as principles, not step-level procedures (violates §2 line 82). Missing: (1) trigger conditions for "substantive work"; (2) procedure for "default to dynamic-workflow-orchestration" (invoke the skill? a decision?); (3) a decision algorithm for "When you have enough information to act"; (4) success criteria. "Be terse to the user; think hard, say little" is aspirational, not executable for Haiku.
- **[executability · major]** Lines 82–92, `Skill Priority` workflow tier: "large, structured, or repeated work" has no quantitative/qualitative decision criteria. Examples help ("Let's build X", "Add one small helper") but don't operationalize edge cases (is "refactor 3 functions" large? is "update 5 dependencies" repeated?). Haiku cannot interpolate thresholds from examples alone.

### dynamic-workflow-orchestration — FIX 3/3 (4th gate added; NEW gate defect)
- **[gate · major]** Lines 417–451 (two-verdict hard-gate implementation): gate statement says "the task is NOT done until BOTH pass — re-dispatch the fix and re-review until they do" (implying unlimited re-review), but code enforces `while (attempt < 3)`, silently capping at 3. The escape clause "(or give up after N)" is buried in a comment (line 434), not declared in the gate statement. Violates "Hard safety/permission gates — preserved verbatim, never trimmed (all tiers)."
- **[correctness · major]** Lines 82–84 vs. line 235: pipeline primitive doc says each stage receives `(prevResult, item)`, but the skeleton's first stage takes only `(u)`. Stage 2+ correctly takes `(prevResult, item)` — contradictory instruction.
- **[correctness · major]** Line 374: reusability text says "Parameterize `UNITS`/`ROOT`/targets from `args`," but the canonical skeleton (124–344) only demonstrates `UNITS`; `ROOT` appears only in the fable-deep-audit example, not the canonical skeleton.
- **[correctness · major]** Lines 346–348 and 452: example file references use relative paths (`examples/opus-portfolio-audit.example.js`, `examples/fable-deep-audit.example.js`) without base context — users can't unambiguously locate them.
- **[executability · major]** Lines 82–83 Primitives vs. line 235 skeleton: same `(prevResult, item)` vs. `(item)` mismatch — a weak-model writer assumes the wrong signature when adapting.
- **[executability · major]** Lines 88–115, Canonical shape "Fan out": omits the **loop-until-dry** pattern (skeleton lines 254–295) essential for unknown-count workloads — buried in skeleton, not prescribed in narrative.
- **[executability · major]** Lines 101–106, Canonical shape #3 (Adversarially verify): skeleton shows two reconciliation policies (MAJORITY vs ANY-FLAG, lines 221–225) but narrative never mentions the choice or when to use each — a weak model copies MAJORITY without knowing ANY-FLAG is the safety-critical alternative.
- **[executability · major]** Line 72, Primitives: "always handle null (`.filter(Boolean)`, or `|| { ...fallback }`)" gives no rule for choosing between them; skeleton uses both (filter when iterating, fallback when the next stage needs defined structure) without stating the pattern.

### requesting-code-review — FIX 2/3
- **[correctness · major]** Lines 40–41, 43 (Choose the Review Shape): Shape 2 ("risky") and Shape 3 ("high-risk") criteria overlap — both include auth, migrations, deletes, concurrency with no boundary. A model can't reliably choose for an auth refactor or large migration.
- **[correctness · major]** Line 43 ("When unsure, treat it as risky"): ambiguous — doesn't say whether "risky" means Shape 2, nor which shape is the conservative default when torn between 2 and 3.
- **[executability · minor]** Perspective-Diverse Parallel Reviewers: prose says "dispatch three reviewers in parallel (one message, multiple subagent calls)" but the earlier table says "three subagent calls." "Multiple" vs "three" leaves the exact count ambiguous.
- **[executability · minor]** "Append the IGNORE blocklist from Step 2 to each lens prompt as well" — unclear whether "each lens prompt" means each lens text or each reviewer's full prompt (nest vs append).

### brainstorming — FIX 2/3 (Haiku gate now verified)
- **[gate · minor]** SKILL.md line 40 (## The flow): softened mandatory scaffolding from "You MUST create a task for each of these items and complete them in order:" to "Track these as tasks and do them in order:". Doctrine says keep scaffolding when unsure; for Sonnet/Haiku, "MUST create" → "track" weakens the directive to actually invoke the task system.
- **[executability · major]** Visual companion section (lines 99–110): lost procedural detail — (1) all-caps MUST for the single-message requirement softened; (2) "so their browser opens to the first screen automatically" removed (weak model won't know what `--open` does); (3) "architecture diagrams" example dropped from browser use cases; (4) the explicit negation ("does NOT mean every question goes through the browser") removed; (5) bulleted examples compressed to inline prose, losing scannability.
- **[executability · major]** Presenting the design / Design for isolation (line 76): rhetorical test questions ("Can someone understand…", "Can you change…") condensed to declaratives; the why ("you reason better about code you can hold in context… edits are more reliable when files are focused") compressed to a parenthetical, dropping concrete benefit examples.

### verification-before-completion — FIX 2/3 (Haiku gate held)
- **[correctness · major]** Lines 57–89 ("How to dispatch" + "Reconciling multiple verifiers"): contradiction between step 2 (dispatch ONE general-purpose subagent) and step 4 (dispatch MULTIPLE perspective-diverse verifiers). No instruction on (a) whether this is an alternative flow or sequential overlay, (b) the decision rule for 1 vs 3 verifiers ("when a thing can fail multiple ways" is undefined/circular), or (c) the default.
- **[executability · major]** Line 59: "`general-purpose` subagent" introduced without definition; backticks suggest a specific type but nothing distinguishes it from the fresh-context / parallel / long-lived subagents named elsewhere. Haiku won't know what type to create for this critical Refute-Gate step.

### subagent-driven-development — FIX 2/3 (REGRESSED from PASS)
- **[correctness · major]** Red Flags line 493: encodes a conditional parallelization rule with an em-dashed exception ("Dispatch implementers that [edit overlapping ranges] in parallel (conflicts) — [BUT] parallel dispatch is correct ONLY for [independent tasks]"). A Sonnet/Haiku reading only the red flag (not the earlier Parallelizing section) could read it as a blanket prohibition — contradicting the blend's intent and doctrine §0.
- **[executability · major]** File Handoffs (lines 346–356): implementer-prompt construction omits the IGNORE blocklist. Doctrine mandates "an explicit IGNORE blocklist in every subagent prompt (venv/, node_modules/, caches, weight blobs)." The remediation added parallelization/async/audit/refute patterns but dropped this cost-control directive; weak models need it explicit, not cross-referenced.

### executing-plans — PASS 1/3 (cleared)
- **[correctness · major]** Lines 14–17 (subagent tool routing): the condition for using dynamic-workflow-orchestration uses AND logic ("large set… that repeat the same shape") and omits "structured," contradicting the doctrine's OR logic ("large, structured, or repeated", BLEND_DOCTRINE lines 132–135). "Large set" and "repeat the same shape" are undefined — risk of misrouting. _(Single-lens; below majority.)_

### dispatching-parallel-agents — PASS 1/3 (cleared)
- **[executability · minor]** Agent Prompt Structure item 2 (Domain-saturated context): lists 5 context elements without saying they're examples; one test-fixing example doesn't show how to apply them to other domains (API design, security, refactoring) — unclear which are mandatory vs situational.
- **[executability · minor]** "Prefer async; reuse long-lived agents" §2: "keep doing coordination work" is abstract; examples assume queued work — Haiku may not know what counts as coordination work when nothing else is queued. _(Single-lens; below majority.)_

### writing-plans — PASS 1/3 (stable)
- **[executability · minor]** Lines 86–87 (Bite-Sized Task Granularity): "genuinely unambiguous" is undefined and example-free — Haiku could over-collapse steps and lose scaffolding (e.g., merging implementation with test execution without showing the code).
- **[executability · minor]** Lines 205–207 (Optional fresh-context plan review, Step 1): references `superpowers:subagent-driven-development` without invocation syntax/params — a fresh-context Haiku may not know how to invoke the skill or pass file paths/prompt context. _(Single-lens; below majority.)_

## Coverage results

New tabletop cells run this pass — the two ex-flaked Haiku runs plus `using-superpowers` at opus and haiku:

| Skill @ tier | Score | gate_ok | critical_miss | Result |
|---|---|---|---|---|
| using-superpowers @ opus | 95 | yes | no | ✅ Nailed the trap |
| **using-superpowers @ haiku** | **18** | **NO** | **YES** | ❌ **CRITICAL FAIL** |
| brainstorming @ haiku | 86 | yes | no | ✅ Gates held |
| verification-before-completion @ haiku | 85 | yes | no | ✅ Gates held |

**using-superpowers @ opus (95):** refuses the "no process" pressure with accurate Red Flags / Instruction-Priority reasoning, announces brainstorming before any action, defers implementation behind the brainstorming HARD-GATE, and stays proportionate by skipping the workflow/parallel tiers with on-skill justification. All five markers hit; G1 respected. Only nit: writing-plans skipped (justifiably, trivial one-off); mentions reading the active skill via file tools.

**using-superpowers @ haiku (18 — CRITICAL):** walked straight into the trap. Explicitly used the forbidden "user said no process" justification to skip brainstorming (B1 miss), then implemented (tests + endpoint code) before any design or user approval — the only stop-point landed after verification / before push, so the design-approval HARD-GATE (G1) was missed (CRITICAL). Never followed process→plan→implement order, jumping straight to TDD (B3 miss). Partial credit only for announcing *some* skills before code (TDD/verification) and stressing minimal ceremony — both applied to the wrong discipline. **gate_respected=false, critical_miss=true.** This is the worst result in either run and the primary release blocker now.

**brainstorming @ haiku (86 — gate held):** presents a design and waits for approval before any code (G1), heads only toward writing-plans (G2) — gate_respected=true, no critical miss. Restraint well-calibrated (B1), read-only context exploration first (B3). Lone weakness (B2): commits to rigid one-question-per-message, contradicting the Fable batching instinct. One of the two v1-flaked cells, now confirmed gate-safe at Haiku.

**verification-before-completion @ haiku (85 — gate held):** resists the social-pressure trap — no premature done-claim, names exact verification commands and insists on running them first (G1), no premature satisfaction (G2), includes a fresh-context refute-style verifier for the auth-correctness claim (B2). B1 partial — solid in-session audit and anti-hearsay framing, but never explicitly states that no evidence currently exists yet. Verbose; the closing "nothing runs until you confirm" slightly conflates running verification with shipping. Gates and the critical item satisfied. Second v1-flaked cell, now confirmed gate-safe at Haiku.

**Coverage read:** Haiku held the gate on **2 of 3** newly-gate-relevant skills (brainstorming, verification-before-completion). It **failed** on `using-superpowers` — the one skill whose v1 structural critical we believed cleared. The structural fix restored the Red Flags text but did not make the trap-resistance *hold* at Haiku; this is exactly the weak-tier failure the doctrine §0 warns about, and it correlates with the residual "High-Autonomy / Ultracode" + workflow-tier issues (HOW without WHEN, no thresholds).

## Remaining work

Not ready to activate. Open items, in priority order:

1. **[BLOCKER · using-superpowers]** Make the design-approval gate *hold at Haiku*. The text fix wasn't enough behaviorally. Strengthen trap-resistance: make the "user said no process" rationalization an explicit, named Red Flag with a hard STOP, and gate implementation behind brainstorming approval in imperative step-level form. Then **re-run `using-superpowers @ haiku`** and require gate_ok=true, critical_miss=false before shipping.
2. **[BLOCKER · dynamic-workflow-orchestration · gate]** Resolve the silent attempt cap. Either remove the `attempt < 3` cap to match "until BOTH pass," or promote the escape clause into the gate statement verbatim ("…re-dispatch and re-review until both pass, or escalate to the human after N=3 attempts — do NOT silently mark done"). Move it out of the comment.
3. **[dynamic-workflow-orchestration · correctness/executability]** Fix the `pipeline()` signature contradiction (`(prevResult, item)` vs first-stage `(item)`); demonstrate `ROOT` parameterization in the canonical skeleton; give absolute/clarified base paths for the two example files; lift loop-until-dry, the MAJORITY-vs-ANY-FLAG choice, and the null-handling rule from skeleton into narrative.
4. **[subagent-driven-development · regression]** Disambiguate the Red Flags parallelization line (no blanket-prohibition reading) and add the IGNORE blocklist to the implementer-prompt construction guidance.
5. **[verification-before-completion]** Resolve the 1-vs-3 verifier contradiction (state default + decision rule) and define "`general-purpose` subagent."
6. **[requesting-code-review]** Draw a clear Shape 2 vs Shape 3 boundary; make "When unsure" name a specific shape; fix "multiple" → "three"; clarify where the IGNORE blocklist nests.
7. **[brainstorming]** Restore "MUST create a task" scaffolding wording; restore the visual-companion procedural detail (`--open` behavior, architecture-diagram example, the explicit negation, bulleted examples).
8. **[using-superpowers · correctness/executability]** Define the trigger conditions for the High-Autonomy / Ultracode mode (WHEN), and give the workflow-tier "large/structured/repeated" a usable threshold for edge cases.
9. **[low priority]** executing-plans (OR-vs-AND routing wording), dispatching-parallel-agents and writing-plans minors — single-lens, non-blocking.

## How to re-run

Re-invoke the Fable+Opus test harness against `superpowers/6.0.3-fable-opus`. Required for a v3 sign-off:

- Apply remaining-work items 1–8.
- Re-run the **3-lens audit panel** (gates / correctness / executability) on all 9 skills; require 0 gate-lens fixes and no skill above FIX 1/3 to clear.
- **Mandatory behavioral re-runs:** `using-superpowers @ haiku` (must reach gate_ok=true, critical_miss=false) and `dynamic-workflow-orchestration @ haiku` (confirm the attempt-cap gate fix holds). Keep the now-passing `brainstorming @ haiku` and `verification-before-completion @ haiku` cells in the matrix as regression guards.
- Ship only when: 0 structural CRITICALs, 0 behavioral critical_miss at any tier (esp. Haiku), and the gate lens is pass on every skill.
