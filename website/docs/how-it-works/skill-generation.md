---
sidebar_position: 3
---

# Skill Generation

The Skill Forge (`src/core/skill-generator.ts`) turns detected patterns into valid SKILL.md files compatible with any supported coding agent's skill system.

## Output Format

Every generated skill follows this structure:

```yaml
---
name: read-edit-test-workflow
description: Read-modify-test cycle for iterative development
confidence: 0.85
occurrence-count: 7
source: auto-generated

session-analysis:
  primary_intent: implement
  workflow_type: TDD
  tool_success_rate: 0.95

mental-context:           # Present when Mental Model is enabled
  domains: [Payment, Order]
  capabilities: [Checkout]
  aspects: [Validation]

compatible-agents: [claude-code, opencode]
tags: [read, edit, test, implement]
---

# read-edit-test-workflow

Read-modify-test cycle for iterative development.

## When to Use
- When implementing new features with an existing test suite
- When the workflow follows a TDD pattern

## Design Patterns
- **TDD** (confidence: 0.90) — Tests written before implementation
- **Error-First Handling** (confidence: 0.75) — Error cases handled upfront

## Steps
1. Read the target module to understand current state
2. Edit the module with new implementation
3. Run tests to verify behavior
4. Check test output for failures

## Code Structure
- Classes: PaymentProcessor, OrderService
- Entry points: process_payment(), create_order()
```

## What Gets Included

The generator pulls from all detection layers:

| Section | Source | Description |
|---------|--------|-------------|
| Frontmatter | PatternDetector | Name, confidence, occurrence count |
| Session Analysis | SessionAnalyzer | Intent, workflow type, success rate |
| Mental Context | MentalAnalyzer | Domains, capabilities, aspects |
| When to Use | SessionAnalyzer + PatternDetector | Context-based guidance |
| Design Patterns | DesignPatternDetector | Architectural/coding patterns found |
| Steps | SequenceMatcher | Tool sequence as procedural steps |
| Code Structure | LSPAnalyzer | Classes, functions, dependencies |

## Naming

Skill names are derived from the tool sequence and domain context:

- Base: Tool names joined with hyphens → `read-edit-bash`
- With intent: Prefixed with workflow type → `tdd-read-edit-bash`
- With domain: Prefixed with Mental domain → `payment-tdd-read-edit-bash`

Duplicates get numeric suffixes.

## Output Location

Generated skills are written to:

```
~/.claude/skills/auto/{skill_name}.md
```

They're immediately available to your coding agent's skill system and symlinked to all other detected agents. Skills are marked as `auto-generated: true` in the frontmatter for easy identification.

## Human Review

Skills are **never activated without approval**. The generation process creates candidates, and the user must explicitly accept them. This prevents incorrect or unwanted patterns from becoming active skills.

You can review candidates via:

```bash
auto-skill discover                   # CLI
# or
auto-skill serve                      # Web UI
```
