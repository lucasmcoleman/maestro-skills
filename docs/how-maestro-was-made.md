# How Maestro Was Made — a methodology memo

**Date:** 2026-06-26
**Author:** Lucas Coleman, with Claude (Opus 4.8)
**Subject:** How the Maestro skill files were generated — distilling Claude Fable 5's
operating style from its traces and encoding it into skills that run on Sonnet/Opus/Haiku.

---

## 1. The problem

Claude Fable 5 was, for a window, the best agentic coding model available. You could
hand it an open-ended overnight mission ("audit this codebase, improve it, don't stop
until you run out of work") and wake up to excellent results. Then it was pulled. The
goal of this project was to answer: **what exactly made Fable good — and how much of it
was the model versus how it *operated* — and can we reproduce the *operating* part on the
models we still have (Opus, Sonnet, Haiku)?**

The deliverable became **Maestro**: a skills plugin (a derivative of Superpowers) that
makes any Claude tier behave more like Fable did, without needing Fable.

## 2. Source material

Three inputs, in decreasing order of trust:

1. **Real Fable agent traces** — ~52 MB of Claude Code session logs from two machines
   (a Linux server and a Windows box), captured while Fable was live. These included
   Fable running as the main driver *and* the subagents it dispatched (some on Opus 4.8).
2. **Anthropic's official Claude Fable 5 prompting guide** — the vendor's own description
   of how the model is meant to operate. This is the authoritative decoder and it
   corroborated the trace analysis.
3. **The leaked Fable Claude Code system prompt** (community extraction) — used only for
   reference/cross-checking, treated as unverified.

A key limitation shaped the method: **Fable's chain-of-thought in the local traces was
encrypted** (only signatures were stored). So we could see *what Fable did* (tool calls,
outputs, orchestration structure) but not read its private reasoning. We compensated by
leaning on observable behavior plus Anthropic's guide rather than trying to reverse the
hidden reasoning.

## 3. What the traces revealed — "the magic"

Analyzing the traces (and confirming against the guide) surfaced that Fable's edge was
**partly the model and partly its operating mode**. The operating mode decomposed into:

- **An operating setting.** The best sessions ran in an "ultracode" mode: **maximum
  reasoning effort (`xhigh`) + dynamic-workflow orchestration turned on by default.**
- **A high-trust autonomous mandate.** Prompts like "I trust you, approve your own plan,
  work overnight, don't stop until you've run out of features."
- **Orchestration instincts** (the reproducible core):
  - Dispatch **parallel subagents readily**; prefer async over blocking; reuse
    long-lived subagents across subtasks.
  - **Fresh-context, refute-by-default verification** — separate skeptic subagents that
    try to *disprove* each finding beat self-critique.
  - **Dynamic workflows** — author reusable orchestration scripts (fan-out → verify →
    synthesize) instead of hand-sequencing subagents one prompt at a time.
  - **Capability-seeking** — audits didn't just hunt bugs; half the work was
    "what would make this dramatically better," with feasibility-checked proposals.
  - **Context hygiene** — read-only recon agents, IGNORE blocklists, hand bulk over as
    files, two-tier synthesis (per-unit graded report → cross-unit roadmap).
  - **Terse to the user, heavy on thinking** — dense action, little filler prose.

The important realization: **these instincts are instructions, not weights.** A lesser
model can be *told* to do them. That is the entire premise of Maestro.

## 4. The core method — how the traces became skill files

We did **not** fine-tune a model, and we did **not** feed raw traces into a model to
"transform" files. We extracted *behavioral patterns* and re-authored the skills' English
instructions so any model reproduces those patterns. Concretely:

### Step 1 — Distill the traces into a written doctrine
The trace findings + the official guide were codified into a single design contract
(`BLEND_DOCTRINE.md`): the Fable instincts to port, the Opus hygiene to keep, and the
hard safety gates to preserve verbatim.

### Step 2 — The critical reframe: the target is NOT Fable
This is the subtlety that defines the whole approach. Anthropic's guide says *"skills
developed for prior models are often too prescriptive for Fable 5 and can degrade output
quality"* — Fable was smart enough to improvise scaffolding, so heavy step-by-step rules
hurt it. **But Maestro runs on Opus/Sonnet/Haiku, not Fable.** Weaker/cheaper tiers need
*more* explicit scaffolding, not less. So the rule became:

> **Port Fable's orchestration *instincts*, but encode each as explicit, step-level
> how-to a mid/low-tier model can execute — and keep all the existing scaffolding.**
> Assume the weakest plausible runtime (down to Haiku), and never strip a safety gate.

In other words: "make it more Fable-like" means **make the model's *behavior* more like
Fable's**, achieved by writing the behavior down in detail — the opposite of how you'd
prompt Fable itself.

### Step 3 — Rewrite the skills with Opus/Sonnet subagents, orchestrated as a workflow
This is where "using them with Sonnet/Opus" happens. We ran a **dynamic workflow** (the
very Fable pattern we were encoding) over the 9 orchestration-relevant skills. Each skill
went through a pipeline of subagents running on Opus/Sonnet:

1. **Rewrite** — a subagent rewrites the stock skill to embody the doctrine (add the
   Fable instincts as executable steps; keep gates and scaffolding).
2. **Adversarial review** — a *fresh-context* subagent, prompted to refute, checks the
   rewrite against the doctrine (gates preserved? instincts encoded? still executable by
   a weak model?).
3. **Fix** — apply the review's findings.
4. **Synthesize** — reconcile cross-skill references and write the provenance docs.

Plus one net-new skill, `dynamic-workflow-orchestration`, built from Fable's and Opus's
real workflow scripts as (sanitized) exemplars.

**The method dogfooded the product:** we used Fable-derived orchestration (parallel
subagents, refute-by-default verification, dynamic workflows) *to build* the skills that
teach Fable-derived orchestration.

### Step 4 — Verify adversarially, not by self-assessment
The first review pass used a single reviewer and missed things (e.g., an over-trimmed
skill). We escalated to a **diverse-lens adversarial panel** — three independent
fresh-context lenses per skill (gate-preservation, instruction-correctness,
weak-model-executability) with a **majority vote**. It caught real defects the single
reviewer waved through.

### Step 5 — Prove it with a controlled experiment, on the target models
Because the target is Sonnet/Opus/Haiku, we validated on them — with a proper control:
a **blind A/B**, **Maestro vs stock-Superpowers vs none**, across all three tiers, **3
repetitions per cell**, judge **blinded to model and variant**, **gate-pass as the
primary metric**. Findings:

- **Maestro helps every tier, including Opus** (beyond-noise gains on most skills; two
  real gate *rescues* for Haiku).
- The earlier impression that "Opus scored worse" was a **measurement artifact** — a
  conformance-graded rubric plus a judge that had been told the model tier. It vanished
  under blinding + repetition.
- One genuine regression (one skill hurt Haiku) and two weak-tier gaps were found and
  **fixed**, then re-tested to confirm the fix.

### Step 6 — Ship
Renamed the plugin to **Maestro** (its own namespace, self-contained), preserved
Superpowers' MIT license and credit, published to GitHub, added CI for the deterministic
tests, and deployed it at user scope on both machines.

## 5. What "more Fable-like" concretely means in the files

Per skill, the rewrite added Fable behaviors as explicit instructions, e.g.:
- `dispatching-parallel-agents` — "dispatch parallel subagents readily," async reuse,
  IGNORE blocklists, refute-verify, multi-modal sweep, loop-until-dry.
- `subagent-driven-development` — parallelize genuinely independent tasks (in worktrees),
  fresh-context verifier over self-critique, audit each "done" claim against a tool result.
- `verification-before-completion` — a fresh-context refute-gate for non-trivial claims.
- `dynamic-workflow-orchestration` (new) — when/how to author reusable fan-out→verify→
  synthesize workflows, with graceful degradation for weak tiers.
- Everywhere — capability-seeking, two-tier synthesis, file handoffs, terse user output.

All of it written at a level a Haiku can execute, with the hard gates (design approval,
no-work-on-main-without-consent, evidence-before-claims, the two-verdict review loop)
kept **verbatim**.

## 6. Honest caveats

- **Encrypted CoT.** We reconstructed Fable's *behavior*, not its private reasoning.
- **Behavioral tests were tabletop** (plans/first-moves graded), not full end-to-end
  runs; the binary gate-pass metric is the trustworthy signal, scores are secondary.
- **Not yet validated on Fable itself.** Maestro is tuned for non-Fable models; whether
  it helps or hurts Fable is an open question to be answered by the same controlled A/B
  when Fable returns — not assumed.
- **Provenance, not authorship of the base.** Maestro is an MIT derivative of Superpowers
  by Jesse Vincent; the base skills' logic is his, credited throughout.

## 7. One-paragraph summary

We mined ~52 MB of Fable agent traces plus Anthropic's Fable prompting guide to extract
Fable's *operating instincts* — parallel/async subagents, refute-by-default verification,
dynamic workflows, capability-seeking, context hygiene, terse-heavy-thinking — and wrote
them down as a doctrine. We then used Opus/Sonnet subagents, orchestrated with those very
Fable patterns, to rewrite the Superpowers skills so they encode those instincts as
explicit step-level instructions a lesser model can follow — deliberately *keeping* the
prescriptive scaffolding (the opposite of how you'd prompt Fable) because the runtime is
Sonnet/Opus/Haiku, which need it. We verified the result with an adversarial diverse-lens
panel and a blinded, repeated, controlled A/B against stock, fixed what it found, and
shipped it as Maestro. Net: Fable-like *behavior* on non-Fable models, achieved with
instructions instead of weights.
