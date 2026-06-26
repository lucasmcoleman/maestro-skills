// EXAMPLE (illustrative, generic) — the "broad reusable sweep" shape.
// Audit many similar units (here: services) along fixed dimensions, then
// synthesize twice: a graded per-unit report, then a cross-unit roadmap.
// Pattern highlights: Explore recon (read-only, cheap) -> parallel per-dimension
// auditors -> per-unit synthesis -> portfolio synthesis. Data-driven via the
// UNITS / DIMENSIONS arrays, so the same script re-runs over any unit set.
export const meta = {
  name: 'portfolio-audit',
  description: 'Audit N services across fixed dimensions, then produce a per-service report and a cross-service roadmap',
  phases: [
    { title: 'Recon', detail: 'map each service (read-only Explore)' },
    { title: 'Audit', detail: 'per-service: one auditor per dimension, in parallel' },
    { title: 'Synthesize', detail: 'graded report per service, then a portfolio roadmap' },
  ],
}

// Keep subagents cheap and focused: tell them what NOT to read.
const IGNORE = `IGNORE node_modules/, .venv/, dist/, build/, vendored deps, lockfiles, generated code, and binary blobs. Read source, config, and docs only.`

// Generic placeholders — replace with your real units when you use this.
const UNITS = [
  { name: 'service-a', path: '/path/to/service-a', hint: 'HTTP API; auth + persistence layer.' },
  { name: 'service-b', path: '/path/to/service-b', hint: 'background worker; queue consumer.' },
  { name: 'service-c', path: '/path/to/service-c', hint: 'static frontend; build pipeline.' },
]
const DIMENSIONS = [
  { key: 'correctness', brief: 'Real bugs: broken invariants, wrong logic, races, unhandled edges, silently ignored args. Evidence as file:line.' },
  { key: 'security',    brief: 'Secrets on disk, injection, unsafe deserialization, missing authz, network exposure. Rate exploitability for the real threat model.' },
  { key: 'quality_ops', brief: 'Maintainability, tests, logging, dependency hygiene, reproducible setup, doc drift.' },
]

const RECON = { type: 'object', additionalProperties: false, properties: {
  purpose: { type: 'string' }, key_files: { type: 'array', items: { type: 'string' } },
  has_tests: { type: 'boolean' }, notes_for_auditors: { type: 'string' },
}, required: ['purpose', 'key_files', 'notes_for_auditors'] }
const FINDINGS = { type: 'object', additionalProperties: false, properties: {
  strengths: { type: 'array', items: { type: 'string' } },
  findings: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    severity: { type: 'string', enum: ['critical','high','medium','low'] },
    title: { type: 'string' }, location: { type: 'string' }, evidence: { type: 'string' }, recommendation: { type: 'string' },
  }, required: ['severity','title','recommendation'] } },
  summary: { type: 'string' },
}, required: ['findings','summary'] }
const REPORT = { type: 'object', additionalProperties: false, properties: {
  health_grade: { type: 'string' }, exec_summary: { type: 'string' }, top_priorities: { type: 'array', items: { type: 'string' } },
  report_markdown: { type: 'string' },
}, required: ['exec_summary','report_markdown','top_priorities'] }

// Pipeline: each service flows recon -> audit -> synth independently (no barrier).
const reports = await pipeline(
  UNITS,
  (u) => agent(`RECON of ${u.name} at ${u.path}. ${u.hint}\n${IGNORE}\nMap purpose, the most important source files, test presence, and notes flagging where to look hardest. Return the structured object.`,
    { phase: 'Recon', label: `recon:${u.name}`, schema: RECON, agentType: 'Explore' }),
  (recon, u) =>
    parallel(DIMENSIONS.map(d => () =>
      agent(`Audit the ${d.key} dimension of ${u.name} (${u.path}). ${d.brief}\nStart from: ${(recon.key_files || []).join(', ')}\n${IGNORE}\nGround every finding in file:line evidence; calibrate severity to THIS unit's real threat model. Return the structured object.`,
        { phase: 'Audit', label: `${u.name}:${d.key}`, schema: FINDINGS })
    )).then(audits => ({ recon, audits: audits.filter(Boolean) })),
  ({ recon, audits }, u) =>
    agent(`Synthesize ONE graded audit report for ${u.name} from these dimension findings (dedupe, prioritize; do not invent findings):\n${JSON.stringify(audits)}\nReturn report_markdown (Exec summary / What's right / What's wrong by severity / Next steps), plus exec_summary, health_grade (A-F), and top_priorities.`,
      { phase: 'Synthesize', label: `report:${u.name}`, schema: REPORT })
      .then(r => ({ name: u.name, ...r }))
)

const ok = reports.filter(Boolean)
const portfolio = await agent(
  `You are a principal engineer. Below are per-service audit summaries. Write a cross-service PORTFOLIO roadmap: an at-a-glance table (service | grade | top risk), cross-cutting themes, a single prioritized backlog (security/data-loss first), and quick wins.\n${ok.map(r => `## ${r.name} (${r.health_grade}) — ${r.exec_summary}\nTop: ${JSON.stringify(r.top_priorities)}`).join('\n')}`,
  { phase: 'Synthesize', label: 'portfolio-roadmap' })

return { reports: ok, portfolio }
