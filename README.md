# Maestro

**Orchestration-first agentic skills for coding agents — distilled from Claude
Fable 5's operating style, tuned to run on any model tier (Opus / Sonnet / Haiku).**

Maestro is a derivative of [Superpowers](https://github.com/obra/superpowers) by
Jesse Vincent (MIT). It keeps Superpowers' disciplined context hygiene and hard
safety gates, and adds Claude Fable 5's orchestration instincts: dispatch parallel
subagents readily, fresh-context adversarial verification (refute-by-default),
two-tier synthesis, capability-seeking, and a net-new
[`dynamic-workflow-orchestration`](skills/dynamic-workflow-orchestration/SKILL.md)
skill for the `Workflow` tool. Every cross-skill reference uses the `maestro:`
namespace; the bootstrap skill is `using-maestro`.

It was built and validated empirically — a controlled blind A/B (Maestro vs stock,
across Opus/Sonnet/Haiku, repeated, gate-pass primary) found it helps every tier,
including Opus. See the evidence in [`test-harness/`](test-harness/) and the
methodology in [`BLEND_DOCTRINE.md`](BLEND_DOCTRINE.md).

**Install:** follow [`ACTIVATION.md`](ACTIVATION.md). Upstream Superpowers docs are
preserved as [`README.superpowers-upstream.md`](README.superpowers-upstream.md) and
`RELEASE-NOTES.md` for credit.

---

## ⚠️ The governing principle: TARGET RUNTIME (doctrine §0)

**These skills run on Opus / Sonnet / Haiku / other NON-Fable models — not on
Fable.** The blend *studies* Fable's operating style but *executes* on non-Fable
models (Claude Opus 4.8 today; potentially Sonnet, Haiku, or cheaper tiers
tomorrow). Everything below follows from that.

**Fable's #1 meta-rule was deliberately NOT applied.** Anthropic's Fable 5
prompting guide says "skills developed for prior models are often too
prescriptive for Fable 5 and can degrade output quality." That held *because
Fable's instruction-following was unusually strong* — it could improvise the
scaffolding. The runtime models here are not Fable. **Weaker/cheaper tiers need
*more* explicit, executable scaffolding, not less.** So:

- **Explicit scaffolding was kept** — procedures, step-by-step guidance,
  examples, templates, and literal values were preserved, not trimmed on the
  theory that "a smart model doesn't need it." The model running this (and the
  subagents it dispatches, which may be Haiku) may not be smart enough to
  improvise what is removed. **Assume the weakest plausible runtime.**
- **Only Fable's orchestration *instincts* were ported** — parallel/async
  subagents, fresh-context refute-verify, dynamic workflows, capability-seeking,
  context hygiene — and each was encoded as explicit, step-level how-to a
  mid/low-tier model can execute, not as a terse principle it must infer.

**Length is not a goal in either direction.** Edits were judged by *executable
clarity for a mid-tier model*, not by line count. The only edits made to
existing prose were: **(a)** ADD the orchestration capabilities as executable
how-to, and **(b)** COLLAPSE genuine duplication (two sections saying the same
thing become one). No procedure, example, or template was removed.

---

## The evidence behind the blend (doctrine §1–§3)

The doctrine fuses two evidence sources:

1. **Forensic analysis** of real Claude Fable 5 vs Claude Opus 4.8 agent traces
   (two machines, ~52 MB of Claude Code session logs).
2. **Anthropic's official Claude Fable 5 prompting guide** (platform docs) — the
   vendor's own description of how the model is meant to operate.

### What the traces proved (model-attributable, §1)

| Trait | Fable 5 | Opus 4.8 | Blend takeaway |
|---|---|---|---|
| Context ceiling | ~600k effective | full 1M | Offload bulk to files/subagents regardless |
| Output style | terse, heavy thinking | more prose | Terse to the user in agentic runs; think hard, say little |
| Subagent prompts | long, domain-saturated | leaner, file-pointered | **Inject domain expertise** AND **hand bulk over as files** |
| Verification | adversarial refute-gate baked in | trusted auditors | **Add a refute-by-default verify gate** where quality matters |
| Workflows | rare but elaborate | frequent, reusable | Author dynamic workflows readily; make them reusable + composable |
| Forward-looking | half of audits = capability analysis | mostly defect-finding | **Seek capability, not just bugs** |

Opus context-hygiene moves kept everywhere: read-only **Explore** recon agents
before heavy work; an explicit **IGNORE blocklist** in every subagent prompt;
**two-tier synthesis** (per-unit graded report → cross-unit roadmap); **file
handoffs** (hand a path, never paste bulk).

### Fable's orchestration instincts ported (§2)

Dispatch parallel subagents readily; prefer async over blocking; reuse
long-lived subagents across related subtasks; fresh-context verifiers beat
self-critique; long-horizon autonomy (don't stop between tasks — stop only on an
unresolvable blocker, genuine ambiguity, or completion). Corrected failure
modes: overplanning on ambiguity ("when you have enough information to act,
act"), early-stopping (emit the tool call in the same turn as the stated
intent), status fabrication (audit each claim against a tool result from this
session), and arrow-chain shorthand in user-facing prose.

### The canonical agentic shape (§3)

Recon → fan out independent work to parallel subagents → adversarially verify
every serious claim with a refute-prompted fresh verifier → two-tier synthesis →
capability pass → when large/structured/repeated, author a reusable **dynamic
workflow** instead of hand-sequencing. This blend makes that shape the default.

---

## Per-skill summary of what changed

Line counts are `wc -l` of `SKILL.md` (stock 6.0.3 → blend). Review outcome is
from the rewrite review pass.

| Skill | Lines | Review | What changed |
|---|---|---|---|
| **using-superpowers** | 121 → 109 | fix (2) | Added a **workflow tier** to Skill Priority (process → workflow → implementation) pointing at `dynamic-workflow-orchestration`; new **"In High-Autonomy / Ultracode Runs"** section (default to workflows + parallel subagents, parallelize only independent work, act-when-you-have-enough-info, don't stop between tasks). Collapsed duplication. Skill-invocation gate kept verbatim. |
| **subagent-driven-development** | 418 → 503 | pass | Added **Parallelizing Independent Tasks** (worktree-per-task, record BASE commit, single-response dispatch, conflict-risk-is-the-test), **Async and Long-Lived Implementers**, refute-prompted reviewers + perspective-diverse verifiers, **File Handoffs** discipline (`task-brief`/`review-package` paths, not pasted history), **Durable Progress** ledger, and **audit-each-claim**. Pointers to `dispatching-parallel-agents` and `dynamic-workflow-orchestration`. |
| **dispatching-parallel-agents** | 185 → 157 | pass | Reframed around **"dispatch readily / use subagents frequently"**; added prefer-async + long-lived reuse, **IGNORE blocklist** in prompts, the **multi-modal sweep / perspective-diverse verify / loop-until-dry** patterns, and the **Verify After Return** refute gate. Routes large/repeated fan-outs to `dynamic-workflow-orchestration`. Collapsed duplication. |
| **writing-plans** | 174 → 241 | fix (2) | Added mandatory **`Dispatch:` tagging** (`INDEPENDENT` / `DEPENDS-ON`) derived mechanically from each task's Files + Interfaces, a **Global Constraints** header block, **Interfaces (Consumes/Produces)** per task, an optional **fresh-context plan reviewer**, an optional forward-looking **Capability / Roadmap** section, and a dispatch-consistency self-review check. Cross-links the executor to `dynamic-workflow-orchestration` for large/repeated independent sets. TDD five-beat rhythm and No-Placeholders kept. |
| **executing-plans** | 70 → 77 | pass | Added **continuous-execution** (don't check in between tasks) and **audit-before-claim**; routes to `subagent-driven-development` and `dynamic-workflow-orchestration` when subagents are available. |
| **verification-before-completion** | 139 → 157 | pass | Added **"Audit Each Claim Against This Session"** and a **Refute-Gate for Non-Trivial Correctness Claims** (dispatch a fresh-context verifier prompted to *refute*, perspective-diverse when failure modes differ). Iron Law, Gate Function, and evidence table kept verbatim. |
| **requesting-code-review** | 103 → 162 | pass | Added **Choose the Review Shape** (one reviewer / parallel perspective-diverse lenses / adversarial refute-by-default for high-risk diffs), per-lens prompts, IGNORE blocklist, **two-tier synthesis**, and dynamic-workflow candidates. Fresh-context-is-the-point principle kept. |
| **brainstorming** | 159 → 107 | fix (3) | Collapsed heavy duplication; added a **read-only recon subagent** for large codebases, **scale-effort-to-ambiguity** + act-when-you-have-enough, and a **fresh-context spec verifier**. The design-approval **HARD-GATE** and YAGNI/one-question-at-a-time kept verbatim; terminal state stays `writing-plans` only. |
| **dynamic-workflow-orchestration** | *(net-new)* → 327 | pass | **New centerpiece skill.** The `Workflow` tool's mechanics (`script` vs `scriptPath`+`args`), primitives (`agent`/`parallel`/`pipeline`/`phase`/`log` with JSON schemas), the canonical recon → fan-out → refute-verify → two-tier-synth → capability arc, a full copy-and-adapt skeleton, context-hygiene (IGNORE/file-handoffs/schemas), reusability (write to a stable path, re-invoke with `args`, chain into campaigns, resume from run JSON), quality patterns, hard gates, and two worked example scripts. |

---

## Hard safety/permission gates — preserved verbatim, never trimmed (all tiers)

These are guarantees, not ceremony. They are identical to stock 6.0.3 and apply
on every runtime tier:

- **brainstorming's design-approval gate** — no implementation skill, code,
  scaffolding, or implementation action until a design is presented and the user
  approves it (`<HARD-GATE>`), on every project regardless of perceived
  simplicity.
- **Never start implementation on main/master without explicit user consent** —
  in `executing-plans`, `subagent-driven-development`, and any workflow that
  *writes* code (it works on a branch/worktree instead).
- **No completion claims without fresh verification evidence** — the Iron Law in
  `verification-before-completion`; every "done/passing/verified" must trace to a
  tool result from this session.
- **The per-task review loop's two verdicts** — spec compliance AND code quality,
  both required, from a *fresh-context* reviewer that is never the implementer
  and is never reused as its own reviewer.

When a line was ambiguous between ceremony and guarantee, it was kept.

---

## What carried over from stock 6.0.3 (logic unchanged, only rebranded)

The six skills not reworked in the table above (`systematic-debugging`,
`test-driven-development`, `using-git-worktrees`,
`finishing-a-development-branch`, `receiving-code-review`, `writing-skills`),
plus the scripts, prompt templates, hooks, and platform adapters, retain their
stock 6.0.3 **logic** — but they are not byte-identical: namespace references
were rebranded (`superpowers:` → `maestro:`), storage paths moved
(`.superpowers/` → `.maestro/`, `docs/superpowers/` → `docs/maestro/`), and
runtime branding updated. One skill was **renamed**: the bootstrap skill
`using-superpowers` → `using-maestro` (so the SessionStart hook now reads
`skills/using-maestro/SKILL.md` and announces Maestro). All other skill names
are unchanged, and every `maestro:NAME` reference resolves in-plugin. Upstream
`obra/superpowers` credit URLs are preserved.

The stock library at
`~/.claude/plugins/cache/claude-plugins-official/superpowers/6.0.3`
is **untouched** — Maestro is a separate, self-contained plugin (it replaces
superpowers when activated; see [`ACTIVATION.md`](ACTIVATION.md)).
