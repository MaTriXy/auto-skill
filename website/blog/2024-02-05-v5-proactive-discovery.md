---
slug: v5-proactive-discovery
title: 'Auto-Skill v5.0: Proactive Skill Discovery'
authors: [matrixy]
tags: [release, v5, proactive-discovery, skills.sh]
---

Auto-Skill v5.0 introduces **Proactive Skill Discovery** - transforming from a passive pattern recorder into an active learning companion that suggests community skills BEFORE you ask.

<!-- truncate -->

## 🎯 What's New

Auto-Skill now **proactively suggests community skills** from 27,000+ external sources based on your workflow context.

### Before (v4.0)
```
User repeats workflow → Auto-Skill generates local skill
```

### After (v5.0)
```
User repeats workflow → Auto-Skill:
  1. Detects context (React + Testing)
  2. Searches skills.sh
  3. Finds "React Test Patterns" (1250 installs)
  4. Suggests: "Use this instead of generating new skill?"
```

---

## ✨ Key Features

### 1. External Skill Search

Search 27,000+ community skills from [skills.sh](https://skills.sh) in real-time:

```typescript
import { createExternalSkillLoader } from '@matrixy/auto-skill';

const loader = createExternalSkillLoader();
await loader.start();

const response = await loader.search('react testing', { limit: 5 });
console.log(response.skills);
// Returns: [{ title, description, content, installCount, ... }]

await loader.stop();
```

### 2. Context-Aware Recommendations

Automatically suggests skills based on detected patterns:

```typescript
import { createProactiveDiscovery } from '@matrixy/auto-skill';

const discovery = createProactiveDiscovery(loader);
const recommendations = await discovery.discoverForPattern(pattern);
console.log(recommendations);
// Returns: [{ skill, reason, confidence, trigger }]
```

### 3. Smart Graduation

Recommends upgrading local patterns to community skills at 70%+ confidence:

```typescript
import { createSkillRecommendationEngine } from '@matrixy/auto-skill';

const engine = createSkillRecommendationEngine(loader, discovery);
const recs = await engine.recommendForPattern(pattern);
console.log(recs);
// Returns: [{ type: 'hybrid', action: 'graduate', confidence: 0.9 }]
```

---

## 🔧 What Was Built

| Component | Lines | Purpose |
|-----------|-------|---------|
| `external-skill-loader.ts` | 392 | Search & fetch from skills.sh + GitHub |
| `proactive-discovery.ts` | 225 | Context-aware recommendations |
| `skill-recommendation-engine.ts` | 149 | Unified local + external interface |
| **Total New Code** | **766** | **Complete closed-loop system** |

### MCP Integration

Two new tools for Claude Code, Cursor, and other MCP clients:
- **`search_skills`** - Manual skill search by query
- **`discover_skills`** - Context-based proactive discovery

---

## 🎨 Architecture

```
Pattern Detector (existing)
     ↓
Context Analyzer (NEW)
     ↓
Skill Recommendation Engine (NEW)
     ├─ Local: Generate custom skill
     ├─ External: Load community skill
     └─ Hybrid: Graduate to community skill
```

---

## 💡 Design Highlights

- **Zero dependencies** - Uses Node.js native `fetch` (Node 18+)
- **In-memory cache** - 24-hour TTL with auto-cleanup
- **Rate limits** - 60 req/hr (no token) → 5000 req/hr (with GitHub token)
- **Confidence scoring** - Install count (50%) + Relevance (50%)
- **Graduation threshold** - 70% default (configurable)

---

## 🚀 Getting Started

Install the latest version:

```bash
npm install -g @matrixy/auto-skill@5.0.0
```

Quick example:

```typescript
import {
  createExternalSkillLoader,
  createProactiveDiscovery,
  createSkillRecommendationEngine,
} from '@matrixy/auto-skill';

const loader = createExternalSkillLoader({
  githubToken: process.env.GITHUB_TOKEN, // Optional
});

const discovery = createProactiveDiscovery(loader);
const engine = createSkillRecommendationEngine(loader, discovery);

await loader.start();

// Get unified recommendations for a detected pattern
const recommendations = await engine.recommendForPattern(pattern);

console.log(recommendations);
// [
//   {
//     type: 'hybrid',
//     externalSkill: { title: 'React Test Patterns', installCount: 1250 },
//     reason: 'Your workflow matches "React Test Patterns". Use it instead?',
//     confidence: 0.9,
//     action: 'graduate'
//   }
// ]

await loader.stop();
```

---

## 📚 Documentation

- **[Proactive Discovery Guide](/features/proactive-discovery)** - Complete usage guide
- **[Examples](https://github.com/MaTriXy/auto-skill/tree/main/examples)** - 5 runnable code examples
- **[Full Changelog](https://github.com/MaTriXy/auto-skill/blob/main/CHANGELOG_V5.md)** - Detailed release notes

---

## ⚠️ Breaking Changes

**None.** Fully backward compatible with v4.x.

---

## 🔮 What's Next (v5.1+)

- [ ] Semantic search with embeddings for better relevance
- [ ] Usage analytics to track which external skills are most effective
- [ ] Auto-loading of high-confidence skills into context
- [ ] Local registry for offline skill access
- [ ] Skill fusion - merge local patterns with external skills

---

## 🙏 Credits

This release was inspired by [Skyll](https://github.com/MaTriXy/skyll) - we ported its search architecture to TypeScript for seamless Auto-Skill integration.

---

**Questions?** [Open an issue](https://github.com/MaTriXy/auto-skill/issues) | **Full Docs:** [auto-skill](/)
