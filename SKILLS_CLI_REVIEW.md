# Skills CLI Review - What They Already Have

After reviewing [vercel-labs/skills](https://github.com/vercel-labs/skills), here's what the Skills CLI already provides and how Auto-Skill fits in.

---

## What Skills CLI Already Does

### 1. **Search & Discovery** ✅ (Already Built)

**API Integration:**
```typescript
// skills-cli/src/find.ts
const SEARCH_API_BASE = 'https://skills.sh';
const url = `${SEARCH_API_BASE}/api/search?q=${query}&limit=10`;

interface SearchSkill {
  name: string;
  slug: string;
  source: string;  // owner/repo
  installs: number;
}
```

**Features:**
- Interactive fzf-style search prompt
- Debounced API calls (150-350ms based on query length)
- Non-interactive mode for CI/agents
- Shows install count and source

**Commands:**
```bash
npx skills find                    # Interactive search
npx skills find typescript         # Keyword search
npx skills add owner/repo@skill    # Direct install
```

---

### 2. **Installation System** ✅ (Already Built)

**Two Methods:**
1. **Symlink** (Recommended)
   - Canonical copy in one location
   - Symlinks to each agent
   - Single source of truth, easy updates

2. **Copy**
   - Independent copies per agent
   - For systems without symlink support

**Multi-Agent Support:**
```bash
# Install to specific agents
npx skills add repo --agent claude-code --agent cursor

# Install to all agents
npx skills add repo --agent '*'

# Per-project or global
npx skills add repo             # Project: ./<agent>/skills/
npx skills add repo --global    # Global: ~/<agent>/skills/
```

**Agent Detection:**
Automatically detects 40+ agents:
- Claude Code, Cursor, Codex, OpenCode
- Aider, Continue, Windsurf, Zed, etc.

---

### 3. **Skill Management** ✅ (Already Built)

**Commands:**
```bash
npx skills list                # List installed skills
npx skills check               # Check for updates
npx skills update              # Update all skills
npx skills remove <skill>      # Uninstall skill
npx skills init [name]         # Create SKILL.md template
```

**Lock File:**
- SHA-256 integrity checking
- Version tracking
- Update detection

---

### 4. **skills.sh Integration** ✅ (Already Built)

**API Endpoint:**
```
GET https://skills.sh/api/search?q={query}&limit={limit}

Response:
{
  "skills": [
    {
      "id": "skill-slug",
      "name": "Skill Name",
      "installs": 1250,
      "source": "owner/repo"
    }
  ]
}
```

**Web Integration:**
- Links to `https://skills.sh/{slug}` for details
- Displays install counts
- Shows repository sources

---

## What Auto-Skill Should Do Differently

### ✅ What We're Already Doing Right

1. **Auto-Generation** - Skills CLI doesn't create skills, we do
2. **Pattern Detection** - We observe and learn, they don't
3. **Proactive Discovery** - We search BEFORE the user asks
4. **Smart Recommendations** - We suggest graduation from local → community

### 🎯 What We Should Leverage from Skills CLI

1. **Don't duplicate `find` command** - Skills CLI already has this
2. **Don't duplicate installation** - Skills CLI handles multi-agent installs
3. **Use skills.sh API** - We're already doing this ✅
4. **Generate skills.sh-compatible metadata** - We're already doing this ✅

### 🚀 What We Should Add/Improve

#### 1. **Auto-Publishing Helper**

Instead of manual GitHub workflow, create a command:

```bash
auto-skill publish <pattern-id>
```

**Workflow:**
1. Locate auto-generated skill in `~/.claude/skills/auto/`
2. Review & generalize (remove project-specific details)
3. Create GitHub repo automatically
4. Push SKILL.md
5. Submit to skills.sh API (if they have a publish endpoint)

**Code Location:** `src/cli/commands/publish.ts`

#### 2. **Integration with Skills CLI**

Make Auto-Skill work **with** Skills CLI, not duplicate it:

```bash
# User workflow
auto-skill discover              # Shows patterns + community alternatives
> Pattern: grep-read-edit (3 uses, 75% confidence)
> Community alternative: "File Search & Edit" (820 installs)
>
> [1] Use community skill
> [2] Generate local skill
> [3] View on skills.sh

# If user picks [1], run:
npx skills add vercel-labs/agent-skills@file-search-edit

# If user picks [2], generate local skill as usual
```

#### 3. **Quality Scoring for Publishing**

Before suggesting publishing, check:
- ✅ Confidence ≥ 85%
- ✅ Used 10+ times
- ✅ Not project-specific (no hardcoded paths)
- ✅ Clear, generalizable description
- ✅ No sensitive data in examples

**Show readiness score:**
```bash
auto-skill publish-check

> Skill: grep-read-edit-abc123
> Readiness Score: 8/10
> ✅ High confidence (87%)
> ✅ Well-tested (12 uses)
> ✅ Generalized workflow
> ⚠️  Description could be clearer
> ⚠️  Add usage examples
>
> Ready to publish? [y/N]
```

---

## Recommended Architecture Changes

### Current (What We Have)

```
Auto-Skill v5.0
├─ Pattern Detection
├─ Proactive Discovery (NEW)
├─ External Search (skills.sh API)
└─ MCP Server
```

### Recommended (Leverage Skills CLI)

```
Auto-Skill v5.0
├─ Pattern Detection
├─ Proactive Discovery
├─ External Search (skills.sh API) ✅ Keep this
├─ MCP Server
└─ Publishing Helper (NEW)
    ├─ Quality scoring
    ├─ Auto-generalization
    ├─ GitHub repo creation
    └─ skills.sh submission

Skills CLI (External Dependency)
├─ Search & Discovery
├─ Installation (symlink/copy)
├─ Multi-agent support
└─ Update management
```

### Integration Points

**1. Discovery Command:**
```typescript
// When showing recommendations, offer to install via Skills CLI
if (externalSkill.confidence >= 0.7) {
  console.log(`Install with: npx skills add ${externalSkill.source}@${externalSkill.title}`);
}
```

**2. Publish Command:**
```bash
auto-skill publish <pattern-id> --check    # Dry run
auto-skill publish <pattern-id> --auto     # Auto-create repo & push
```

---

## What We Should NOT Build

❌ **Don't duplicate:**
1. `skills find` - Skills CLI already has fzf-style search
2. Installation system - Skills CLI handles symlinks, multi-agent
3. Update checking - Skills CLI has `check` and `update`
4. Lock files - Skills CLI tracks SHA-256, versions

✅ **Instead, focus on:**
1. Better skill generation quality
2. Auto-publishing workflow
3. Community contribution funnel
4. Quality scoring & readiness checks

---

## Action Items for v5.0

### High Priority
- [ ] Remove duplicate search functionality from CLI (use Skills CLI instead)
- [ ] Update docs to reference `npx skills find` for manual search
- [ ] Add "Install with Skills CLI" to MCP tool responses
- [ ] Create `auto-skill publish` command with quality checks

### Medium Priority
- [ ] Add GitHub repo creation helper
- [ ] Implement skill readiness scoring
- [ ] Auto-generalization suggestions (detect hardcoded paths, etc.)
- [ ] skills.sh submission API integration (if available)

### Low Priority
- [ ] Telemetry integration with Skills CLI events
- [ ] Skill analytics dashboard
- [ ] Community contribution stats

---

## Marketplace Vision (Revised)

**Original Vision:**
> Auto-Skill becomes a marketplace/curator

**Revised Vision:**
> Auto-Skill becomes a **skill factory** that feeds into the existing skills.sh marketplace

**Flow:**
```
1. Auto-Skill detects patterns → generates skills
2. User refines & approves for publishing
3. auto-skill publish creates repo + submits to skills.sh
4. Skills CLI handles discovery & installation
5. Other users find via npx skills find
6. Network effects grow the ecosystem
```

**Our Role:**
- **Supply Side**: Generate high-quality skills from patterns
- **Quality Gate**: Ensure published skills are generalizable
- **Publishing Tools**: Make it easy to share

**Skills CLI's Role:**
- **Discovery**: Search and browse
- **Distribution**: Install and update
- **Management**: List, remove, version control

**skills.sh's Role:**
- **Registry**: Central catalog
- **Metrics**: Install counts, popularity
- **Discovery**: Web interface

---

## Summary

**What Skills CLI Already Does:**
✅ Search (API + interactive)
✅ Install (multi-agent, symlink/copy)
✅ Manage (list, update, remove)
✅ skills.sh integration

**What Auto-Skill Should Do:**
🎯 Auto-generate skills from patterns
🎯 Proactively recommend community skills
🎯 Help users publish to skills.sh
🎯 Quality scoring & readiness checks

**What We Should NOT Duplicate:**
❌ Search/find commands (use Skills CLI)
❌ Installation system (use Skills CLI)
❌ Update management (use Skills CLI)

**Next Steps:**
1. Update v5.0 docs to reference Skills CLI for manual search
2. Create `auto-skill publish` command
3. Add quality scoring for publishable skills
4. Integrate "Install with Skills CLI" in recommendations
