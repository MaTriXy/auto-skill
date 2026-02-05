---
sidebar_position: 4
---

# Discovery & Graduation

Beyond local pattern detection, Auto-Skill connects to external skill sources and manages trust through an adoption system.

## Unified Discovery

The `UnifiedSuggester` merges skills from multiple sources and ranks them:

```
Local Patterns  →  highest priority (actual usage data)
Proven External →  high priority (used and successful)
Mental Hints    →  medium priority (semantic match)
External Search →  lower priority (community, untested)
```

### Searching

```bash
# Discover skills from all sources
auto-skill discover

# View adoption stats
auto-skill stats

# JSON output
auto-skill discover --json
```

To search the Skills.sh community directly, use **Skills CLI**:
```bash
npx skills find authentication    # Interactive search
npx skills add owner/repo@skill   # Install specific skill
```

## Skills.sh Integration

[Skills.sh](https://skills.sh) hosts 27,000+ community-contributed skills. When `hybrid.enable_external` is true, Auto-Skill searches this registry for skills matching your detected patterns.

External skills are installed to `~/.claude/skills/external/` and start with a **50% confidence** score.

## Adoption Tracking

Every external skill is tracked in a local SQLite database:

| Field | Description |
|-------|-------------|
| `usage_count` | Times the skill was triggered |
| `success_count` | Times it led to a successful outcome |
| `initial_confidence` | Starting confidence (50% for external) |
| `current_confidence` | Evolves with usage |
| `graduated_to_local` | Whether it's been promoted |

Confidence increases with successful usage and decreases with failures.

## Graduation

When an external skill proves itself, it can graduate to a local skill with full confidence:

**Criteria:**
- 5+ uses
- 80% success rate
- Confidence reaches 85%

**Process:**
1. `GraduationManager.detectCandidates()` finds eligible skills
2. User reviews and approves the promotion
3. A local SKILL.md is generated in `~/.claude/skills/auto/`
4. The graduation is logged in `graduation_log.json`
5. The skill tracker marks it as graduated

```bash
# View graduation candidates
auto-skill graduate
```

### Confidence Lifecycle

```
External Skill (50%)
    │
    ├── 3+ uses, 70% success → Proven (75%)
    │
    ├── 5+ uses, 80% success → Graduated (85%+)
    │                           Local SKILL.md created
    │
    └── Low usage / failures → Confidence decays
                                Eventually dropped
```

## Publishing

If you've built skills that could help others, Auto-Skill can publish them to Skills.sh:

```bash
# Find publishable skills (≥85% confidence, ≥5 uses, ≥80% success)
auto-skill discover --publishable

# Sync community stats (installs, ratings)
auto-skill stats --sync
```

Published skills track community install counts and ratings, so you can see how your workflows help others.
