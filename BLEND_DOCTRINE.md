# Fable + Opus Blend Doctrine

This is the shared design brief for the `superpowers` *fable-opus* skill blend.
Every skill rewrite must apply it. It fuses two evidence sources:

1. **Forensic analysis** of real Claude Fable 5 vs Claude Opus 4.8 agent traces
   (two machines, ~52MB of Claude Code session logs).
2. **Anthropic's official Claude Fable 5 prompting guide** (platform docs) —
   the vendor's own description of how the model is meant to operate.

The goal: keep Opus's disciplined context hygiene, add Fable's orchestration
instincts, and obey Fable's #1 meta-rule about skills.

---

## 0. TARGET RUNTIME — these skills run on Opus / Sonnet / Haiku / others, NOT Fable

This is the governing constraint. The blend *studies* Fable's operating style,
but it *executes* on non-Fable models — Claude Opus 4.8 today, and potentially
Sonnet, Haiku, or other/cheaper models tomorrow. Optimize for that reality.

**The Fable meta-rule does NOT transfer.** Anthropic's Fable 5 guide says
"skills developed for prior models are often too prescriptive for Fable 5 and
can degrade output quality" — but that held *because Fable's instruction-
following was unusually strong*. The runtime models here are not Fable.
Weaker/cheaper tiers (Sonnet, Haiku) need **more** explicit, executable
scaffolding, not less. **Assume the weakest plausible runtime** when deciding
how much to spell out — for both the skill itself AND the subagent prompts it
tells you to write (a dispatched subagent may be Haiku).

So the blend is: **port Fable's orchestration INSTINCTS (section 2), keep the
explicit scaffolding.** Concretely, when rewriting an existing skill the only
edits to its prose are:

- **(a) ADD** the orchestration capabilities (parallel/async subagents,
  fresh-context refute-verify, dynamic workflows, capability-seeking,
  audit-claims, context hygiene) — written as explicit, step-level how-to a
  mid/low-tier model can execute, not as terse principles it must infer.
- **(b) COLLAPSE** only genuine *duplication* — two tables or sections that say
  the same thing become one. Do NOT remove procedure, examples, step-by-step
  guidance, or templates on the theory that "a smart model doesn't need it."
  The model running this may not be smart enough to improvise it.

**Length is not a goal in either direction.** Judge every edit by *executable
clarity for a mid-tier model*, not by line count. A rewritten file may end up
shorter, the same, or modestly longer. Do not pad; do not strip scaffolding.

**Hard safety/permission gates — preserved verbatim, never trimmed (all tiers):**
- brainstorming's design-approval gate before implementation,
- "never start implementation on main/master without explicit consent,"
- verification's "no completion claims without fresh verification evidence,"
- the per-task review loop's two verdicts (spec + quality).

When unsure whether a line is ceremony or a guarantee/scaffold, **keep it.**

---

## 1. What the traces proved (model-attributable differences)

| Trait | Fable 5 | Opus 4.8 | Blend takeaway |
|---|---|---|---|
| Context ceiling | ~600k effective | full 1M | Don't fear long context; but offload bulk to files/subagents regardless |
| Compaction | rides to its ceiling | rides to ~1M | Keep the orchestrator lean so compaction is rare |
| Output style | terse to user, heavy thinking (~40% turns) | more prose | Be terse to the user in agentic runs; think hard, say little |
| Subagent prompts | long, domain-saturated | leaner, file-pointered | **Inject domain expertise** into subagent prompts AND **hand bulk over as files** |
| Verification | adversarial refute-gate baked into workflows | trusted auditors | **Add a refute-by-default verify gate** everywhere quality matters |
| Workflows | rare but elaborate, monolithic | frequent, reusable, chained | Author dynamic workflows readily; make them reusable + composable |
| Forward-looking | half of audits = capability/"moonshot" analysis | mostly defect-finding | **Seek capability, not just bugs** |

Opus context-hygiene moves worth keeping everywhere:
- **Explore (read-only) recon agents** before heavy work.
- An explicit **IGNORE blocklist** in every subagent prompt (venv/, node_modules/,
  caches, weight blobs) so subagents stay cheap and focused.
- **Two-tier synthesis**: per-unit graded report → cross-unit roadmap.
- **File handoffs**: never paste bulk into a prompt; hand a path.

---

## 2. Fable's orchestration instincts (from the official guide — apply these)

These are Fable's *instincts*. Because the runtime is non-Fable (§0), encode
each as an explicit, executable instruction — say when to do it, how to do it,
and what "done" looks like — not as a one-line principle the model must infer.

Verbatim-grounded principles to encode:

- **Dispatch parallel subagents readily.** "Claude Fable 5 dispatches parallel
  subagents more readily than prior models. Use subagents frequently." Reconcile
  with the old "never parallelize implementers": parallelize **independent**
  tasks (disjoint files, ideally isolated worktrees); keep coupled/shared-state
  tasks sequential.
- **Prefer async over blocking.** "Prefer asynchronous communication between
  orchestrator and subagents over blocking until each subagent returns."
- **Long-lived subagents.** "Long-lived subagents that keep their context across
  subtasks save time and cost through cache reads and avoid bottlenecking on the
  slowest subagent." (Use the agentId / SendMessage continuation protocol.)
- **Fresh-context verifiers beat self-critique.** "Separate, fresh-context
  verifier subagents tend to outperform self-critique." This is the backbone of
  the refute-gate.
- **Long-horizon autonomy.** Sustains multi-hour/▶multi-day goal-directed runs.
  In autonomous mode: don't stop to check in between tasks; stop only on a
  blocker you can't resolve, genuine ambiguity, or completion.

Failure modes the guide says to steer (bake the corrective into the skills):
- **Overplanning on ambiguity** → "When you have enough information to act, act."
- **Early stopping** ("I'll now run X" with no tool call) → always emit the
  tool call in the same turn as the stated intent.
- **Status fabrication on long runs** → "Audit each claim against a tool result
  from this session." (Reinforces verification-before-completion.)
- **Context-budget anxiety** → you have ample context; don't offer to hand off
  or summarize unprompted.
- **Arrow-chain shorthand** ("A → B → fails") → fine for thinking, NOT for
  user-facing summaries; write those in plain prose.
- **Unrequested tidying/refactoring** at high effort → respect YAGNI and scope.

---

## 3. The canonical agentic shape (what "good" looks like after the blend)

For any non-trivial analyze/build/improve task:

1. **Recon** (Explore agents, read-only, IGNORE-list) → structured map.
2. **Fan out** independent work to parallel subagents, each prompt
   domain-saturated and self-contained, bulk passed as files.
3. **Adversarially verify** every serious finding/claim with a fresh-context
   verifier prompted to *refute* (default to "not real" unless the logic chain
   reproduces). Use perspective-diverse verifiers (correctness / security /
   does-it-reproduce) when a thing can fail multiple ways.
4. **Synthesize** two-tier: graded per-unit report → prioritized roadmap.
5. **Seek capability**, not just defects: include a feasibility-checked
   "what would make this dramatically better" pass with concrete approaches.
6. When the work is large, structured, or repeated → author a **dynamic
   workflow** (see the new `dynamic-workflow-orchestration` skill) instead of
   hand-sequencing subagents; make it reusable (scriptPath + args) and chain
   workflows into campaigns.

This shape is exactly what Fable's elaborate audit workflows and Opus's
portfolio-audit workflow both implement; the blend makes it the default.
