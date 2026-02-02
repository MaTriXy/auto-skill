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

> **v4.0 — Now powered by Node.js.** Auto-Skill has been completely rewritten from Python to TypeScript/Node.js for better performance and broader ecosystem integration. It supports multiple coding agents (Claude Code, Cursor, Codex, Aider, Windsurf, and more) with cross-agent skill sharing. A skill learned in one agent is instantly available in all others.

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
- **Session Analysis** — Understands intent (debugging, implementing, refactoring) from conversation context
- **Code Structure Awareness** — Analyzes your codebase via AST/tree-sitter to enrich skills with architectural context
- **Design Pattern Recognition** — Detects 18+ architectural, coding, and workflow patterns (MVC, TDD, Factory, etc.)
- **Community Discovery** — Search 27,000+ community skills from [Skills.sh](https://skills.sh) and adopt them locally
- **Graduation System** — External skills earn trust through usage, graduating to local skills at high confidence
- **Human-in-the-Loop** — Every skill requires your approval before activation

### New in V4.0

- **Node.js/TypeScript Migration** — Complete rewrite from Python to TypeScript for better performance and ecosystem fit
- **MCP Server** — Stdio + HTTP server for tool integration
- **Content-Addressable Storage** — SHA-256 based skill storage with atomic file writes
- **WAL Journal Mode** — Improved SQLite concurrency with better-sqlite3
- **ULID Identifiers** — Time-sortable unique IDs replacing UUIDs

### From V3.0

- **[Multi-Agent Support](features/agent-registry)** — Multiple coding agents with cross-agent skill sharing
- **[Provider System](features/providers)** — Pluggable skill discovery (local, Skills.sh, RFC 8615)
- **[Lock File](features/security)** — SHA-256 integrity verification with atomic writes
- **[Anonymous Telemetry](features/telemetry)** — Privacy-first usage tracking
- **[Path Security](features/security)** — Traversal prevention and spec compliance
- **[Unified CLI](features/cli)** — `auto-skill` entry point with `--json` support
- **Skills CLI** — `npx skills add MaTriXy/auto-skill`

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
