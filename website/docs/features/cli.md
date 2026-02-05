---
sidebar_position: 1
---

# CLI Reference

All commands use the unified `auto-skill` entry point. Every command supports `--json` for machine-readable output.

## Core Commands

### `auto-skill init`

Initialize auto-skill configuration and directories.

```bash
auto-skill init          # Create config and directories
auto-skill init --force  # Force recreate config
```

Creates:
- `~/.claude/auto-skill/` — Event database and config
- `~/.claude/skills/auto/` — Auto-generated skill output directory

### `auto-skill discover`

Discover skills for the current project by analyzing patterns, Mental models, and external sources.

```bash
auto-skill discover                    # Full discovery
auto-skill discover --project ./path   # Specific project
auto-skill discover --no-mental        # Skip Mental model
auto-skill discover --no-external      # Skip Skills.sh
auto-skill discover --limit 5          # Limit results
auto-skill discover --wellknown        # Include RFC 8615 discovery
auto-skill discover --effectiveness    # Show effectiveness data
auto-skill discover --json             # JSON output
```

:::note Searching for Skills
To search for community skills, use **Skills CLI** instead:
```bash
npx skills find react testing    # Interactive search
npx skills add owner/repo@skill  # Install specific skill
```
Auto-Skill focuses on **generating** skills, while Skills CLI handles **distribution**.
:::

### `auto-skill stats`

Show adoption statistics for tracked skills.

```bash
auto-skill stats
auto-skill stats --project ./path
auto-skill stats --json
```

### `auto-skill graduate`

Manage skill graduation from external to local.

```bash
auto-skill graduate             # Detect candidates
auto-skill graduate detect      # Same as above
auto-skill graduate auto        # Auto-graduate top candidates
auto-skill graduate auto --max 3
auto-skill graduate stats       # Graduation statistics
auto-skill graduate history     # Graduation history
```

## Agent Management

### `auto-skill agents`

```bash
auto-skill agents list     # List all known agents and their status
auto-skill agents detect   # Detect which agents are installed
auto-skill agents list --json
```

## Lock File

### `auto-skill lock`

Manage skill integrity verification.

```bash
auto-skill lock status    # Show lock file path, version, skill count
auto-skill lock verify    # Verify SHA-256 hashes of all locked skills
auto-skill lock list      # List all locked skills with hashes
auto-skill lock status --json
```

## Telemetry

### `auto-skill telemetry`

View local usage telemetry and effectiveness reports.

```bash
auto-skill telemetry report                # Effectiveness summary
auto-skill telemetry events                # Raw event log
auto-skill telemetry report --skill "name" # Filter to specific skill
auto-skill telemetry events --limit 50     # Limit events
auto-skill telemetry report --json
```

## Utility

### `auto-skill version`

```bash
auto-skill version    # Show installed version
```
