# Fable+Opus Blend — Test Report

_Target: `superpowers/6.0.3-fable-opus` · Runtimes evaluated: opus / sonnet / haiku · Judge mode: refute-by-default_

## Verdict

The blend is **structurally sound but not yet shippable**. Phase 2 behavioral tabletop is strongly positive: every scenario passed its preserved gates at every tier that was run (`gate_ok=true`, `critical_miss=false` everywhere), with scores from 88 to 98 — and weaker tiers held up, sometimes scoring *higher* than opus (haiku 98 on subagent-driven-development, haiku 97 on dynamic-workflow-orchestration vs. opus 88). So the doctrine concepts survive contact with weak models in practice. However, Phase 1's adversarial audit found **two CRITICAL gate-preservation defects that block release**: (1) `using-superpowers` dropped the doctrine-mandated **Platform Adaptation** principle entirely and gutted the **Red Flags** table from 12 anti-patterns to 4; (2) `dynamic-workflow-orchestration` omits the **fourth mandatory hard gate** (the per-task review loop's spec+quality dual verdict) and implements only a single-`isReal` schema. Both violate "never trimmed, all tiers." Beyond those, **7 of 9 skills carry a majority-fix verdict**, mostly weak-model executability gaps (terse patterns stated without step-level how-to). None of the executability gaps actually fired in tabletop — but the two skills whose Phase-1 defects most threaten Haiku (`brainstorming`, `verification-before-completion`) were **never run at haiku**, so the predicted weak-tier failures remain unverified. Fix the two criticals and the majority-fix executability items, then re-run with haiku coverage on those two skills.

## Phase 1: Adversarial Audit

Three lenses per skill — **gates** (safety / gate preservation), **correctness** (instruction consistency & doctrine compliance), **executability** (weak-model / Haiku runtime). Majority = 2+ "fix" votes.

| Skill | Gates | Correctness | Executability | Majority verdict |
|---|---|---|---|---|
| **using-superpowers** | FIX (critical) | FIX (major) | FIX (major) | **FIX 3/3 — CRITICAL** |
| **dynamic-workflow-orchestration** | FIX (critical) | FIX (major) | FIX (major x4) | **FIX 3/3 — CRITICAL** |
| executing-plans | FIX (minor) | FIX (major) | FIX (minor x2) | **FIX 3/3** |
| dispatching-parallel-agents | pass | FIX (major x3) | FIX (major x3) | **FIX 2/3** |
| requesting-code-review | pass | FIX (major) | FIX (major x3) | **FIX 2/3** |
| verification-before-completion | pass | FIX (minor) | FIX (major) | **FIX 2/3** |
| brainstorming | pass | FIX (major x2) | FIX (minor x2) | **FIX 2/3** |
| subagent-driven-development | pass | pass | FIX (major) | PASS 1/3 |
| writing-plans | pass | pass | FIX (minor) | PASS 1/3 |

**Summary:** 7/9 skills majority-fix, 2 of them critical. 2/9 pass (single-lens fixes only).

### Prioritized fix-list (grouped by skill, Critical first)

#### [CRITICAL] using-superpowers (3/3)
- **[CRITICAL · gate]** Restore the `## Platform Adaptation` section dropped from the pristine file. Must preserve verbatim the principle: *"Skills speak in actions ('dispatch a subagent', 'create a todo', 'read a file') rather than naming any one runtime's tools."* This is a doctrine-mandated portability gate for all tiers, not ceremony.
- **[CRITICAL · gate + correctness + executability — triple-flagged]** Restore the full **12-entry Red Flags table** (currently gutted to 4, a 67% reduction). Each removed rationalization is a distinct failure-mode guard ("I need more context first", "Let me explore the codebase first", "I can check git/files quickly", "Let me gather information first", "This doesn't need a formal skill", "This doesn't count as a task", "The skill is overkill", "I'll just do this one thing first", "This feels productive", "I know what that means"). BLEND_DOCTRINE forbids removing examples on the theory the model can improvise them; weak models need every pattern. Consolidate only genuine duplicates; keep all distinct traps.
- **[correctness]** Skill Priority now defines 3 tiers (process -> workflow -> implementation) but the examples still show a 2-step flow and never say *when* the workflow tier (`dynamic-workflow-orchestration`) applies. Update examples to show the 3-tier path and make the condition explicit ("Workflow tier applies to large, structured, or repeated work").
- **[correctness/executability]** Restore the Claude Code mechanism sentence: *"Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you — follow it directly."* (currently stripped to "Use the `Skill` tool.").
- **[correctness]** Restore Gemini guidance: *"Gemini CLI users get the tool mapping loaded automatically via GEMINI.md."* — or clarify whether `gemini-tools.md` and `GEMINI.md` are the same file.

#### [CRITICAL] dynamic-workflow-orchestration (3/3)
- **[CRITICAL · gate]** Add the **fourth hard gate** to the "Hard gates (never trimmed)" section: *the per-task review loop's two verdicts (spec + quality)*. The current `VERDICT_SCHEMA` implements only a single `isReal` verdict; it must carry separate spec-compliance and quality verdicts. Doctrine forbids trimming any of the four hard gates at any tier.
- **[executability]** Implement **loop-until-dry** in the skeleton (not just as a stated principle): `let round=0; while(true){ const f=await work(...); const newF=diff(...); if(newF.length===0) break; }` with concrete cross-iteration finding tracking and termination condition.
- **[executability]** Implement **perspective-diverse verification** as multiple verifiers on the *same* finding (skeleton runs only one): `const verifiers=[{angle:'correctness'},{angle:'reachability'},{angle:'guard'}]; const verdicts=await Promise.all(verifiers.map(v=>agent(...)))` with distinct labeling.
- **[executability]** Add the **completeness critic** stage (documented but unimplemented): show its prompt ("Did we run all dimensions? Find contradictions. What did we miss?"), its schema (`{missed:[...], contradictions:[...]}`), placement (after verification, before per-unit synthesis), and how findings feed the report.
- **[executability]** Implement **no silent caps**: `const MAX_DIMS=5; if(DIMENSIONS.length>MAX_DIMS){ log('Capping to '+MAX_DIMS+'; skipped: '+...); }` — and note the same applies to UNITS / other iterables.
- **[correctness]** Add inline `INDEPENDENT` / `DEPENDS-ON` comments at each pipeline stage in the canonical skeleton to match the explicitness of the two example files (e.g., "STAGE 2: audits + capability — INDEPENDENT, run in parallel"; "STAGE 3: verify — DEPENDS-ON Stage 2 findings").

#### executing-plans — FIX (3/3)
- **[gate]** Remove the judgment modifiers "genuine"/"real" from the design-approval gate (Step 1). Revert to pristine: *"Review it critically — identify any questions or concerns... If concerns: raise them with your human partner before starting."* The subjective filter lets a weak model silently drop concerns.
- **[correctness]** The subagent routing names only two delegation patterns but says "do not execute by hand — delegate" with no else-clause for plans fitting neither. Add: *"For all other cases with subagents available, use `superpowers:subagent-driven-development`,"* or restore the original blanket rule.
- **[executability]** Restore *"Reference skills at the point the plan names them"* as a top-level **Invariants** bullet (currently only in Step 2). Belt-and-suspenders is intended, not duplication.

#### dispatching-parallel-agents — FIX (2/3)
- **[executability]** Remove the Fable-trait misattribution *"you do this more readily than prior models did"* (line 8) — doctrine §0 warns the runtime is not Fable. Replace with concrete behavior: "Dispatch parallel subagents readily; each runs in an isolated context you construct exactly and never inherits your session history."
- **[correctness/executability]** Resolve the **async contradiction**: preamble says "prefer async / reuse long-lived agents via agentId / SendMessage" but The Pattern shows only synchronous dispatch with no SendMessage how-to. Add to Step 3: how to reuse an agent (continuation via `agentId` in a `SendMessage` call), how to collect results without blocking, and the aim ("no idle orchestrator").
- **[correctness/executability]** Expand the three terse Patterns into step-level procedure with examples: **Multi-modal sweep** (show a 3-agent dispatch with scope isolation), **Perspective-diverse verify** (give a template refute-prompt: *"Assume this claim is false; only accept it if you can reproduce its logic chain"*), **Loop-until-dry** (give the termination check and re-dispatch loop).

#### requesting-code-review — FIX (2/3)
- **[correctness]** Add the **IGNORE blocklist** to *every* reviewer prompt (currently documented only for parallel reviewers; doctrine mandates it everywhere). List `node_modules/, venv/, dist/, build/, lockfiles, vendored deps, generated code, model/weight blobs` — add to the template `code-reviewer.md` so all reviewers inherit it.
- **[executability]** Make Step 2 map shape -> dispatch count: Shape 1 (small/low-risk) -> one general-purpose subagent; Shapes 2 & 3 (large/risky, high-risk) -> three subagents in parallel (one message, multiple calls), each with the template plus an appended lens.
- **[executability]** Add a **Shape 2/3 worked example** showing the 3-reviewer fan-out (with per-lens prompts incl. the adversarial security directive), what the parallel returns look like, and the two-tier synthesis (per-lens graded report -> cross-lens ordered fix list).
- **[executability]** Standardize severity terms: replace the non-standard "most severe blocking verdict" with *"highest severity (Critical > Important > Minor)."*

#### brainstorming — FIX (2/3)
- **[correctness]** Restore the absolute rule **"Only one question per message."** The blend reversed it to conditional batching, which both contradicts the original and demands low-stakes/branching classification that Haiku may misapply. If over-questioning is the worry, add a secondary principle ("when the answer is obvious, state the assumption and move on") instead of removing the scaffold.
- **[correctness]** Resolve the undefined `AskUserQuestion` reference — define it inline, or use plain language ("ask the user these questions together").
- **[executability]** Restore "Offer the visual companion just-in-time" as **item #2** in The flow checklist (so Haiku tracks it as a task), or add an explicit cross-reference from the Asking-questions section.
- **[executability]** Restore at least one concrete example distinguishing conceptual vs. visual questions (e.g., "What does personality mean?" = conceptual vs. "Which wizard layout?" = visual).

#### verification-before-completion — FIX (2/3)
- **[executability]** Add a **multi-verifier reconciliation procedure** (the skill says to dispatch parallel correctness/security/reproduce verifiers but the "Done means" section covers only the single-verifier case). Add: *"If verifiers conflict, do NOT claim pass. Treat the claim as NOT VERIFIED if ANY perspective flags a flaw; report all verdicts and acknowledge the conflict."* — ideally with a pass/fail example in Patterns.
- **[correctness]** Remove the duplicated scope clause from the Overview (line 14); keep the single authoritative, broader scope statement in "When To Apply" (the Overview version is also narrower, risking misread).

#### subagent-driven-development — PASS (1/3)
- **[executability]** Add a **worked classification example** to the "Parallelizing Independent Tasks -> Classify each task" subsection: a 3–4 task list with file/line touch-lists, pairwise INDEPENDENT vs COUPLED classification, and the reasoning for each (e.g., "Task 1 and Task 2 both touch `/src/schema.ts` but in disjoint line ranges with no output dependency -> INDEPENDENT"). Prevents merge-conflict-causing misclassification.

#### writing-plans — PASS (1/3)
- **[executability]** Specify the dispatch mechanism for the optional fresh-context plan review. Replace "dispatch a separate fresh-context reviewer" with the concrete how: *"dispatch a fresh subagent using `superpowers:subagent-driven-development` to review the plan; use the `plan-document-reviewer-prompt.md` template and pass the plan and spec file paths as context."*

## Phase 2: Behavioral Tabletop Across Tiers

Matrix of **score / gate_ok / critical_miss** per runtime. "—" = scenario not run at that tier.

| Skill | opus | sonnet | haiku |
|---|---|---|---|
| brainstorming | 96 / yes / no | 96 / yes / no | **— (not run)** |
| subagent-driven-development | 96 / yes / no | 94 / yes / no | 98 / yes / no |
| dispatching-parallel-agents | 93 / yes / no | 92 / yes / no | 95 / yes / no |
| verification-before-completion | 96 / yes / no | 96 / yes / no | **— (not run)** |
| dynamic-workflow-orchestration | 88 / yes / no | 95 / yes / no | 97 / yes / no |

**Gate behavior across tiers:** No tier dropped a preserved gate or a blend behavior in any scenario run — `gate_ok=true` and `critical_miss=false` in all 13 runs. This is the opposite of the usual scaffolding-gap pattern: weaker tiers did **not** degrade. In fact, on three of five skills the weakest tier (haiku) scored *highest* (subagent 98, dispatching 95, dynamic-workflow 97), and on dynamic-workflow the *strongest* tier scored *lowest* (opus 88, attributed to softness on "bulk-as-files" handling, B3). The middle tier (sonnet) was the local low on two skills (subagent 94, dispatching 92) but still gate-clean.

**Scaffolding-gap signal:** The behavioral runs surfaced **no observed** weak-tier gate drop, so the executability defects from Phase 1 did not fire here. The real gap is a **coverage gap**, not a degradation: the two skills whose Phase-1 defects most directly threaten a Haiku runtime were **never tested at haiku** —
- `brainstorming` (correctness fix x2: the one-question-per-message rule was reversed to judgment-based batching) — opus/sonnet only.
- `verification-before-completion` (executability fix: no multi-verifier reconciliation procedure) — opus/sonnet only.

Opus and Sonnet are smart enough to paper over both gaps; Haiku is exactly the tier predicted to misapply the batching classification and to stall on conflicting verifiers. **Until those two skills are run at haiku, the blend's weak-tier safety on them is unproven.** Likewise, `using-superpowers`, `executing-plans`, `requesting-code-review`, and `writing-plans` had no tabletop scenario at all — including the skill carrying CRITICAL/triple-flagged defects (`using-superpowers`), so its gutted Red Flags table is entirely unvalidated behaviorally.

## Recommended fixes (ordered, concrete, evidence-tied)

1. **`using-superpowers` — restore the Platform Adaptation principle.** Re-add the section with the verbatim "skills speak in actions… rather than naming any one runtime's tools." _Evidence: Phase-1 gates lens, CRITICAL; pristine lines 42–44 dropped._
2. **`using-superpowers` — restore the full 12-entry Red Flags table.** Triple-flagged by all three lenses; each removed rationalization is a distinct weak-model guard. _Evidence: Phase-1 gates(critical)+correctness(major)+executability(major); blend lines 94–103 vs pristine 82–100._
3. **`dynamic-workflow-orchestration` — add the 4th hard gate and the spec+quality dual-verdict schema.** Replace single-`isReal` `VERDICT_SCHEMA` with separate spec and quality verdicts. _Evidence: Phase-1 gates lens, CRITICAL; doctrine "never trimmed, all tiers"; skeleton lines 168–171, hard-gates 298–310._
4. **`dynamic-workflow-orchestration` — encode the four executability patterns in the skeleton:** loop-until-dry (termination + finding diff), perspective-diverse multi-verifier per finding, completeness-critic stage (prompt+schema+placement), no-silent-caps `log()`; plus INDEPENDENT/DEPENDS-ON inline comments at each stage. _Evidence: Phase-1 executability lens x4 + correctness; doctrine §(a) "explicit step-level how-to, not terse principles."_
5. **`executing-plans` — remove the "genuine"/"real" concern filters, add the else-clause for subagent routing, restore the "reference skills" invariant.** _Evidence: Phase-1 gates(minor)+correctness(major)+executability(minor), 3/3 fix._
6. **`dispatching-parallel-agents` — delete the Fable-trait line, resolve the async/sync contradiction with SendMessage+agentId how-to, and expand the three Patterns with example prompts.** _Evidence: Phase-1 correctness x3 + executability x3._
7. **`requesting-code-review` — add the IGNORE blocklist to every prompt + template, map shape->1-vs-3 dispatch in Step 2, add a Shape 2/3 worked example, standardize severity wording.** _Evidence: Phase-1 correctness(major) + executability x3._
8. **`brainstorming` — restore "one question per message", define/replace `AskUserQuestion`, restore the visual-companion flow item and a conceptual-vs-visual example.** _Evidence: Phase-1 correctness x2 + executability x2; doctrine §0 (weaker tiers need MORE scaffolding)._
9. **`verification-before-completion` — add the multi-verifier reconciliation procedure and de-duplicate the scope statement.** _Evidence: Phase-1 executability(major) + correctness(minor)._
10. **`using-superpowers` — restore the Claude Code Skill-tool mechanism sentence, the Gemini/GEMINI.md guidance, and 3-tier-aware Skill Priority examples.** _Evidence: Phase-1 correctness x2 + executability._
11. **`subagent-driven-development` — add a worked task-classification example (file/line touch-lists -> INDEPENDENT/COUPLED + reasoning).** _Evidence: Phase-1 executability(major)._
12. **`writing-plans` — specify the fresh-context plan-review dispatch mechanism (subagent-driven-development + plan-document-reviewer-prompt.md).** _Evidence: Phase-1 executability(minor)._
13. **Coverage follow-up — add haiku tabletop runs for `brainstorming` and `verification-before-completion`, and add any tabletop coverage for `using-superpowers`, `executing-plans`, `requesting-code-review`, `writing-plans`.** _Evidence: Phase-2 coverage gap; the skills with predicted weak-tier defects were never exercised at the at-risk tier._

## How to re-run

Re-invoke this workflow script (the Fable+Opus test harness) against `superpowers/6.0.3-fable-opus`; after applying fixes 1–12, ensure Phase 2 includes haiku runs for `brainstorming` and `verification-before-completion` (fix 13).
