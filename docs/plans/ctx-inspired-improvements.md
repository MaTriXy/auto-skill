# Plan: ctx-Inspired Improvements for auto-skill

**Status:** Proposed
**Date:** 2026-06-07
**Inspiration:** [stevesolun/ctx](https://github.com/stevesolun/ctx) (MIT) — a graph-backed skill/agent recommendation engine for Claude Code. This plan ports its *intake-hygiene and feedback-loop principles* into auto-skill's existing TypeScript/SQLite architecture. No Python code or graph artifacts are imported.

## Motivation

auto-skill v5.0 discovers external skills (skills.sh → raw GitHub content) and generates local skills from detected patterns. ctx solved several problems we currently have open — including three literal `TODO`s in our source:

| Gap in auto-skill today | Where | ctx mechanism to adapt |
|---|---|---|
| External SKILL.md content fetched & surfaced with **zero security vetting** | `src/core/external-skill-loader.ts` (`fetchContent`) — `spec-validator.ts` is structural only | Entity-update security scan: flag `curl\|sh`, `rm -rf /`, secret-exfil patterns etc., force explicit review |
| `RelevanceRanker.rank()` sorts by install count only | `src/core/external-skill-loader.ts:403` (`// TODO: Implement multi-signal ranking`) | Composite score: query match + tag/token overlap + log-scaled popularity |
| File-extension context extraction unimplemented | `src/core/proactive-discovery.ts:102` (`// TODO: Parse file paths for extensions`) | ctx's 160+ keyword/extension → stack-signal map |
| MCP pattern-based recommendations stubbed | `src/mcp/server.ts:147` (`// TODO`) | Wire existing `SkillRecommendationEngine` into the stub |
| Generated skills can accumulate near-duplicates over months | `src/core/skill-generator.ts` writes without comparing to existing skills | Intake gate: similarity dedup with duplicate/near-dup thresholds |
| Skills are never retired | `SkillTracker` grows confidence but nothing flags dead skills | Stale rule: many sessions observed + zero uses ⇒ suggest archive |

## Phase 1 — Security scanner for external skill content (P0)

**New file:** `src/core/content-security-scanner.ts`

External skills come from arbitrary GitHub repos. A SKILL.md is *instructions an agent will follow*, so a malicious one is a prompt-injection/supply-chain vector. ctx scans incoming entity bodies for dangerous patterns and forces a benefits/risks review before install; we adapt the pattern list:

- Network-fetched shell execution: `curl|wget … | sh|bash`
- Dynamic execution: `Invoke-Expression`, `eval` of fetched content
- Broad destructive ops: `rm -rf /` (and `~`), `git reset --hard`, `git clean -fd`, `chmod 777`
- Safety-control bypass: instructions to disable auth/TLS/sandbox/telemetry/permission checks
- Secret exfiltration: env-var/credential reads (`AWS_*`, `*_TOKEN`, `*_KEY`) combined with outbound network calls

API sketch:

```ts
export interface SecurityFinding { pattern: string; severity: "block" | "warn"; line: number; excerpt: string }
export function scanSkillContent(content: string): SecurityFinding[]
```

Integration points:

- `ExternalSkillLoader.fetchContent()` / `search({ includeContent: true })` — attach findings to the returned skill.
- `SkillRecommendationEngine` — external recommendations with `block` findings are suppressed; `warn` findings are surfaced in the suggestion text.
- Graduation path (`graduation-manager.ts`) — a skill cannot graduate to local while it has unresolved `block` findings; CLI override via explicit `--force` only.
- CLI: findings printed in `discover` output with severity coloring.

Like spec validation, scanning is **lexical/static** — it flags for human review, it does not "approve" content. False-positive tolerance: prefer `warn` over `block` for ambiguous patterns; only the unambiguous list above blocks.

**Tests:** `tests/content-security-scanner.test.ts` — each pattern family (positive + benign near-miss), severity routing, multi-finding documents, clean document returns `[]`.

## Phase 2 — Multi-signal RelevanceRanker (P1)

**Touches:** `src/core/external-skill-loader.ts:403`, `src/core/proactive-discovery.ts:102`

Replace the install-count sort with ctx's composite shape, adapted to fields skills.sh gives us:

```
score = 0.45 * queryMatch        // token overlap of query vs name+description, exact-name-token boosted over substring
      + 0.30 * log1p(installCount) / log1p(maxInstallCount)   // popularity, log-scaled so megapopular skills don't drown relevance
      + 0.15 * tokenOverlap      // skill-id slug tokens vs query terms (ctx's slug-token signal)
      + 0.10 * sourceTrust       // known-good sources list, default 0.5
```

Weights live in `config.ts` so they're tunable without code changes. Pure functions, no new deps.

Also closes the `proactive-discovery.ts:102` TODO with a small extension→signal map (start with ~40 common entries: `.tsx → react`, `.tf → terraform`, `.vue → vue`, `.go → golang` …, modeled on ctx's signal table) feeding `queryMatch` better context terms.

**Tests:** ranking order fixtures (relevant-but-modest beats popular-but-irrelevant), log-scaling bounds, extension-map extraction.

## Phase 3 — Similarity dedup intake gate for generated skills (P2)

**New file:** `src/core/intake-gate.ts`
**Touches:** `src/core/skill-generator.ts`, `src/core/skill-store.ts`

ctx rejects new skills at ≥0.93 embedding cosine similarity and warns at 0.80. We start **lexical** (no embedding dependency): TF-vector cosine over normalized name+description+body tokens against all existing skills in the store (local + adopted). SQLite FTS5 prefilters candidates so we never do O(n) full comparisons.

- `similarity ≥ 0.90` → **reject** generation, log "duplicate of <slug>", suggest merging the new pattern evidence into the existing skill instead.
- `0.70 ≤ similarity < 0.90` → **warn** in the suggestion ("very similar to <slug>"), still allow.
- Content-hash exact match (already stored in the `skills` table) short-circuits before any scoring.

This is the guard that keeps months of pattern detection from filling `~/.claude/skills/auto/` with five flavors of "run vitest then fix failures".

**Tests:** duplicate rejected, near-dup warned, distinct skill passes, FTS5 prefilter returns expected candidate set, hash short-circuit.

## Phase 4 — Stale-skill detection (P3)

**Touches:** `src/core/skill-tracker.ts`, `src/cli/commands/stats.ts`, `src/core/unified-suggester.ts`

`SkillTracker` already records usage/success per adopted skill. Add the inverse signal (ctx: `session_count ≥ 30 && use_count == 0` ⇒ suggest unload):

- Track `sessions_observed` per tracked skill (increment once per session id seen in the event store while the skill is installed).
- `staleSkills()` query: `sessions_observed ≥ 30 AND usage_count = 0`, plus `last_used > 60 days` for previously-used skills.
- Surface via `auto-skill stats --stale` and as a low-priority suggestion in `unified-suggester` ("3 skills look stale — archive?"). Archiving moves the skill file to `~/.claude/skills/auto/.archive/` (reversible), never deletes.

**Tests:** staleness query boundaries (29 vs 30 sessions, used-once exemption), archive round-trip.

## Phase 5 — Co-invocation mining (P4)

**New file:** `src/core/co-invocation-miner.ts`
**Touches:** `src/core/proactive-discovery.ts`

ctx's behavior miner counts *pairs* of signals appearing in the same event window and only acts at `MIN_EVIDENCE ≥ 3`. Our event store already has every tool event with session + timestamp:

- Mine (tool/context-signal) pairs co-occurring within a session window; persist counts in a `co_invocations` table.
- Pairs with count ≥ 3 become extra context terms for proactive discovery queries (e.g. `docker` + `pytest` co-occurring → search "docker testing" skills) and future bundle suggestions.
- Complementary to `pattern-detector.ts` (ordered sequences); this is unordered co-occurrence, much cheaper, catches what sequence matching misses.

**Tests:** pair counting across sessions, MIN_EVIDENCE gate, integration with discovery query generation.

## Phase 6 — MCP pattern-based recommendations (P4, small)

**Touches:** `src/mcp/server.ts:147`

The stub predates `SkillRecommendationEngine`. Wire the existing engine in: detected patterns → unified recommendations (local + external, post-Phase-1 security-filtered) over MCP. Mostly plumbing + one integration test.

## Sequencing & dependencies

```
Phase 1 (security scan)  ──► Phase 6 (MCP recs use filtered results)
Phase 2 (ranking)        ──► Phase 5 (miner feeds better queries)
Phase 3 (intake gate)        [independent]
Phase 4 (stale detection)    [independent]
```

Each phase is one PR with tests. Phase 1 ships first — it's the only one with a security dimension and everything recommendation-shaped should sit behind it.

## Build & test

```bash
npm install
npm run build          # tsc → dist/
npm test               # vitest run
npm run lint           # eslint src/ tests/
node bin/auto-skill.js discover --external   # manual smoke (skills.sh search)
npm run start:mcp      # MCP server smoke (after Phase 6)
```

Constraints to preserve: better-sqlite3 sync API, atomic writes via `src/util/atomic-write.ts`, path security via `src/core/path-security.ts` for anything written under `~/.claude/skills/`, no new runtime dependencies for scoring/scanning (pure TS).
