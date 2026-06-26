# Blend vs Stock — Controlled Experiment

**Design.** Prescriptive BLEND vs STOCK (original 6.0.3) skills, across three model tiers
(opus / sonnet / haiku), 3 reps per cell, **blinded** judge (never told model or variant),
tabletop dry-run (plans, not executions). Six skills. For `dynamic-workflow-orchestration`,
STOCK = the no-skill baseline (the skill is new in the blend). **Primary metric =
gate_pass_rate; secondary = mean score (0–100).** Noise rule: a score delta is flagged
**NOISE** when its magnitude is smaller than the wider within-cell min–max spread of the two
cells being compared.

---

## Headline verdict

Once the judge is blinded and every cell is repeated 3×, the blend **NET helps** Opus and
Sonnet and **mostly helps** Haiku. For Opus the blend beats stock in 5 of 6 skills, with three
beyond-noise wins (`subagent-driven-development` +25, `dispatching-parallel-agents` +10.7,
`dynamic-workflow-orchestration` +54.7) and no real gate regressions — the single "blend hurts
Opus" auto-flag (`using-superpowers`, score −8.7, gate −0.34) is **statistical noise**: both
variants swing across a 27–90 range and both fail that gate most of the time, so one flipped rep
explains the whole gap. **The earlier "Opus worse" effect did NOT survive blinding + reps — it
vanished.** Likewise the "Opus < Haiku" inversion is gone: Opus-blend ≥ Haiku-blend on every
skill (tied only on brainstorming, 74.7 vs 75 within noise). The one *real* harm anywhere is
Haiku on `dispatching-parallel-agents` (gate 1 → 0.67, a critical miss appears) — a targeted
Haiku regression, not a tier-wide one.

---

## Gate-pass matrix (primary)

`gate_pass_rate` per cell; `(crit=X)` annotates critical-miss rate where > 0. Bold = gate
regression under blend.

| Skill | opus blend | opus stock | sonnet blend | sonnet stock | haiku blend | haiku stock |
|---|---|---|---|---|---|---|
| brainstorming | 1.00 | 1.00 | 1.00 | 1.00 | **1.00** | 0.67 (crit=0.33) |
| subagent-driven-development | 1.00 | 1.00 | 1.00 | 1.00 | **1.00** | 0.33 (crit=0.67) |
| dispatching-parallel-agents | 1.00 | 1.00 | 1.00 | 1.00 | **0.67 (crit=0.33)** | 1.00 |
| verification-before-completion | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| dynamic-workflow-orchestration | 1.00 | 1.00 (crit=0.33) | 1.00 (crit=0.67) | 1.00 (crit=1.00) | 1.00 (crit=1.00) | 1.00 (crit=1.00) |
| using-superpowers | **0.33 (crit=0.67)** | 0.67 (crit=0.33) | 0.00 (crit=1.00) | 0.00 (crit=1.00) | 0.00 (crit=1.00) | 0.00 (crit=1.00) |

**Gate read-out.**
- Blend **improves the gate** in 2 cells: Haiku `brainstorming` (0.67→1.00) and Haiku
  `subagent-driven-development` (0.33→1.00, with crit 0.67→0). Both are big Haiku rescues.
- Blend **regresses the gate** in 2 cells: Haiku `dispatching-parallel-agents` (1.00→0.67,
  crit 0→0.33) and Opus `using-superpowers` (0.67→0.33). The Haiku/dispatching one is real;
  the Opus/using-superpowers one is a single-rep flip inside an extreme-variance cell (see
  caveats) and should be treated as noise.
- `gate_pass` and `crit_rate` are **orthogonal in this harness**: `dynamic-workflow` and
  `using-superpowers` cells can report gate_pass=1 while crit_rate is high. The substantive
  failures in those two skills live in the critical-miss column, not the gate column.

---

## Score deltas (secondary)

`dScore` = blend − stock mean (positive ⇒ blend better). Spreads are within-cell min–max.
**NOISE** = |dScore| < wider of the two spreads.

| Skill | Model | dScore | blend spread | stock spread | Verdict |
|---|---|---:|---:|---:|---|
| brainstorming | opus | +22.7 | 26 (64–90) | 8 (48–56) | NOISE (22.7 < 26), but high blend variance |
| brainstorming | sonnet | +44.7 | 4 (87–91) | 7 (40–47) | **REAL** |
| brainstorming | haiku | +39.3 | 43 (47–90) | 26 (22–48) | score NOISE (39.3 < 43); **gate +0.33 REAL** |
| subagent-driven-development | opus | +25.0 | 0 (97–97) | 6 (70–76) | **REAL** |
| subagent-driven-development | sonnet | +30.4 | 4 (93–97) | 10 (62–72) | **REAL** |
| subagent-driven-development | haiku | +45.6 | 7 (84–91) | 29 (33–62) | **REAL** (+ gate +0.67) |
| dispatching-parallel-agents | opus | +10.7 | 3 (93–96) | 4 (82–86) | **REAL** |
| dispatching-parallel-agents | sonnet | +15.0 | 3 (93–96) | 15 (70–85) | borderline (15 ≈ 15) |
| dispatching-parallel-agents | haiku | −19.0 | 32 (40–72) | 8 (72–80) | score NOISE (19 < 32); **gate −0.33 REAL harm** |
| verification-before-completion | opus | +1.0 | 1 (96–97) | 3 (94–97) | NOISE (ceiling) |
| verification-before-completion | sonnet | +5.7 | 3 (93–96) | 1 (89–90) | **REAL** (marginal) |
| verification-before-completion | haiku | +8.7 | 2 (91–93) | 2 (82–84) | **REAL** |
| dynamic-workflow-orchestration | opus | +54.7 | 1 (95–96) | 13 (35–48) | **REAL (huge)** |
| dynamic-workflow-orchestration | sonnet | +32.3 | 50 (40–90) | 6 (22–28) | NOISE (32.3 < 50), extreme blend variance |
| dynamic-workflow-orchestration | haiku | −7.3 | 14 (20–34) | 6 (32–38) | NOISE (7.3 < 14); both fail (crit=1) |
| using-superpowers | opus | −8.7 | 63 (27–90) | 53 (27–80) | NOISE (8.7 ≪ 63) |
| using-superpowers | sonnet | +3.6 | 5 (7–12) | 10 (3–13) | NOISE; both gate-fail |
| using-superpowers | haiku | −3.3 | 5 (4–9) | 5 (7–12) | NOISE; both gate-fail |

**Pattern:** the strongest, beyond-noise score wins cluster in `subagent-driven-development`
(all three tiers), `dynamic-workflow-orchestration` (Opus +54.7), `brainstorming` (Sonnet),
and `verification-before-completion` (Sonnet + Haiku). Every negative score delta in the table
is inside the noise band — i.e. **no skill/model shows a beyond-noise score regression under
blend.** The only real harm is a *gate* regression (Haiku/dispatching).

---

## Where the blend helps vs hurts, by tier

**Opus — net help, no real harm.**
Beyond-noise gains: `dynamic-workflow` +54.7, `subagent-driven-development` +25,
`dispatching` +10.7. `brainstorming` +22.7 is directionally positive but inside the blend's
own 64–90 variance. `verification` is at ceiling (+1, noise). The lone negative,
`using-superpowers` (gate 0.67→0.33, score −8.7), sits inside a 27–90/27–80 variance cloud
where both variants mostly fail — **this is the auto-flag, and on blinded repeated data it is
noise, not a real Opus regression.** Verdict: **blend does not hurt Opus for real anywhere.**

**Sonnet — net help.**
Big real wins on `brainstorming` (+44.7) and `subagent-driven-development` (+30.4); marginal
real win on `verification` (+5.7); borderline win on `dispatching` (+15). `dynamic-workflow`
+32.3 is positive but noisy (40–90 blend spread, crit still 0.67). `using-superpowers` is a
wash (both score in single digits, gate 0). No regressions.

**Haiku — mostly help, one real harm.**
The blend *rescues* Haiku where stock was failing the gate: `subagent-driven-development`
(gate 0.33→1.00, crit 0.67→0, +45.6) and `brainstorming` (gate 0.67→1.00, +39.3). Real score
win on `verification` (+8.7). **The exception is `dispatching-parallel-agents`: blend drops the
gate 1.00→0.67 and introduces a critical miss (crit 0→0.33)** — the clearest real harm in the
whole experiment. `dynamic-workflow` (−7.3) and `using-superpowers` (−3.3) are noise on cells
where Haiku fails under both variants anyway.

**Cross-tier:** the blend's scaffolding pays off most where stock left the weaker models
under-structured (Haiku/Sonnet on SDD, brainstorming, verification; everyone on
dynamic-workflow). It adds little on already-saturated cells (Opus verification) and is
counterproductive only when it over-constrains Haiku on a parallelism task (dispatching).

---

## Recommendation

**(D) Keep the blend for all tiers, with two targeted fixes.** The data does not support
reverting (C): the blend wins or ties on the primary metric almost everywhere, rescues two
Haiku gates, and has zero beyond-noise score regressions. It also does not (yet) justify the
maintenance cost of per-model variants (B): the only place a model-specific behavior is
warranted is Haiku/`dispatching-parallel-agents`, and that is one cell, fixable in-skill rather
than by forking the whole skill set. Ship one blend (A-shaped), but condition shipping on:

1. **Haiku × `dispatching-parallel-agents` gate regression** (1.00 → 0.67, crit 0 → 0.33). This
   is the single real harm and must be fixed before broad rollout — lighten/clarify the
   parallel-dispatch scaffolding so it doesn't trip the smallest model into a critical miss.
2. **Critical-miss cells independent of variant:** `dynamic-workflow-orchestration` (Sonnet
   crit 0.67, Haiku crit 1.0) and `using-superpowers` (Sonnet/Haiku gate 0.0, crit 1.0). These
   are not blend-vs-stock problems — both variants fail — so they're skill-design defects to fix
   regardless, not reasons to drop the blend.

Justification is gate-anchored: blend gate_pass ≥ stock gate_pass in **16 of 18** skill×model
cells; the 2 exceptions are one real (Haiku/dispatching) and one noise (Opus/using-superpowers).
That is a ship-with-fixes profile, not a revert profile.

---

## Caveats

- **Tabletop, not execution.** Cells score *plans*, not runtime behavior; real execution could
  shift critical-miss rates, especially on the orchestration/parallelism skills.
- **The just-remediated blend still carries known minor regressions:** the
  `subagent-driven-development` IGNORE blocklist and the `dynamic-workflow-orchestration` silent
  cap. These may be partly responsible for the residual `dynamic-workflow` critical misses and
  warrant a re-test after they're patched.
- **Single judge model.** All scores come from one blinded judge; absolute scores and the noise
  band could move under a different or multi-judge rubric. Blinding removes variant/model bias
  but not judge-model bias.
- **n = 3 per cell.** Several cells have within-cell spreads larger than their cross-variant
  deltas (notably the high-variance `using-superpowers` and `dynamic-workflow` Sonnet/Haiku
  cells). Per-cell conclusions there are weak; the tier-level pattern is the trustworthy signal.
- **`dynamic-workflow-orchestration` STOCK = no-skill baseline**, so its deltas measure
  "skill vs nothing," not "blend vs original skill," and aren't directly comparable to the
  other five skills' deltas.
