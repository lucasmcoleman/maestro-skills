// EXAMPLE (illustrative, generic) — the "deep vertical drill" shape.
// One target, many angles, with an ADVERSARIAL refute gate and a forward-looking
// capability pass. Independent phases (Map / Review / Gaps) run concurrently for
// wall-clock; every serious finding is verified by a fresh-context skeptic before
// it survives. This is the signature Maestro shape: find wide, then refute hard.
export const meta = {
  name: 'deep-audit',
  description: 'Deep single-target audit: parallel subsystem maps + multi-dimension review with adversarial verification + capability-gap analysis',
  phases: [
    { title: 'Map', detail: 'parallel subsystem deep-reads' },
    { title: 'Review', detail: 'review dimensions; each serious finding fans out to refuters' },
    { title: 'Gaps', detail: 'capability/"what would make this dramatically better" analysis' },
  ],
}

const ROOT = '/path/to/target'   // replace with your target
const CONTEXT = `Target repo: ${ROOT}. Read its README/docs first and do NOT re-report anything the docs mark as known/intentional. Ignore build output and vendored deps.`

const MAP = { type: 'object', additionalProperties: false, properties: {
  summary: { type: 'string' }, public_surface: { type: 'array', items: { type: 'string' } },
  invariants: { type: 'array', items: { type: 'string' } }, oddities: { type: 'array', items: { type: 'string' } },
}, required: ['summary','public_surface'] }
const FINDINGS = { type: 'object', additionalProperties: false, properties: {
  findings: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    title: { type: 'string' }, file: { type: 'string' }, severity: { type: 'string', enum: ['critical','high','medium','low'] },
    description: { type: 'string' }, suggestedFix: { type: 'string' },
  }, required: ['title','severity','description'] } },
}, required: ['findings'] }
const VERDICT = { type: 'object', additionalProperties: false, properties: {
  isReal: { type: 'boolean' }, reasoning: { type: 'string' }, adjustedSeverity: { type: 'string', enum: ['critical','high','medium','low','not-a-bug'] },
}, required: ['isReal','reasoning'] }
const GAPS = { type: 'object', additionalProperties: false, properties: {
  gaps: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    capability: { type: 'string' }, value: { type: 'string', enum: ['transformative','high','medium','low'] },
    feasibility: { type: 'string', enum: ['easy','moderate','hard'] }, approach: { type: 'string' },
  }, required: ['capability','value','feasibility','approach'] } },
}, required: ['gaps'] }

const SUBSYSTEMS = ['entrypoints + config', 'core logic / data model', 'IO + external boundaries']
const REVIEWERS = [
  { key: 'correctness', prompt: 'Hunt correctness bugs: races, async misuse, off-by-one, null-deref, broken edge cases, args read under the wrong key. Every finding needs file:line evidence and a concrete failure scenario.' },
  { key: 'robustness',  prompt: 'Hunt silent failures: swallowed exceptions, missing timeouts/limits, partial writes, unbounded growth, concurrent-access hazards.' },
  { key: 'security',    prompt: 'Security review calibrated to the real threat model: injection, path traversal, authz gaps, network exposure, unsafe deserialization.' },
]

// Map / Review / Gaps are independent -> run concurrently (Promise.all of three).
const mapsP = parallel(SUBSYSTEMS.map(s => () =>
  agent(`${CONTEXT}\nYou are a code cartographer. Deep-read the "${s}" subsystem and produce a structured map. Be exhaustive on public_surface.`,
    { phase: 'Map', label: `map:${s.slice(0,12)}`, schema: MAP })))

// Review -> per-finding adversarial verify, pipelined so dimensions don't block each other.
const reviewP = pipeline(
  REVIEWERS,
  r => agent(`${CONTEXT}\nYou are an elite reviewer. ${r.prompt}\nReport only findings that matter; severity: critical=data loss/crash in normal use, high=wrong result in realistic use, medium=edge case, low=polish.`,
    { phase: 'Review', label: `review:${r.key}`, schema: FINDINGS }),
  (review, r) => parallel((review.findings || []).filter(f => f.severity === 'critical' || f.severity === 'high').map(f => () =>
    agent(`${CONTEXT}\nYou are a skeptical verifier. A reviewer claims this ${f.severity} issue in ${f.file}:\n${f.title} — ${f.description}\nRead the actual code and try to REFUTE it: is the path reachable? already guarded? intentional? Default isReal=false unless you can reproduce the logic chain.`,
      { phase: 'Review', label: `verify:${r.key}`, schema: VERDICT }).then(v => ({ ...f, dimension: r.key, verdict: v }))
  )))

// Forward-looking: not just defects — what would make this dramatically better?
const gapsP = agent(`${CONTEXT}\nYou are a platform strategist. Propose feasibility-checked capabilities that would make this target meaningfully more powerful. Be concrete about the approach; honest about feasibility. Return the structured object.`,
  { phase: 'Gaps', label: 'capability-gaps', schema: GAPS })

const [maps, reviews, gaps] = await Promise.all([mapsP, reviewP, gapsP])
const confirmed = reviews.filter(Boolean).flat().filter(f => f.verdict?.isReal)
log(`${confirmed.length} confirmed serious findings; ${(gaps?.gaps || []).length} capability gaps`)

return { maps, confirmedFindings: confirmed, capabilityGaps: gaps?.gaps || [] }
