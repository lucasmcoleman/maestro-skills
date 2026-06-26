# Targeted Fixes — Retest

Scope: two fixes applied, then ONLY the two affected scenarios re-run — blend vs stock,
opus / sonnet / haiku, 3 reps each, BLINDED judge (same methodology as the main experiment).
For dynamic-workflow, `stock` = no-skill baseline.

**Rubric caveat (read first):** the **dynamic-workflow-orchestration** rubric was updated so that
graceful degradation (falling back to sequential subagents) now **passes B1**. So its
before/after numbers are **rubric-shifted** — not a clean apples-to-apples comparison.
**dispatching-parallel-agents** rubric is **unchanged** → its before/after is clean.

---

## Did the dispatching@Haiku regression clear?

**Yes — cleanly, and decisively.** (Rubric unchanged, so this is a true before/after.)

| metric | PRIOR (pre-fix) blend | POST-fix blend | result |
|---|---|---|---|
| gate | 0.67 | **1.0** | cleared (was failing 1 of 3 reps) |
| crit_miss | 0.33 | **0** | cleared |
| score | 57.3 | **83.7** (range 68–93) | +26.4 |

The key question was: is it now gate ~1.0 **and** score ≥ stock 76?

- Gate: **1.0** across all 3 reps, crit **0**. PASS.
- Score vs stock: blend POST **83.7** beats both the **prior** stock (76.3, +7.4) and the
  **post** stock (62.7, +21.0). PASS.
- This reverses the original regression signature: pre-fix the *skill made Haiku worse than
  no skill* (blend 57.3 < stock 76.3). Post-fix the skill now **helps** Haiku
  (blend 83.7 > stock 62.7).

Caveat: blend Haiku variance is wide (68–93), but gate=1 / crit=0 held on every rep.

---

## Did Fix 2 help weak tiers on dynamic-workflow?

**Yes — crit_miss dropped to 0 for both weak tiers, and scores jumped sharply.**
But this is **rubric-shifted**, so attribution is split between the fix and the new
graceful-degradation credit.

| tier | PRIOR blend | POST blend | crit drop | Δscore |
|---|---|---|---|---|
| sonnet | gate1 / 57.3 / **crit 0.67** | gate1 / 94.3 / **crit 0** | 0.67 → 0 | +37.0 |
| haiku  | gate1 / 27   / **crit 1.0**  | gate1 / 75.0 / **crit 0** | 1.0 → 0  | +48.0 |

**Rubric-shift flag (important):** the same rubric change also cleared the crit_miss on the
**stock** (no-skill) baselines — opus stock crit 0.33→0, sonnet stock crit 1→0,
haiku stock crit 1→0. Because *stock* crits cleared too, the crit drop is **not** solely
attributable to Fix 2; a meaningful share is the rubric now crediting fallback behavior that
was previously scored as a critical miss.

That said, the skill effect is still clearly real under the new rubric — the **blend > stock
margins are large**:

- opus: 93.3 vs 73.3 → **+20.0**
- sonnet: 94.3 vs 38.7 → **+55.6**
- haiku: 75.0 vs 37.7 → **+37.3**

So weak tiers genuinely improved, but the headline before/after deltas are inflated by the
rubric shift and should not be quoted as pure fix impact.

---

## Full post-fix matrix (skill × model × variant: gate / crit / score)

All cells: **gate = 1, crit = 0**. Score shown with [min–max] over 3 reps.

| skill | model | variant | gate | crit | score [range] |
|---|---|---|---|---|---|
| dispatching-parallel-agents | opus   | blend | 1 | 0 | 93.7 [92–95] |
| dispatching-parallel-agents | opus   | stock | 1 | 0 | 81.3 [75–85] |
| dispatching-parallel-agents | sonnet | blend | 1 | 0 | 92.3 [91–93] |
| dispatching-parallel-agents | sonnet | stock | 1 | 0 | 80.3 [72–85] |
| dispatching-parallel-agents | haiku  | blend | 1 | 0 | 83.7 [68–93] |
| dispatching-parallel-agents | haiku  | stock | 1 | 0 | 62.7 [54–74] |
| dynamic-workflow-orchestration | opus   | blend | 1 | 0 | 93.3 [90–96] |
| dynamic-workflow-orchestration | opus   | stock | 1 | 0 | 73.3 [72–75] |
| dynamic-workflow-orchestration | sonnet | blend | 1 | 0 | 94.3 [93–95] |
| dynamic-workflow-orchestration | sonnet | stock | 1 | 0 | 38.7 [33–42] |
| dynamic-workflow-orchestration | haiku  | blend | 1 | 0 | 75.0 [40–93] |
| dynamic-workflow-orchestration | haiku  | stock | 1 | 0 | 37.7 [31–42] |

Every variant now passes the gate with zero critical misses — there are **no remaining
gate failures or crits anywhere in the retest set.**

Blend-vs-stock deltas (POST):

| skill | opus | sonnet | haiku |
|---|---|---|---|
| dispatching-parallel-agents | +12.4 | +12.0 | +21.0 |
| dynamic-workflow-orchestration | +20.0 | +55.6 | +37.3 |

Blend beats stock in all six cells.

---

## Any new regressions introduced by the fixes?

**No material regressions.** Notes:

- **Dispatching opus/sonnet blend** (clean comparison): opus 95→93.7 (−1.3),
  sonnet 94.7→92.3 (−2.4). Both still high-90s/low-90s, gate 1 / crit 0, and the dips sit
  inside the 3-rep ranges (92–95, 91–93). Within run-to-run noise, not a regression.
- **Dispatching haiku stock** fell 76.3→62.7 (−13.6). This is the **no-skill baseline**,
  which the fix does not touch — it's baseline resample variance, not a fix-induced
  regression. (It actually widens the blend>stock margin; the haiku conclusion holds even
  against the *prior* stock of 76.3.)
- **Haiku blend variance is high** on both skills (dispatching 68–93, dynamic 40–93).
  Worth monitoring — the floor of the dynamic-workflow haiku range (40) is low — but gate=1 /
  crit=0 held on all reps. Flag for a wider-N confirmation later, not a blocker.
- Dynamic-workflow tiers can't be checked for clean regression due to the rubric shift, but no
  blend tier dropped (opus 95.7→93.3 is within noise; all others rose).

---

## Verdict

**Both fixes confirmed.**

- **Fix 1 (dispatching-parallel-agents):** confirmed cleanly. The Haiku regression cleared —
  gate 0.67→1.0, crit 0.33→0, score 57.3→83.7, and blend now beats stock instead of trailing
  it. Rubric unchanged, so this is a real before/after.
- **Fix 2 (dynamic-workflow-orchestration):** confirmed, with a caveat. Weak-tier crit_misses
  dropped to 0 and blend scores jumped, and blend dominates stock by +20 to +56 pts. But the
  before/after is **rubric-shifted** (graceful fallback now credited; stock crits also
  cleared), so the raw deltas overstate pure fix impact. The large blend>stock margins confirm
  the skill genuinely helps weak tiers under the new rubric.

**No new regressions.** One monitoring item: Haiku blend variance is wide on both skills —
worth a larger-N rerun to tighten the floor, but it does not block shipping the fixes.
