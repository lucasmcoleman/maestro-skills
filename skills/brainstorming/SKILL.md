---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

Turn an idea into a design through collaborative dialogue: understand the project, resolve the real ambiguity, present a design, get approval. Then hand off to writing-plans.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>

The gate is absolute. What scales is the *depth* of work before it — never whether you pass through it.

## Scale effort to ambiguity

When you have enough information to act, act. Don't interrogate a clear request to manufacture thoroughness.

- **Clear, small task** ("add a `--quiet` flag that suppresses INFO logs"): no questions, no recon subagent. State a one-line design, get a yes, move on.
- **Ambiguous or consequential task**: explore properly, ask what you genuinely don't know, propose approaches, present a sectioned design.

"Simple" never means *skip the gate* — it means the design is one sentence and the approval is one word. Unexamined assumptions waste the most work on the tasks that looked obvious.

## Decompose large scope first

Before refining details, check scope. If the request spans multiple independent subsystems ("a platform with chat, file storage, billing, and analytics"), flag it immediately — don't burn questions on a project that needs splitting. Help the user break it into sub-projects: what the independent pieces are, how they relate, what order to build them. Then brainstorm the first sub-project normally. Each sub-project gets its own spec → plan → implementation cycle.

## Key Principles

These hold for every brainstorm, no matter how simple the task looks. They restate, as explicit rules, the behavior the flow below depends on:

- **Only one question per message.** But: when the answer is obvious from context, state your assumption and move on — don't ask a question you can answer yourself.
- **Multiple choice preferred** — multiple choice is easier to answer than open-ended; use it whenever the options are knowable, and fall back to open-ended only when they aren't.
- **YAGNI ruthlessly** — remove unnecessary features from every design. Build only what the goal needs. This is universal, not specific to existing codebases.
- **Explore alternatives** — propose 2-3 approaches before settling, unless there is genuinely one sane approach.
- **Incremental validation** — present the design in sections and get approval on each before moving on.
- **Be flexible** — go back and clarify whenever something stops making sense, rather than pushing forward on a shaky assumption.

## The flow

Track these as tasks and do them in order:

1. **Explore context** — files, docs, recent commits; follow existing patterns. For a large or unfamiliar codebase, dispatch a read-only recon agent instead of reading broadly yourself (see Exploring context).
2. **Offer the visual companion just-in-time** — NOT upfront. The first time a question would genuinely be clearer shown than described, offer it then (its own message); on approval its browser tab opens for you. If no visual question ever arises, never offer it. See the Visual companion section below.
3. **Resolve ambiguity** — only what's genuinely unclear (see Asking questions).
4. **Propose 2-3 approaches** — trade-offs, lead with your recommendation and why. Skip only when there's genuinely one sane approach.
5. **Present the design** — sections scaled to complexity; get approval on each. If the user pushes back, revise and re-present until approved.
6. **Write the spec** — `docs/maestro/specs/YYYY-MM-DD-<topic>-design.md`, then commit. (User's preferred spec location overrides.)
7. **Review the spec** — self-review inline; for a substantial spec, also dispatch a fresh-context verifier (see After approval).
8. **User reviews the spec** — wait for approval; if they request changes, fix, re-review, and ask again.
9. **Invoke writing-plans.**

**The terminal state is invoking writing-plans — the ONLY skill you invoke after brainstorming.** Not frontend-design, not mcp-builder, not any other implementation skill.

## Exploring context

For a small change in familiar code, just read the relevant files directly. For a large or unfamiliar codebase, keep your own context lean by dispatching a read-only recon subagent and working from its map.

Dispatch a `general-purpose` subagent (read-only — it must not edit, write, or run mutating commands) with a prompt like:

> "Map the parts of `<repo>` relevant to `<feature/area>`. Report: the directory layout that matters, the modules/files involved and each one's responsibility, the existing patterns and conventions to follow, the integration points this work would touch, and anything that looks fragile or oversized. IGNORE and never open: `.git/`, `node_modules/`, `venv/`/`.venv/`, `dist/`/`build/`, caches, lockfiles, and large binary/data/model-weight blobs. Return a structured map citing file paths and line ranges — do NOT paste large file contents."

**Done when** you have a structured map you can ground questions and the design on. This keeps the orchestrator (you) cheap and focused so compaction stays rare.

## Asking questions

Ask only one question per message — if a topic needs more exploration, break it into separate questions so each answer can shape the next. But when the answer is obvious from context, state your assumption and move on instead of asking. Prefer multiple choice when the options are knowable; open-ended is fine when they aren't. Focus on purpose, constraints, and success criteria.

## Presenting the design

- Once you understand what you're building, present it. Scale each section: a sentence if straightforward, up to ~200-300 words if nuanced.
- Cover what matters for this task: architecture, components, data flow, error handling, testing. Ask after each section whether it's right; revise and re-present until approved.
- Go back and clarify whenever something stops making sense.

**Design for isolation:** break the system into units with one clear purpose and well-defined interfaces, each understandable and testable on its own. For each: what does it do, how is it used, what does it depend on? If you can't change a unit's internals without breaking consumers, the boundaries need work. (You also reason and edit better over focused files — a file growing large is a signal it does too much.)

**In existing codebases:** explore structure first and follow it. Fold in targeted improvements where existing problems affect the work (an oversized file, tangled responsibilities) — the way a good developer improves code they touch. Don't propose unrelated refactoring; respect YAGNI and the current scope.

## After approval: spec → review → plan

**Write the spec** to `docs/maestro/specs/YYYY-MM-DD-<topic>-design.md` (user's preferred location overrides) and commit it. If the `elements-of-style:writing-clearly-and-concisely` skill is available, use it to keep the spec clear and concise.

**Spec self-review** — read it with fresh eyes and fix inline:
- Placeholders ("TBD"/"TODO"/vague requirements)?
- Internal contradictions; does the architecture match the features?
- Scope: one implementation plan, or does it need decomposing?
- Ambiguity: any requirement readable two ways? Pick one, make it explicit.

Fix and move on — no re-review of your own pass.

**Fresh-context verifier (substantial specs)** — a verifier who never saw your reasoning catches gaps your self-review rationalizes past. For any spec beyond a short paragraph, dispatch a `general-purpose` subagent using the template in `skills/brainstorming/spec-document-reviewer-prompt.md`. Pass it the spec's file *path*, not its contents. It checks completeness, consistency, clarity, scope, and YAGNI and returns **Approved | Issues Found**. Fix the real issues it raises; treat its recommendations as advisory. Skip this only for a trivial one-paragraph spec — see Scale effort to ambiguity.

**User review gate** — after review, ask the user to review the committed spec:
> "Spec written and committed to `<path>`. Please review it and let me know if you want any changes before we write the implementation plan."

Wait for the response. If they request changes, make them, re-run review, and ask again. Only once they approve, invoke writing-plans.

## Visual companion

A browser tool — not a mode — for mockups, diagrams, and side-by-side visual options. Offer it **just-in-time, never upfront**: the first time a question would genuinely be clearer shown than told (a real mockup/layout/diagram question, not just a UI *topic*), offer it as its own message — only the offer, nothing else:

> "This next part might be easier if I show you — I can put together mockups, diagrams, and comparisons in a browser tab as we go. It's still new and can be token-intensive. Want me to? I'll open it for you."

Wait for the answer. On accept, start the server with `--open`. On decline, stay text-only and don't re-offer. Even after acceptance, decide per question: use the browser only when seeing beats reading (mockups, wireframes, layout/diagram comparisons); use the terminal for requirements, concepts, trade-offs, and text options.

A question about a UI topic is not automatically a visual question. "What does personality mean in this context?" is a conceptual question — use the terminal. "Which wizard layout works better?" is a visual question — use the browser.

If they accept, read the detailed guide first:
`skills/brainstorming/visual-companion.md`
