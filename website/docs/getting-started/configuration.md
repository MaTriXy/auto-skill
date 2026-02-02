---
sidebar_position: 3
---

# Configuration

Auto-Skill uses YAML configuration files with sensible defaults. Configuration is loaded from two locations:

| Location | Scope | Priority |
|----------|-------|----------|
| `~/.claude/auto-skill.local.md` | Global (all projects) | Default |
| `.claude/auto-skill.local.md` | Per-project | Overrides global |

## Detection Settings

Control how patterns are identified:

```yaml
detection:
  min_occurrences: 3        # How many times a sequence must repeat
  min_sequence_length: 2    # Shortest pattern to detect
  max_sequence_length: 10   # Longest pattern to detect
  lookback_days: 7          # How far back to analyze
  min_confidence: 0.7       # Minimum score to suggest a skill
  ignored_tools:            # Tools to exclude from patterns
    - AskUserQuestion
```

### Tuning Tips

- **Noisy environment?** Raise `min_occurrences` to 5 and `min_confidence` to 0.8 to reduce false positives.
- **Want more suggestions?** Lower `min_confidence` to 0.5, but expect more noise.
- **Long workflows?** Increase `max_sequence_length` beyond 10 to capture extended sequences.

## V2 Features

Enable enhanced analysis capabilities:

```yaml
v2:
  enable_session_analysis: true    # Conversation context analysis
  enable_lsp_analysis: true        # Code structure via AST/tree-sitter
  enable_pattern_detection: true   # Design pattern recognition
  lsp_languages:                   # Languages for code analysis
    - javascript
    - typescript
```

## Hybrid Integration

Connect to external sources:

```yaml
hybrid:
  enable_mental: true       # @mentalmodel/cli integration
  enable_external: true     # Skills.sh community search
  auto_graduate: true       # Auto-promote skills that meet criteria
```

### Mental Model

When enabled, Auto-Skill uses [@mentalmodel/cli](https://github.com/Michaelliv/mental) to understand your codebase semantically — mapping domains, capabilities, and architectural decisions. This enriches skill names and context.

### Skills.sh

When enabled, pattern detection also searches the [Skills.sh](https://skills.sh) community (27,000+ skills) for existing skills that match your workflow. External skills start at low confidence and earn trust through adoption.

## Confidence Formula

The confidence score determines whether a pattern becomes a skill suggestion:

```
confidence = (
    occurrences_score × 0.40 +    # Repetition frequency
    length_score     × 0.20 +    # Ideal length is 3–5 tools
    success_rate     × 0.25 +    # How often the pattern succeeds
    recency_score    × 0.15      # Recent usage weighted higher
)
```

Additional boosts:
- +0.10 if Mental Model context matches
- +0.05 if an external skill is proven through adoption

## Full Example

```yaml
---
detection:
  min_occurrences: 3
  min_sequence_length: 2
  max_sequence_length: 10
  lookback_days: 7
  min_confidence: 0.7
  ignored_tools:
    - AskUserQuestion

v2:
  enable_session_analysis: true
  enable_lsp_analysis: true
  enable_pattern_detection: true
  lsp_languages:
    - javascript
    - typescript

hybrid:
  enable_mental: true
  enable_external: true
  auto_graduate: true

enabled: true
---
```
