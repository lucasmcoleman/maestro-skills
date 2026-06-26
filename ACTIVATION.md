# Activating Maestro

**Maestro** is a standalone plugin (a Fable+Opus orchestration blend derived from
Superpowers). It is **self-contained** — it ships all 15 skills (the 8 reworked
orchestration skills + the new `dynamic-workflow-orchestration` + the 6 inherited
base skills), so it fully **replaces** stock `superpowers`. Nothing in the
original `superpowers/6.0.3` directory was modified.

- Plugin dir: `~/.claude/plugins/cache/maestro/1.0.0`
- Plugin id / skill namespace: `maestro` (skills invoke as `maestro:<skill>`)
- It is its own local marketplace: `maestro-local` (`.claude-plugin/marketplace.json`, `source: "./"`).

---

## Method A — `/plugin` UI (recommended, supported)

Run these in Claude Code (the `!`-prefix runs a command in-session if you prefer):

1. **Add the local marketplace** (point at the dir that contains `.claude-plugin/marketplace.json`):
   ```
   /plugin marketplace add ~/.claude/plugins/cache/maestro/1.0.0
   ```
2. **Install the plugin:**
   ```
   /plugin install maestro@maestro-local
   ```
3. **Disable stock superpowers** so you don't get duplicate, near-identically
   described skills competing for auto-selection (Maestro is a superset, so you
   lose nothing):
   ```
   /plugin uninstall superpowers@claude-plugins-official
   ```
4. **Reload** Claude Code. Confirm Maestro is live: the `maestro:dynamic-workflow-orchestration`
   skill should be listed (it does not exist in stock superpowers), and skills
   should appear under the `maestro:` namespace.

> If `/plugin marketplace add` rejects a local path on your build, use Method B.

## Method B — manual config edit (fallback)

1. **`~/.claude/plugins/known_marketplaces.json`** — add:
   ```json
   "maestro-local": {
     "source": { "source": "local", "path": "~/.claude/plugins/cache/maestro/1.0.0" },
     "installLocation": "~/.claude/plugins/cache/maestro/1.0.0"
   }
   ```
2. **`~/.claude/plugins/installed_plugins.json`** — add a sibling entry under `plugins`:
   ```json
   "maestro@maestro-local": [
     {
       "scope": "user",
       "installPath": "~/.claude/plugins/cache/maestro/1.0.0",
       "version": "1.0.0"
     }
   ]
   ```
   and **remove** the `"superpowers@claude-plugins-official"` entry (or leave it
   and expect duplicate skills).
3. Reload Claude Code.

---

## Why disable superpowers
Maestro carries all 14 original skill names plus `dynamic-workflow-orchestration`.
If both plugins are active, every shared skill exists twice
(`superpowers:brainstorming` AND `maestro:brainstorming`) with similar trigger
descriptions, which muddies automatic skill selection. Running Maestro alone
avoids that. The 6 inherited base skills (`using-git-worktrees`,
`finishing-a-development-branch`, `test-driven-development`,
`receiving-code-review`, `systematic-debugging`, `writing-skills`) are bundled
with only their namespace/branding references updated (`superpowers:` → `maestro:`,
and the bootstrap skill renamed `using-superpowers` → `using-maestro`), so
disabling superpowers loses nothing.

## Reverting to stock superpowers
- Method A: `/plugin uninstall maestro@maestro-local` then
  `/plugin install superpowers@claude-plugins-official` (it's still on disk at
  `…/superpowers/6.0.3`), reload.
- Method B: reverse the two JSON edits.

Because the stock `superpowers/6.0.3` directory was never touched, reverting fully
restores stock behavior.

## Provenance & docs
- What changed and why: `README.md`
- The design contract behind the blend: `BLEND_DOCTRINE.md`
- Test evidence: `test-harness/REPORT.md`, `REPORT.v2.md`, `REPORT.experiment.md`, `REPORT.fixes.md`
- Upstream lineage: the original Superpowers docs (`README.superpowers-upstream.md`, `RELEASE-NOTES.md`) are retained for credit.
