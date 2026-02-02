---
sidebar_position: 2
---

# Pattern Detection

Pattern detection is the core of Auto-Skill. It operates in multiple layers, each adding more context to raw tool sequences.

## Layer 1: Sequence Matching

The foundation. `SequenceMatcher` uses a sliding-window approach to find repeated tool subsequences.

**Algorithm:**
1. Extract all subsequences of length 2–10 from each session
2. Count occurrences across sessions (deduplicated per session)
3. Rank by length (longer = more specific) then by frequency

**Example:**

```
Session 1: [Read, Edit, Bash, Grep]
Session 2: [Read, Edit, Bash, Grep, Read]
Session 3: [Read, Edit, Bash]

Detected: (Read, Edit, Bash) — 3 occurrences across 3 sessions
```

Only tool names are matched at this layer — inputs and outputs are used for confidence scoring.

## Layer 2: Session Analysis

Goes beyond tool sequences to understand *what you were doing*.

The `SessionAnalyzer` classifies each session by:

- **Intent** — What was the goal? Detected from conversation keywords:
  - `debug`: "bug", "error", "fix", "not working"
  - `implement`: "create", "add", "build", "new feature"
  - `refactor`: "clean up", "reorganize", "optimize"
  - `test`: "test", "TDD", "coverage"
  - `explore`: "understand", "explain", "how does"

- **Workflow Type** — The overall approach: TDD, Refactor-Safe, Debug-Systematic, etc.

- **Success Indicators** — Tool success rates and whether the problem was resolved.

This context enriches generated skills with "When to Use" guidance.

## Layer 3: Code Structure Analysis

The `LSPAnalyzer` parses your codebase to understand what the tools were operating on.

**Capabilities:**
- **TypeScript/JavaScript** — AST analysis (classes, functions, decorators, signatures)

**Extracts:**
- Symbol definitions (classes, functions, variables)
- Import/dependency graph
- Entry points (main functions, CLI commands)
- File-to-module relationships

This allows skills to reference specific code structures rather than generic file paths.

## Layer 4: Design Pattern Recognition

The `DesignPatternDetector` identifies 18 patterns across three categories:

### Architectural Patterns
MVC, Repository, Factory, Singleton, Strategy, Observer, Adapter, Dependency Injection

### Coding Patterns
Error-First Handling, REST API Design, Async Pattern, Decorator Pattern, Context Manager, Builder Pattern

### Workflow Patterns
TDD, Refactor-Safe, Debug-Systematic, Explore-Then-Implement

Each detection includes confidence, indicators (what was found), affected files, and code examples. These are embedded into the generated skill for architectural context.

## Confidence Scoring

Every pattern gets a composite confidence score:

```
confidence = (
    occurrences  × 0.40    # How often it repeats
  + length       × 0.20    # Ideal: 3–5 tools per sequence
  + success_rate × 0.25    # How often it succeeds
  + recency      × 0.15    # Exponential decay over 7 days
)
```

**Score breakdown:**
- **Occurrences:** `min(count / 5, 1.0)` — saturates at 5 repetitions
- **Length:** Peaks at 3–5 tools, decreases for shorter or longer sequences
- **Success rate:** Direct 0.0–1.0 mapping
- **Recency:** Exponential decay with 7-day half-life

**Hybrid boosts:**
- +0.10 if Mental Model domain matches
- +0.05 if an external skill from Skills.sh is proven through adoption

## Thresholds

| Parameter | Default | What It Controls |
|-----------|---------|-----------------|
| `min_occurrences` | 3 | Minimum repetitions to consider |
| `min_confidence` | 0.7 | Minimum score to suggest |
| `min_sequence_length` | 2 | Shortest pattern |
| `max_sequence_length` | 10 | Longest pattern |
| `lookback_days` | 7 | Analysis time window |

All configurable in `auto-skill.local.md`. See [Configuration](/getting-started/configuration).
