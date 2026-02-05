---
sidebar_position: 1
sidebar_label: Introduction
slug: /
---

<p align="center">
  <img src="/auto-skill/img/logo.svg" alt="Auto-Skill Logo" width="120" />
</p>

# Auto-Skill

[![Latest Release](https://img.shields.io/github/v/release/MaTriXy/auto-skill)](https://github.com/MaTriXy/auto-skill/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/MaTriXy/auto-skill/blob/main/LICENSE)

**Automatically generate skills for any coding agent by observing your workflow.**

> **v5.0 — Proactive Skill Discovery.** Auto-Skill now searches 27,000+ community skills in real-time and proactively suggests them when it detects matching patterns in your workflow. The closed-loop learning system combines local pattern detection with external skill discovery, creating a skill factory that learns from both your habits and the community.

Auto-Skill watches how you work across your coding agents, detects repeated patterns, and turns them into reusable [SKILL.md](https://docs.anthropic.com/en/docs/claude-code/skills) files — so your agents learn from your habits without you having to write skills manually.

## What It Does

When you use a coding agent, you develop patterns. Maybe you always read a file, write tests, then implement — or you follow a specific debugging sequence. Auto-Skill captures these patterns and codifies them.

```
You work normally in your coding agent
        ↓
Observer records tool usage (Read, Edit, Bash, etc.)
        ↓
Detector finds repeated sequences across sessions
        ↓
Forge generates a SKILL.md file
        ↓
Skills are shared across all your installed agents
        ↓
You review and approve → skill is active
```

## Key Features

- **Pattern Detection** — Finds repeated tool sequences (3+ occurrences) with configurable confidence scoring
- **Proactive Discovery** — Automatically searches 27,000+ community skills when patterns are detected
- **External Skill Loader** — Real-time fetching from Skills.sh + GitHub with 24-hour caching
- **Context-Aware Recommendations** — Suggests skills based on detected frameworks, languages, and intent
- **Hybrid Graduation** — External skills graduate to local skills after proving themselves (5+ uses, 80% success)
- **Skills CLI Integration** — Uses `npx skills find` for manual search (Auto-Skill focuses on generation)
- **MCP Tools** — Programmatic access via `search_skills` and `discover_skills`
- **Human-in-the-Loop** — Every skill requires your approval before activation

### New in V5.0

- **[Proactive Skill Discovery](/docs/features/proactive-discovery)** — Context-aware recommendations from 27,000+ community skills
- **External Skill Loader** — Real-time Skills.sh + GitHub fetching with in-memory caching
- **Skill Recommendation Engine** — Unified interface for local, external, and hybrid recommendations
- **MCP Tools** — `search_skills` and `discover_skills` for programmatic access
- **Skills CLI Integration** — Delegates manual search to `npx skills find` (division of labor)
- **Native Fetch API** — Zero new dependencies using Node.js 18+ built-in fetch

### From V4.0

- **Node.js/TypeScript** — Complete rewrite from Python for better ecosystem integration
- **MCP Server** — Stdio + HTTP server for tool integration
- **Multi-Agent Support** — Cross-agent skill sharing (Claude Code, Cursor, Codex, Aider, Windsurf)
- **[Provider System](/docs/features/providers)** — Pluggable skill discovery (local, Skills.sh, RFC 8615)
- **[Lock File](/docs/features/security)** — SHA-256 integrity verification with atomic writes
- **[Telemetry](/docs/features/telemetry)** — Privacy-first usage tracking

## How Confidence Works

Skills aren't created blindly. Each pattern gets a confidence score based on repetition, success rate, sequence length, and recency:

| Source | Starting Confidence | Graduation Threshold |
|--------|-------------------|---------------------|
| External (Skills.sh) | 50% | 85% (5+ uses, 80% success) |
| Proven External | 75% | — |
| Local Pattern | Based on formula | — |
| Graduated Skill | 85%+ | — |

## Quick Example

After several sessions where you follow a test-driven workflow:

```yaml
---
name: tdd-implement-workflow
description: Test-driven implementation with read-test-implement-verify cycle
confidence: 0.85
occurrence-count: 7
session-analysis:
  primary_intent: implement
  workflow_type: TDD
source: auto-generated
---

# tdd-implement-workflow

## Steps
1. Read the target module to understand current implementation
2. Write test cases for the new behavior
3. Implement the feature to pass tests
4. Run tests to verify correctness
```

This skill was generated automatically from your actual workflow — no manual authoring needed.
