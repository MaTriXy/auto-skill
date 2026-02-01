<p align="center">
  <img src="https://raw.githubusercontent.com/MaTriXy/auto-skill/main/website/static/img/logo.png" alt="Auto-Skill Logo" width="120" />
</p>

# Auto-Skill

**Automatically learn from your workflows and turn them into intelligent, context-aware skills.**

Auto-Skill observes your coding sessions across 10 supported agents, detects repeated patterns, and generates reusable SKILL.md files. Skills are automatically shared across all your installed agents. It combines local pattern detection with external skill discovery, cross-agent sharing, and anonymous telemetry.

[![npm](https://img.shields.io/npm/v/@matrixy/auto-skill)](https://www.npmjs.com/package/@matrixy/auto-skill)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-Docusaurus-blue.svg)](https://MaTriXy.github.io/auto-skill)


https://github.com/user-attachments/assets/7f0bf716-9c7a-47bd-86f4-92fe62be128b

## Quick Start

```bash
npx skills add MaTriXy/auto-skill
```

### Install CLI

```bash
npm install -g @matrixy/auto-skill
```

Once installed, the plugin automatically:
1. Records your tool usage patterns
2. Detects repeated workflows (3+ occurrences)
3. Offers to create skills from high-confidence patterns

## CLI

```bash
auto-skill init                # Initialize config and directories
auto-skill discover            # Discover skills for current project
auto-skill search "query"      # Search external skills
auto-skill stats               # Show adoption statistics
auto-skill graduate            # Manage skill graduation
auto-skill agents list         # List known coding agents
auto-skill agents detect       # Detect installed agents
auto-skill lock status         # Show lock file status
auto-skill lock verify         # Verify skill integrity (SHA-256)
auto-skill lock list           # List locked skills
auto-skill telemetry report    # Show effectiveness report
auto-skill telemetry events    # Show raw events
auto-skill version             # Show version
```

All commands support `--json` output.

## Key Features

- **Pattern Detection** — Automatically detects repeated tool sequences across sessions
- **Session Analysis** — Identifies intent (debug, implement, refactor) and workflow types (TDD, etc.)
- **18 Design Patterns** — Architectural, coding, and workflow pattern recognition
- **External Discovery** — 27,000+ community skills from [Skills.sh](https://skills.sh)
- **Mental Model Integration** — Semantic codebase understanding via [@mentalmodel/cli](https://github.com/Michaelliv/mental)
- **Multi-Agent Support** — 10 coding agents (Claude Code, Codex, Cursor, Aider, etc.) with cross-agent skill sharing via symlinks
- **Provider System** — Pluggable skill discovery (local, Skills.sh, RFC 8615 well-known endpoints)
- **Lock File** — SHA-256 integrity verification with atomic writes
- **Spec Compliance** — Generated skills validated against [agentskills.io](https://agentskills.io) spec
- **Path Security** — Traversal prevention, null byte blocking, unicode normalization
- **Confidence Evolution** — Skills improve from 50% (external) → 75% (proven) → 85% (graduated)
- **Anonymous Telemetry** — Privacy-first usage tracking ([details below](#telemetry))

## Documentation

**Full documentation: [https://MaTriXy.github.io/auto-skill](https://MaTriXy.github.io/auto-skill)**

## Development

```bash
git clone https://github.com/MaTriXy/auto-skill.git
cd auto-skill
npm install
npm test
```

## Telemetry

This tool collects **anonymous, aggregate metrics** (event types, counts, timing, OS) to improve the experience. No PII, search queries, file paths, or session data is collected.

**Disable:**
```bash
export AUTO_SKILL_NO_TELEMETRY=1  # or DO_NOT_TRACK=1
```

Automatically disabled in CI. Source: [`src/core/telemetry.ts`](src/core/telemetry.ts)

## License

MIT License - see [LICENSE](LICENSE)

---

**Version 4.0.1** | [Repository](https://github.com/MaTriXy/auto-skill) | [Issues](https://github.com/MaTriXy/auto-skill/issues) | [Changelog](CHANGELOG.md)
