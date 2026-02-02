# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Auto-Skill** is a system that automatically generates coding agent skills by observing workflow patterns, detecting repetition, and codifying successful procedures into reusable SKILL.md files. It supports multiple coding agents (Claude Code, Cursor, Codex, Aider, Windsurf, and more) with cross-agent skill sharing, enabling any agent to learn from interactions and create skills autonomously.

**Install:** `npx skills add MaTriXy/auto-skill`

## Architecture

The system follows a pipeline architecture with three main stages:

### 1. Observer (Event Capture)
- Hooks into the coding agent's tool execution flow via `hooks/hooks.json`
- Captures workflow events including tool calls, outcomes, and context
- Stores events in a local SQLite database (`~/.claude/auto-skill/events.db`)
- Implementation: `src/hooks/observer.ts`

### 2. Detector (Pattern Recognition)
- Analyzes captured events for reusable patterns
- Detection triggers:
  - **Repetition**: Same tool sequence 3+ times
  - **Success patterns**: High success rate on similar tasks
  - **User corrections**: User redirects Claude's approach
  - **Explicit teaching**: User provides domain knowledge
  - **Error recovery**: Successful self-correction patterns
- Session analysis detects intent (debug, implement, refactor, test)
- 18 design patterns recognized (MVC, TDD, Factory, etc.)
- Implementation: `src/core/pattern-detector.ts`, `src/core/session-analyzer.ts`, `src/core/design-pattern-detector.ts`

### 3. Skill Forge (Skill Generation)
- Generates valid SKILL.md files from detected patterns
- Auto-generates YAML frontmatter with metadata
- Extracts procedural steps and embedded code
- Stores skills in `~/.claude/skills/auto/`
- Implementation: `src/core/skill-generator.ts`

### Human-in-the-Loop
- Skills require user confirmation before activation
- Users can customize, ignore, or blacklist patterns
- Confidence scores guide when to suggest skills

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Implementation** | Agent Plugin | Hooks for observation, skills for output, cross-agent symlinks |
| **Distribution** | `npx skills add` | Zero-install via Skills CLI |
| **Detection scope** | Per-project + global | Project-specific patterns with cross-agent sharing |
| **Confirmation model** | Always confirm before activation | Prevents unwanted or incorrect skills |
| **Skill storage** | Local filesystem | Simplicity, matches existing skill system |
| **External discovery** | Skills.sh + well-known | 27,000+ community skills, RFC 8615 endpoints |

## File Structure

```
/src/                # TypeScript source code
/src/core/           # Core modules (pattern detection, skill generation, telemetry)
/src/core/providers/ # Pluggable skill source providers (local, skillssh, wellknown)
/src/cli/            # CLI commands (Commander)
/src/hooks/          # Event capture hooks
/src/mcp/            # MCP server (stdio + HTTP)
/src/web/            # Web UI (Hono)
/src/formatter/      # Output formatting
/bin/                # CLI entry point
/tests/              # Vitest tests
/skills/             # Plugin skills (SKILL.md files)
/website/            # Documentation site (Docusaurus)
```

## Technical Constraints

- Must generate valid SKILL.md files compatible with supported coding agents' skill systems
- YAML frontmatter must include `name` and `description` at minimum
- Auto-generated skills should be clearly marked (`auto-generated: true`)
- Skills should track source sessions for debugging/refinement
- Pattern detection must avoid false positives (high precision preferred)

## Integration Points

- **Agent Skills System**: Outputs compatible SKILL.md format for multiple coding agents
- **Skills CLI**: Installable via `npx skills add MaTriXy/auto-skill`
- **Skills.sh**: External skill discovery and publishing
- **Multi-Agent**: Supports multiple coding agents with cross-agent skill sharing via symlinks
- **User Workflow**: Non-intrusive observation, confirmation-based activation

## Development

```bash
git clone https://github.com/MaTriXy/auto-skill.git
cd auto-skill
npm install
npm test
```

## References

- [Skills CLI](https://github.com/vercel-labs/skills): `npx skills add` distribution
- [Claude Code Skills docs](https://docs.anthropic.com/en/docs/claude-code/skills): SKILL.md format
- [agentskills.io](https://agentskills.io): Skill spec compliance
- [Skills.sh](https://skills.sh): Community skill registry
