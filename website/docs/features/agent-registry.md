---
sidebar_position: 2
---

# Agent Registry

Auto-Skill detects and supports multiple coding agents, enabling cross-agent skill sharing through filesystem symlinks.

## Supported Agents

| Agent | Env Variable | Config File | Skill Directory |
|-------|-------------|-------------|-----------------|
| Claude Code | `CLAUDE_CODE` | `~/.claude/settings.json` | `~/.claude/skills/` |
| OpenCode | `OPENCODE` | `~/.opencode/config.json` | `~/.opencode/skills/` |
| Codex | `CODEX_CLI` | `~/.codex/config.json` | `~/.codex/skills/` |
| Continue | `CONTINUE` | `~/.continue/config.json` | `~/.continue/skills/` |
| Aider | `AIDER` | `~/.aider/config.json` | `~/.aider/skills/` |
| Cursor | `CURSOR` | `~/.cursor/config.json` | `~/.cursor/skills/` |
| Windsurf | `WINDSURF` | `~/.windsurf/config.json` | `~/.windsurf/skills/` |
| Cline | `CLINE` | `~/.cline/config.json` | `~/.cline/skills/` |
| Amp | `AMP` | `~/.amp/config.json` | `~/.amp/skills/` |
| Copilot | `GITHUB_COPILOT` | `~/.copilot/config.json` | `~/.copilot/skills/` |

## Detection

An agent is considered "installed" if any of these are true:
- Its environment variable is set
- Its config file exists
- Its skill directory exists

```bash
auto-skill agents detect   # Show which agents are installed
```

## Cross-Agent Skill Sharing

When a skill is generated, Auto-Skill creates symlinks in all detected agents' skill directories. This means a skill created in any agent is automatically available in all other installed agents — learn once, use everywhere.

```bash
auto-skill agents list     # See all agents and their status
```

## Current Agent Detection

The observer hook automatically detects which agent is running the current session by checking environment variables. This is recorded in telemetry events for per-agent effectiveness tracking.
