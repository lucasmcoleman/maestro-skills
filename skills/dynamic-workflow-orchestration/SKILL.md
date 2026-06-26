---
name: dynamic-workflow-orchestration
description: Use when an analyze/build/improve task needs many coordinated subagents — large or multi-target audits, codebase/framework migrations, parallel fan-out over a batch of files/repos/endpoints, cross-cutting reviews, or any orchestration job too big to hand-sequence. Author a reusable Workflow script instead of dispatching subagents one prompt at a time.
---

# Dynamic Workflow Orchestration

## Overview

The **Workflow tool** runs a small JavaScript script that fans work out to many
subagents — in parallel and in stages — and returns one structured result. You
write the script; the orchestrator stays lean while the heavy reading happens in
disposable subagent contexts. The runtime auto-saves the script and the result
to disk, so a workflow is also a re-runnable, chainable tool.

**Core principle:** when the work is large, structured, or repeated, *author a
workflow* — don't hand-sequence subagents in chat. A workflow is code: it
parallelizes, enforces output schemas, refute-verifies findings, and re-runs
over a new batch by changing one argument.

## When NOT to author a workflow (graceful degradation)

**Read this BEFORE you write a single line of script.** Authoring a CORRECT
dynamic-workflow script is demanding. If you are not confident you can write a
correct orchestration script — because the task is simple, or you are a
smaller/faster model — DO NOT attempt it. Fall back to
**maestro:dispatching-parallel-agents** (parallel one-shot fan-out) or
**maestro:subagent-driven-development** (sequential with review). A correct
sequential approach beats a broken workflow every time.

Concretely, choose the fallback when ANY of these is true:
- The task is small enough to hand-sequence in 2–4 subagent dispatches.
- You cannot confidently reason about async control flow, schema coercion, and
  termination conditions in the script below.
- You are running on a smaller/faster tier and the orchestration logic would be
  error-prone to author. A workflow that silently caps, never terminates, or
  drops units is worse than no workflow — degrade gracefully instead.

## When to author a workflow vs. sequential subagents

Author a **workflow** when two or more of these hold:
- The work spans **many units** (files, subsystems, repos, endpoints) that can be
  read independently.
- The shape **repeats** per unit (recon → review → synthesize), or you'll run it
  again on another batch.
- You want **adversarial verification** or **two-tier synthesis** baked in, not
  improvised turn by turn.
- The fan-out is large enough that doing it by hand would blow your own context.

Use plain **maestro:dispatching-parallel-agents** (a few one-shot subagents
in one turn) when there are only 2–4 independent tasks, no repeated shape, and no
reuse. Use **maestro:subagent-driven-development** when tasks share state and
must run **sequentially** with per-task review.

Coupled / shared-state work (editing the same files) stays sequential **inside**
a workflow too — parallelize only disjoint units.

## How to invoke the Workflow tool

The mechanics, concretely:

1. **First run — pass `script`.** Call the `Workflow` tool with one parameter,
   `script`: the full JavaScript source as a string (the shapes below). The
   runtime executes it, saves the source to
   `<projectDir>/workflows/scripts/<name>-<runId>.js`, and writes the metadata +
   your returned object to `<projectDir>/workflows/<runId>.json` (the `result`
   field). It returns that result to you.
2. **Re-run — pass `scriptPath` (+ optional `args`).** To run the same logic
   again, call `Workflow` with `scriptPath` (the saved path, or any project path
   you wrote the script to) instead of `script`. Add `args` — a JSON-serializable
   **array** — to parameterize the batch.
3. **Read `args` inside the script.** The runtime exposes a top-level `args`
   variable (the array you passed). Drive the batch from it, with a fallback:
   ```js
   const TARGETS = (args && args.length) ? args : DEFAULT_TARGETS
   ```
   Real example: a grading workflow saved to a project path, re-invoked with
   `args: ["model-a","model-b",...]` to grade a different model set each run.

**Done = the tool returns your structured result object and the run JSON exists
on disk.** That file is your audit trail and your resume point.

## Primitives

A workflow script `export`s `meta`, then runs top-level `await` code and
`return`s a value. The runtime provides these globals:

- `agent(prompt, { label, phase, schema, agentType })` → Promise of the
  structured object, **or `null` if the agent failed — always handle null**
  (`.filter(Boolean)`, or `|| { ...fallback }`).
  - `schema`: a JSON Schema (`type:'object'`, `additionalProperties:false`,
    `required:[...]`) that coerces the agent's output. **Always pass one** so the
    next stage can consume the result programmatically.
  - `agentType: 'Explore'` → read-only recon agent (cheap, can't write). Omit for
    general work agents.
  - `label` / `phase`: progress + audit-trail tags; group agents by stage.
- `parallel(fns)` → runs `[() => agent(...), ...]` concurrently, resolves to the
  results array (order preserved). Note: an **array of thunks** (`() => ...`),
  not an array of promises.
- `pipeline(items, stage1, stage2, ...)` → maps each item through the stages;
  each stage receives `(prevResult, item)`. **Default to this** — each unit flows
  recon→work→synth without waiting on the slowest sibling.
- `phase(title)` / `log(msg)` → progress markers; `log` also lands in the run
  JSON, so use it to record caps/skips (see Quality patterns).

## The canonical shape

Every non-trivial audit/build/migrate workflow follows this arc (both example
scripts implement it). For each stage: *when* to run it, *how*, and *done*.

1. **Recon** — *when:* always, before heavy work. *How:* read-only `Explore`
   agents, one per unit, each carrying the IGNORE blocklist, returning a
   structured map (purpose, key source files, tests, gotchas). *Done:* every unit
   has a curated `key_source_files` list the next stage can target.
2. **Fan out** — *when:* the real per-unit work (audit/build/migrate). *How:*
   parallel domain-saturated subagents, one per (unit × dimension), bulk passed
   as **file paths not pasted text**, severity calibration and known gotchas
   inlined. *Done:* each unit has structured findings/output.
3. **Adversarially verify** — *when:* for every serious finding/claim (and any
   completion claim). *How:* a *fresh* verifier per finding, prompted to
   **refute** it; default `isReal=false` unless the logic chain reproduces in the
   actual code. Use perspective-diverse verifiers (correctness / security /
   does-it-reproduce) when a thing can fail multiple ways. *Done:* findings split
   into confirmed vs. refuted, with reasoning.
4. **Two-tier synthesis** — *when:* after verification. *How:* one synth agent
   per unit produces a graded report (health grade + severity counts); then one
   cross-unit agent produces a prioritized roadmap. *Done:* per-unit reports +
   one ranked roadmap.
5. **Capability pass** — *when:* whenever the goal is "make this better," not just
   "find defects." *How:* a feasibility-checked "what would make this dramatically
   better" stage — concrete approaches, honest easy/moderate/hard/blocked
   ratings, verified against real APIs/docs (WebSearch/WebFetch if needed).
   *Done:* a ranked capability/gap list, not just a bug list.

## A complete skeleton you can adapt

This merges both examples: the portfolio's reusable, data-driven, `args`-driven
recon + IGNORE + two-tier synthesis as the skeleton, with the deep-audit's
adversarial refute-gate and capability pass wired into each unit. Copy, then
edit the tables and prompts.

```js
export const meta = {
  name: 'unit-audit',
  description: 'Recon -> loop-until-dry per-dimension audit -> perspective-diverse refute-gate -> completeness critic -> graded report -> roadmap, per unit',
  phases: [
    { title: 'Recon', detail: 'Explore-map each unit' },
    { title: 'Audit', detail: 'loop-until-dry: parallel dimension auditors + capability pass, re-run until dry' },
    { title: 'Verify', detail: 'perspective-diverse refute-gate per finding, then a completeness critic' },
    { title: 'Synthesize', detail: 'graded per-unit report' },
    { title: 'Roadmap', detail: 'cross-unit prioritized roadmap' },
  ],
}

// IGNORE blocklist — paste into every prompt so subagents stay cheap + on-target.
const IGNORE = `IGNORE entirely (do not read — bulk data/deps/caches): venv/ .venv/
node_modules/ __pycache__/ *.egg-info/ .git/ build/ dist/ data/ logs/ and binary
blobs (*.gguf *.safetensors *.bin *.pt *.onnx *.img *.zip). Read source, configs,
scripts, tests, docs only.`

// ── Tunables: loop-until-dry termination + no-silent-caps ceilings ──
const K_EMPTY    = 2         // stop a unit's audit after K consecutive rounds that surface NOTHING new
const MAX_ROUNDS = 6         // hard ceiling so the loop ALWAYS terminates
const UNIT_CAP   = Infinity  // set to a number to cap units/run (cost guard); capWithLog records what's dropped
const DIM_CAP    = Infinity  // set to a number to cap dimensions/unit

// No silent caps: trim to `max`, but log() EXACTLY what was dropped so it lands in the run JSON.
function capWithLog(items, max, label, nameOf = x => (x && x.name) || String(x)) {
  if (!max || items.length <= max) return items
  const skipped = items.slice(max).map(nameOf)
  log(`CAP: ${label} limited to ${max}/${items.length}; SKIPPED (NOT processed): ${skipped.join(', ')}`)
  return items.slice(0, max)
}

// Cross-round identity of a finding — drives the seen-set diff in loop-until-dry.
const fingerprint = f => `${f.dimension}|${(f.location || '').toLowerCase()}|${(f.title || '').toLowerCase()}`

// Data-driven batch — overridable per run via args (paths or unit specs).
const DEFAULT_UNITS = [
  { name: 'svc-a', path: '/repo/svc-a', hint: 'known gotcha: X is intentional, do not report it' },
]
const rawUnits = (args && args.length) ? args.map(a => (typeof a === 'string' ? { name: a, path: a } : a)) : DEFAULT_UNITS
const UNITS = capWithLog(rawUnits, UNIT_CAP, 'units')   // no-silent-caps: logs any units dropped by the cap

const DIMENSIONS = [
  { key: 'correctness', brief: 'Real bugs: broken invariants, races, edge cases, silently-ignored args. file:line evidence + concrete failure scenario.' },
  { key: 'security',    brief: 'Secrets on disk, injection, path traversal, missing authn, network exposure. Calibrate severity to the real threat model.' },
  // ...add architecture / quality-ops / etc.
]

const RECON_SCHEMA = { type:'object', additionalProperties:false,
  properties: { purpose:{type:'string'}, key_source_files:{type:'array',items:{type:'string'}},
    test_command:{type:'string'}, notes_for_auditors:{type:'string'} },
  required: ['purpose','key_source_files','notes_for_auditors'] }
const FINDINGS_SCHEMA = { type:'object', additionalProperties:false,
  properties: { strengths:{type:'array',items:{type:'string'}},
    findings:{type:'array',items:{type:'object',additionalProperties:false,
      properties:{ severity:{type:'string',enum:['critical','high','medium','low']},
        title:{type:'string'}, location:{type:'string'}, evidence:{type:'string'},
        impact:{type:'string'}, recommendation:{type:'string'} },
      required:['severity','title','recommendation'] }},
    summary:{type:'string'} },
  required:['findings','summary'] }
// VERDICT_SCHEMA judges a CLAIM (a finding), not a deliverable — single isReal is correct here.
// (Reviewing implementation WORK uses the dual-verdict REVIEW_SCHEMA — see Hard gates.)
const VERDICT_SCHEMA = { type:'object', additionalProperties:false,
  properties:{ isReal:{type:'boolean'}, reasoning:{type:'string'},
    adjustedSeverity:{type:'string',enum:['critical','high','medium','low','not-a-bug']} },
  required:['isReal','reasoning','adjustedSeverity'] }
const COMPLETENESS_SCHEMA = { type:'object', additionalProperties:false,
  properties:{ missed:{type:'array',items:{type:'string'}}, contradictions:{type:'array',items:{type:'string'}} },
  required:['missed','contradictions'] }
const CAPABILITY_SCHEMA = { type:'object', additionalProperties:false,
  properties:{ gaps:{type:'array',items:{type:'object',additionalProperties:false,
    properties:{ capability:{type:'string'}, value:{type:'string',enum:['transformative','high','medium','low']},
      feasibility:{type:'string',enum:['easy','moderate','hard','blocked']}, approach:{type:'string'} },
    required:['capability','value','feasibility','approach'] }} },
  required:['gaps'] }
const REPORT_SCHEMA = { type:'object', additionalProperties:false,
  properties:{ health_grade:{type:'string'}, exec_summary:{type:'string'},
    top_priorities:{type:'array',items:{type:'string'}}, report_markdown:{type:'string'} },
  required:['exec_summary','top_priorities','report_markdown'] }

// Perspective-diverse verification: dispatch MULTIPLE verifiers on the SAME finding,
// each with a DISTINCT angle, in parallel; reconcile their votes (majority OR any-flag).
const VERIFY_ANGLES = [
  { key:'reachability', ask:'Is the bad path actually REACHABLE from a real entry point? Trace the call chain. If you cannot reach it, isReal=false.' },
  { key:'guard',        ask:'Is it ALREADY GUARDED (validation, try/catch, an upstream check, a documented invariant) or intentional per CLAUDE.md? If so, isReal=false.' },
  { key:'correctness',  ask:'Does the logic chain REPRODUCE the claimed failure step-by-step against the real code? If it does not reproduce, isReal=false.' },
]
async function verifyFinding(u, f) {
  // The angles are INDEPENDENT of each other -> run them in parallel on the one finding.
  const verdicts = (await parallel(VERIFY_ANGLES.map(an => () => agent(
    `Skeptical ${an.key} verifier. A reviewer claims this ${f.severity} issue in ${u.name} at ${f.location || '?'}:\n` +
    `TITLE: ${f.title}\nCLAIM: ${f.evidence || f.title}\n${IGNORE}\n` +
    `YOUR ANGLE: ${an.ask}\nRead the ACTUAL code. Default isReal=false unless YOUR angle confirms it. Return the structured object.`,
    { phase:'Verify', label:`verify:${u.name}:${an.key}:${(f.title || '').slice(0,30)}`, schema:VERDICT_SCHEMA })
  ))).filter(Boolean)
  const realVotes = verdicts.filter(v => v.isReal).length
  // Reconciliation — pick ONE policy per workflow:
  //   MAJORITY (below): real only if > half the angles agree -> fewer false positives.
  //   ANY-FLAG: swap in `realVotes >= 1` -> one angle catching it is enough; use for safety-critical work.
  const isReal = realVotes >= Math.ceil(verdicts.length / 2)
  return { ...f, isReal, verifierVotes: `${realVotes}/${verdicts.length} angles`, verdicts }
}

// Pipeline: each unit flows recon -> loop-until-dry(audit+verify) -> completeness -> synth.
const reports = await pipeline(UNITS,

  // ── STAGE 1 · RECON ───────────────────────────────────────────────
  // INDEPENDENT across units (a unit's recon needs nothing from its siblings);
  // the pipeline runs them concurrently. DEPENDS-ON: nothing.
  (u) => agent(
    `RECON for an audit. Unit: ${u.name} at ${u.path}. ${u.hint || ''}\n${IGNORE}\n` +
    `Map purpose, the most-important source files an auditor should read, how to run tests, ` +
    `and notes_for_auditors (gotchas, what's intentional). Return the structured object.`,
    { phase:'Recon', label:`recon:${u.name}`, schema:RECON_SCHEMA, agentType:'Explore' }),

  // ── STAGE 2-5 · AUDIT(loop-until-dry) -> VERIFY(perspective-diverse) -> COMPLETENESS -> SYNTH
  // DEPENDS-ON: THIS unit's recon only. INDEPENDENT across units (pipeline runs units concurrently).
  async (recon, u) => {
    // Capability pass is INDEPENDENT of the audit loop -> kick it off now, await it at synth time.
    const capabilityPromise = agent(
      `Capability strategist for ${u.name} at ${u.path}.\n${IGNORE}\n` +
      `What would make this dramatically better? Concrete approaches with honest ` +
      `easy/moderate/hard/blocked feasibility; verify API claims via docs, don't assume. Return the structured object.`,
      { phase:'Audit', label:`capability:${u.name}`, schema:CAPABILITY_SCHEMA })

    // no-silent-caps: cap dimensions per unit, logging any dropped.
    const DIMS = capWithLog(DIMENSIONS, DIM_CAP, `dimensions for ${u.name}`, d => d.key)

    // ---- LOOP UNTIL DRY ----
    // Re-run audit rounds until K_EMPTY consecutive rounds surface NOTHING new.
    // `seen` carries finding fingerprints ACROSS rounds; `fresh` is the per-round diff (new vs seen).
    const seen = new Set()
    const confirmed = [], refuted = [], minor = []
    let emptyRounds = 0, round = 0
    while (emptyRounds < K_EMPTY && round < MAX_ROUNDS) {
      round++
      // STAGE 2 · AUDIT round — dimensions are INDEPENDENT of each other -> parallel.
      // DEPENDS-ON: recon (for key_source_files); each round also depends on prior rounds' `seen`.
      const audits = await parallel(DIMS.map(d => () => agent(
        `Senior ${d.key} auditor for ${u.name} at ${u.path} (audit round ${round}).\n` +
        `Recon notes: ${recon?.notes_for_auditors || 'none'}\n` +
        `Start with: ${(recon?.key_source_files || []).join(', ') || 'discover them'}\n${IGNORE}\n` +
        `YOUR DIMENSION: ${d.brief}\n` +
        (round > 1 ? `Earlier rounds already logged some findings — hunt for DIFFERENT, deeper ones; don't repeat.\n` : '') +
        `Read the actual code; ground every finding in file:line evidence. ` +
        `Severity: critical=data loss/crash in normal use; high=wrong results in realistic use; ` +
        `medium=edge case; low=polish. Note real strengths too. Return the structured object.`,
        { phase:'Audit', label:`${u.name}:${d.key}:r${round}`, schema:FINDINGS_SCHEMA })
      ))
      const roundFindings = audits.filter(Boolean)
        .flatMap((a, i) => (a.findings || []).map(f => ({ ...f, dimension: DIMS[i].key })))
      // diff: keep only fingerprints we have NOT seen in any prior round.
      const fresh = roundFindings.filter(f => !seen.has(fingerprint(f)))
      fresh.forEach(f => seen.add(fingerprint(f)))
      if (fresh.length === 0) {
        emptyRounds++
        log(`${u.name} round ${round}: 0 new findings (empty round ${emptyRounds}/${K_EMPTY})`)
        continue                              // termination: K_EMPTY consecutive empty rounds ends the loop
      }
      emptyRounds = 0                          // any new finding resets the empty-round counter
      log(`${u.name} round ${round}: ${fresh.length} new findings`)
      // STAGE 3 · VERIFY — perspective-diverse refute-gate on the fresh SERIOUS findings.
      // DEPENDS-ON: this round's findings. Findings are INDEPENDENT of each other -> parallel
      // (and each finding's angles are parallel inside verifyFinding).
      const serious = fresh.filter(f => f.severity === 'critical' || f.severity === 'high')
      const verdicts = (await parallel(serious.map(f => () => verifyFinding(u, f)))).filter(Boolean)
      for (const r of verdicts) (r.isReal ? confirmed : refuted).push(r)
      // fresh non-serious findings are kept as minor (no gate needed at low severity).
      fresh.filter(f => f.severity !== 'critical' && f.severity !== 'high').forEach(f => minor.push(f))
    }
    // No silent caps on the discovery loop: the REAL termination is K_EMPTY consecutive empty
    // rounds (in the `while` condition above). MAX_ROUNDS is only a safety ceiling — if we stopped
    // because we hit it (not because we went dry), say so LOUDLY so it lands in the run JSON.
    if (round >= MAX_ROUNDS && emptyRounds < K_EMPTY)
      log(`CAP: ${u.name} hit MAX_ROUNDS=${MAX_ROUNDS} before going dry (last round STILL surfaced ` +
          `new findings); audit may be INCOMPLETE — raise MAX_ROUNDS or accept the gap. ` +
          `Real termination is ${K_EMPTY} consecutive empty rounds, not this ceiling.`)

    // ── STAGE 4 · COMPLETENESS CRITIC ── after verification, before synthesis.
    // DEPENDS-ON: this unit's confirmed findings + the dimension list. INDEPENDENT across units.
    const completeness = await agent(
      `Completeness critic for the audit of ${u.name} at ${u.path}.\n${IGNORE}\n` +
      `Dimensions we ran: ${DIMS.map(d => d.key).join(', ')} over ${round} round(s).\n` +
      `Confirmed findings: ${JSON.stringify(confirmed.map(f => ({ title:f.title, location:f.location, dimension:f.dimension })))}\n` +
      `Your ONLY job is to catch what we missed. Answer: (1) Did we run all dimensions this unit needs ` +
      `(any that don't apply, or one we should have added)? (2) Find contradictions between findings. ` +
      `(3) What did we miss — whole files/areas/entry points never audited? Return {missed:[...], contradictions:[...]}.`,
      { phase:'Verify', label:`completeness:${u.name}`, schema:COMPLETENESS_SCHEMA }) || { missed:[], contradictions:[] }
    if (completeness.missed.length || completeness.contradictions.length)
      log(`${u.name}: completeness critic flagged ${completeness.missed.length} gap(s), ${completeness.contradictions.length} contradiction(s)`)

    // ── STAGE 5 · SYNTHESIS ── DEPENDS-ON this unit's confirmed/minor/capability/completeness.
    // INDEPENDENT across units. The completeness critic's output feeds the report directly.
    const capability = await capabilityPromise
    const report = await agent(
      `Lead author: synthesize a graded audit report for ${u.name} (${round} audit round(s)).\n` +
      `Confirmed serious: ${JSON.stringify(confirmed)}\nMinor: ${JSON.stringify(minor)}\n` +
      `Capability gaps: ${JSON.stringify(capability?.gaps || [])}\n` +
      `Completeness — gaps the critic flagged: ${JSON.stringify(completeness.missed)}; ` +
      `contradictions to resolve: ${JSON.stringify(completeness.contradictions)}\n` +
      `Produce report_markdown (identity + grade; exec summary; what's right; findings by severity with file:line; ` +
      `a "Coverage gaps & open questions" section built from the completeness critic; ` +
      `capability roadmap by value-to-effort; ordered next steps). Don't invent findings. Return the structured object.`,
      { phase:'Synthesize', label:`report:${u.name}`, schema:REPORT_SCHEMA })
    log(`${u.name}: ${confirmed.length} confirmed / ${refuted.length} refuted across ${round} round(s)`)
    return { name: u.name, confirmed, refuted, minor, capability, completeness,
      ...(report || { exec_summary:'synth failed', top_priorities:[], report_markdown:'' }) }
  })

const ok = reports.filter(Boolean)

// ── STAGE 6 · ROADMAP ── DEPENDS-ON: ALL units' reports (a barrier — must wait for the
// whole pipeline). This is the ONE stage that is not independent across units.
phase('Roadmap')
const roadmap = await agent(
  `Principal engineer. Below are per-unit audit summaries. Write a cross-unit prioritized roadmap (markdown): ` +
  `at-a-glance table (unit | grade | crit/high count | one-line verdict), cross-cutting themes, a single ranked ` +
  `list of highest-leverage work tagged by unit + effort S/M/L (security/data-loss at top), quick wins, ` +
  `and a "Coverage gaps" note aggregating each unit's completeness critic.\n` +
  ok.map(r => `\n## ${r.name} — ${r.health_grade || 'n/a'}\n${r.exec_summary}\nTop: ${JSON.stringify(r.top_priorities)}` +
    `\nCoverage gaps: ${JSON.stringify(r.completeness?.missed || [])}`).join(''),
  { phase:'Roadmap', label:'roadmap', schema:{ type:'object', additionalProperties:false,
    properties:{ roadmap_markdown:{type:'string'} }, required:['roadmap_markdown'] } })

return { reports: ok, roadmap_markdown: roadmap?.roadmap_markdown || '(roadmap synthesis failed)' }
```

See [examples/portfolio-audit.example.js](examples/portfolio-audit.example.js)
for the full pipeline form and [examples/deep-audit.example.js](examples/deep-audit.example.js)
for `parallel`/`pipeline` mixed with `Promise.all` across concurrent phases.

## Context hygiene (the part that keeps it cheap)

- **IGNORE blocklist in every subagent prompt.** A reusable constant (as above)
  listing `venv/ node_modules/ __pycache__/ .git/ build/ dist/ data/ logs/` and
  binary blobs (`*.gguf *.safetensors *.bin *.pt *.onnx *.img *.zip`). Subagents
  read source/config/docs only.
- **Explore recon first** so later agents get a curated `key_source_files` list
  instead of re-globbing the world.
- **File handoffs, never bulk paste.** Hand a path; let the subagent read it. The
  one exception is small structured handoffs *between stages* (a finding's
  claim/location passed to its verifier) — those are cheap and necessary.
- **Schemas everywhere.** Structured output is what lets stage N+1 consume stage
  N programmatically.
- **Inject domain expertise** into each prompt: known gotchas, "don't report what
  CLAUDE.md already documents as intentional," severity calibration. Lean on
  schemas for *shape*, saturate the prose for *judgment* — even a Haiku-tier
  subagent needs the judgment spelled out, not implied.

## Reusability — a workflow is a tool, not a one-off

- **Write the script to a stable project path** (e.g. `.claude/workflows/audit.js`
  or a reports dir) and invoke it via `scriptPath`. That decouples the tool from
  any single run. (Real workflows have been re-invoked from such paths.)
- **Re-invoke `scriptPath` + `args` over a new batch.** Parameterize
  `UNITS`/`ROOT`/targets from `args` (see the skeleton's `args && args.length`
  guard) instead of hardcoding. One script, many runs.
- **Chain into campaigns.** Feed one workflow's structured `result` (e.g.
  confirmed findings) as the `args` of the next (e.g. a verify-then-fix
  workflow). Audit → fix-plan → implement-and-verify is three chained workflows.
- **Resume** long runs from the on-disk run JSON and per-unit reports: re-run only
  the units missing an output rather than the whole sweep.

## Quality patterns

The skeleton above implements the first four concretely (loop-until-dry,
no-silent-caps, perspective-diverse verify, completeness critic); this section is
the rationale and the knobs.

- **Loop until dry.** When recon can't bound the work up front (unknown count of
  findings/targets), iterate the work→verify stage until a pass yields nothing
  new — don't stop at an arbitrary first batch.
- **No silent caps.** If you cap fan-out width for cost, `log()` the cap and what
  was skipped so it lands in the run JSON. Never quietly drop units; an unaudited
  unit must be visible.
- **Perspective-diverse verification.** Refute serious findings from multiple
  angles when failure modes differ; fresh-context verifiers beat self-critique.
- **Completeness critic.** End large sweeps with one agent whose only job is to
  find what the workflow *missed* (skipped units, dimensions never run,
  contradictions between reports).
- **Grade, don't just list.** Per-unit health grade + severity counts make the
  cross-unit roadmap rankable.
- **Seek capability, not just defects.** Keep the capability pass — half the value
  of an audit is "what should this become," with feasibility checked.

## Hard gates (never trimmed)

- **Refute-by-default verify gate** is mandatory wherever quality matters: a
  finding is not "real" until a fresh verifier reproduces its logic chain in the
  actual code.
- **No completion claims without fresh evidence.** The workflow's own summary must
  be grounded in this run's tool results / structured outputs — audit each claim
  against an actual stage result, never fabricate status
  (**maestro:verification-before-completion**).
- **Never start implementation on main/master without explicit consent.** If a
  workflow *writes* code (migration/fix campaigns), it works on a branch/worktree
  per **maestro:using-git-worktrees**; design-changing work clears
  **maestro:brainstorming**'s approval gate first.
- **Per-task review loop = TWO verdicts (spec compliance + code quality).** When a
  workflow *reviews implementation work* (any stage that wrote code — a fix,
  migration, or build task), the reviewer subagent must return SEPARATE verdicts:
  one for **spec compliance** (does it meet every stated requirement?) and one for
  **code quality** (is it correct, clear, safe?). Never collapse them into a single
  pass/fail. A finding-*refute* gate may stay single-`isReal` (it judges a claim,
  not a deliverable); a review-*of-work* must be dual-verdict, and the task is NOT
  done until BOTH pass — re-dispatch the fix and re-review until they do:

  ```js
  const REVIEW_SCHEMA = { type:'object', additionalProperties:false, properties:{
    spec:    { type:'object', additionalProperties:false,
      properties:{ pass:{type:'boolean'}, violations:{type:'array',items:{type:'string'}} }, required:['pass','violations'] },
    quality: { type:'object', additionalProperties:false,
      properties:{ pass:{type:'boolean'}, issues:{type:'array',items:{type:'string'}} }, required:['pass','issues'] },
  }, required:['spec','quality'] }

  // EXPLICIT, NAMED cap so the loop ALWAYS terminates — and hitting it is LOGGED, never silent.
  // This ceiling is NOT the success condition: the REAL termination is `bothPass` (spec && quality).
  const MAX_REVIEW_ATTEMPTS = 3

  // Per-task review loop. REAL termination condition lives in CODE: bothPass = spec.pass && quality.pass.
  // The cap is only a safety ceiling; if we reach it while verdicts STILL fail, we log() that the task
  // is NOT done (with the remaining violations) so it lands in the run JSON — no silent give-up.
  let attempt = 0, review = null, bothPass = false
  while (true) {
    attempt++
    review = await agent(
      `Fresh-context reviewer for task "${task.name}". The implementer changed: ${task.changedFiles.join(', ')}.\n${IGNORE}\n` +
      `SPEC the work had to meet:\n${task.spec}\n` +
      `Return TWO independent verdicts: (1) spec — does it meet EVERY requirement (list violations); ` +
      `(2) quality — is the code correct/clear/safe (list issues). Read the ACTUAL diff. Return the structured object.`,
      { phase:'Review', label:`review:${task.name}:try${attempt}`, schema:REVIEW_SCHEMA })
    if (!review) { log(`${task.name}: reviewer agent FAILED on try ${attempt} — cannot confirm done, treat as NOT done`); break }
    bothPass = review.spec.pass && review.quality.pass
    if (bothPass) { log(`${task.name}: review PASSED (spec+quality) on try ${attempt}`); break }   // REAL termination: BOTH pass
    // Not done. If we've reached the explicit ceiling, STOP — but log it LOUDLY; do not pretend success.
    if (attempt >= MAX_REVIEW_ATTEMPTS) {
      log(`CAP: ${task.name} hit MAX_REVIEW_ATTEMPTS=${MAX_REVIEW_ATTEMPTS} with verdicts STILL FAILING ` +
          `(spec ${review.spec.pass?'PASS':'FAIL'} / quality ${review.quality.pass?'PASS':'FAIL'}); task is NOT done. ` +
          `Remaining spec violations ${JSON.stringify(review.spec.violations)}; ` +
          `quality issues ${JSON.stringify(review.quality.issues)}. ESCALATE — do NOT claim completion.`)
      break
    }
    log(`${task.name} review try ${attempt}: spec ${review.spec.pass?'PASS':'FAIL'} / quality ${review.quality.pass?'PASS':'FAIL'} — back to fix`)
    await agent(
      `Fix these review findings for "${task.name}": spec violations ${JSON.stringify(review.spec.violations)}; ` +
      `quality issues ${JSON.stringify(review.quality.issues)}. Apply the fixes. Return the structured object.`,
      { phase:'Fix', label:`fix:${task.name}:try${attempt}`, schema:{ type:'object', additionalProperties:false,
        properties:{ done:{type:'boolean'} }, required:['done'] } })
  }
  // `bothPass` is the gate result the caller MUST honor: a task counts as complete ONLY when it is true.
  // (false here means we hit the logged cap or the reviewer failed — escalate, never report success.)
  ```

## The two examples

- [examples/deep-audit.example.js](examples/deep-audit.example.js) —
  **deep vertical drill** on one system: parallel subsystem maps, 5 review
  dimensions → per-finding adversarial refute-gate, plus a capability/moonshot
  phase (feasibility-checked unlocks). Domain-saturated prompts, concurrent
  phases via `Promise.all`.
- [examples/portfolio-audit.example.js](examples/portfolio-audit.example.js) —
  **broad reusable sweep** over 8 repos: `Explore` recon, a shared `IGNORE`
  list, data-driven `PROJECTS`/`DIMENSIONS` tables, two-tier graded synthesis
  (per-project report → portfolio roadmap).

**The ideal workflow merges both** — exactly what the skeleton above does: the
portfolio's reusable data-driven recon + IGNORE + two-tier synthesis as the
skeleton, with the deep-audit's adversarial refute-gate and capability pass
wired into each unit.
