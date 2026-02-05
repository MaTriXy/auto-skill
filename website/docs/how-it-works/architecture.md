---
sidebar_position: 1
---

# Architecture

Auto-Skill follows a three-stage pipeline: **Observe → Detect → Forge**, with an optional discovery layer for community skills.

```
┌─────────────────────────────────────────────────────┐
│                  Coding Agent Session                 │
│  User works normally → tool calls happen             │
└──────────────────────┬──────────────────────────────┘
                       │ PostToolUse hook
                       ▼
┌──────────────────────────────────────────────────────┐
│  OBSERVER (src/hooks/observer.ts)                    │
│  Records tool events to SQLite                       │
│  Fields: tool_name, input, response, success, time   │
└──────────────────────┬───────────────────────────────┘
                       │ Stop hook
                       ▼
┌──────────────────────────────────────────────────────┐
│  DETECTOR (src/core/pattern-detector.ts)             │
│                                                      │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Sequence    │ │ Session      │ │ Design       │  │
│  │ Matcher     │ │ Analyzer     │ │ Pattern      │  │
│  │ (V1 core)   │ │ (V2 context) │ │ Detector     │  │
│  └──────┬──────┘ └──────┬───────┘ └──────┬───────┘  │
│         └───────────────┼────────────────┘           │
│                         ▼                            │
│              Confidence Scoring                      │
│     (occurrences × success × length × recency)      │
└──────────────────────┬───────────────────────────────┘
                       │ patterns with confidence ≥ 0.7
                       ▼
┌──────────────────────────────────────────────────────┐
│  FORGE (src/core/skill-generator.ts)                 │
│  Generates SKILL.md with YAML frontmatter            │
│  Output: ~/.claude/skills/auto/                      │
└──────────────────────────────────────────────────────┘
```

## Core Modules

| Module | File | Purpose |
|--------|------|---------|
| **EventStore** | `src/core/event-store.ts` | SQLite persistence for tool events |
| **PatternDetector** | `src/core/pattern-detector.ts` | Core pattern matching + V2 orchestration |
| **SequenceMatcher** | `src/core/sequence-matcher.ts` | Sliding-window subsequence extraction |
| **SkillGenerator** | `src/core/skill-generator.ts` | SKILL.md file generation |
| **SessionAnalyzer** | `src/core/session-analyzer.ts` | Conversation intent and context |
| **MentalAnalyzer** | `src/core/mental-analyzer.ts` | Semantic codebase understanding |
| **DesignPatternDetector** | `src/core/design-pattern-detector.ts` | 18 pattern recognizers |
| **Config** | `src/core/config.ts` | Configuration management |

## Hybrid Layer (Optional)

When enabled, the pipeline extends with external sources:

```
┌──────────────────────────────────────────────────────┐
│  UNIFIED SUGGESTER (src/core/unified-suggester.ts)   │
│                                                      │
│  Sources:                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Local    │ │ Mental   │ │ Skills.sh            │ │
│  │ Patterns │ │ Model    │ │ (27k+ community)     │ │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────────┘ │
│       └─────────────┼────────────────┘               │
│                     ▼                                │
│     Ranking: local > proven > hints > external       │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  ADOPTION & GRADUATION                               │
│  src/core/skill-tracker.ts + src/core/graduation-manager.ts │
│                                                      │
│  External skill (50%) → Proven (75%) → Local (85%+)  │
│  Criteria: 5+ uses, 80% success rate                 │
└──────────────────────────────────────────────────────┘
```

## Storage

All data is local. Anonymous telemetry is opt-in with privacy-first defaults (see [Telemetry](/docs/features/telemetry)).

| Store | Location | Format |
|-------|----------|--------|
| Tool events | `~/.claude/auto-skill/events.db` | SQLite |
| Adoption tracking | `~/.claude/auto-skill/skills_tracking.db` | SQLite |
| Generated skills | `~/.claude/skills/auto/` | SKILL.md files |
| External skills | `~/.claude/skills/external/` | SKILL.md files |
| Graduation log | `skills/graduation_log.json` | JSON |

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (Node.js 18+) |
| Storage | SQLite (better-sqlite3) |
| Code parsing | TypeScript AST |
| Config format | YAML |
| Skill format | Markdown + YAML frontmatter |
| Web UI | Hono |
| CLI | Commander |
