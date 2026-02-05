---
sidebar_position: 2
sidebar_label: What's New in v5.0
---

# What's New in v5.0

Auto-Skill v5.0 introduces **Proactive Skill Discovery** - a groundbreaking closed-loop learning system that combines local pattern detection with real-time community skill discovery from 27,000+ external sources.

## 🚀 Major Features

### Proactive Skill Discovery

Auto-Skill now **proactively suggests community skills** when it detects patterns in your workflow - without you having to search manually.

**How it works:**
1. You work in your coding agent (e.g., React testing workflow)
2. Auto-Skill detects the pattern locally
3. Simultaneously searches Skills.sh for matching community skills
4. Suggests: *"I found 'React Test Patterns' that matches your workflow. Use it instead?"*

**Example:**
```typescript
// Pattern detected: React + test intent
const recommendations = await discovery.discoverForPattern({
  frameworks: ['react'],
  languages: ['typescript'],
  intent: 'test'
});

// Auto-Skill suggests:
// - "React Test Patterns" (850 installs, 0.92 confidence)
// - "Jest Best Practices" (620 installs, 0.85 confidence)
```

### External Skill Loader

Port of [Skyll](https://github.com/assafelovic/skyll)'s SkillSearchService to TypeScript with full Auto-Skill integration.

**Features:**
- Searches 27,000+ skills from [Skills.sh](https://skills.sh)
- Fetches full SKILL.md content from GitHub
- In-memory caching with 24-hour TTL
- Works with or without GitHub token (60 vs 5000 req/hr)
- Relevance ranking by install count + semantic match

### Skill Recommendation Engine

Unified interface that recommends the best action based on confidence:

| Recommendation Type | When | Action |
|-------------------|------|--------|
| **Local** | No external match | `generate` - Create skill from your pattern |
| **External** | Medium confidence (50-70%) | `load` - Use community skill as-is |
| **Hybrid** | High confidence (70%+) | `graduate` - Adopt and customize |

### Skills CLI Integration

Auto-Skill now focuses on **skill generation**, while [Skills CLI](https://github.com/vercel-labs/skills) handles **distribution**.

**Division of labor:**
```bash
# Auto-Skill: Generate skills from patterns
auto-skill discover

# Skills CLI: Search and install community skills
npx skills find react testing
npx skills add owner/repo@skill
```

This architectural clarity eliminates duplication and provides the best tool for each job.

## 🔧 Technical Improvements

### Native Fetch API
- Zero new dependencies
- Uses Node.js 18+ built-in `fetch`
- AbortSignal support for timeouts

### MCP Tools
New tools for programmatic access:

```json
{
  "name": "search_skills",
  "arguments": {
    "query": "react performance",
    "limit": 5,
    "includeContent": true
  }
}
```

```json
{
  "name": "discover_skills",
  "arguments": {
    "frameworks": ["react"],
    "languages": ["typescript"],
    "intent": "test"
  }
}
```

## ⚠️ Breaking Changes

### Removed: `auto-skill search` command

**Why:** Skills CLI provides superior search with interactive fzf-style UI.

**Migration:**
```bash
# OLD (v4.x)
auto-skill search "react testing"

# NEW (v5.0)
npx skills find react testing
```

For programmatic access, use MCP tools instead (`search_skills`, `discover_skills`).

## 📚 New Documentation

- **[Proactive Discovery Guide](/docs/features/proactive-discovery)** - Comprehensive 500+ line guide
- **[Examples](https://github.com/MaTriXy/auto-skill/tree/main/examples)** - 5 practical examples

## 🔮 What's Next (v5.1+)

- Semantic search with embeddings
- Usage analytics for external skills
- Auto-loading of high-confidence skills
- Local registry for offline access
- Skill fusion (merge local + external)

## 📦 Installation

```bash
npm install @matrixy/auto-skill@5.0.0
# or
npx skills add MaTriXy/auto-skill
```

**Full Changelog:** [v4.0.1...v5.0.0](https://github.com/MaTriXy/auto-skill/blob/main/changelog/v5.0.md)
