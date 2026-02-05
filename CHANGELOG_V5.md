# Changelog - v5.0.0

## 🚀 Major Release: Proactive Skill Discovery

**Release Date:** 2024-02-04

Auto-Skill v5.0 introduces a groundbreaking **closed-loop learning system** that combines local pattern detection with real-time community skill discovery from 27,000+ external sources.

---

## ✨ New Features

### 1. **External Skill Loader**
Port of Skyll's SkillSearchService to TypeScript with full integration.

**What it does:**
- Searches 27,000+ community skills from [skills.sh](https://skills.sh) in real-time
- Fetches full SKILL.md content from GitHub repositories
- Caches results with configurable TTL (default: 24 hours)
- Works with or without GitHub token (60 req/hr vs 5000 req/hr)

**New modules:**
- `src/core/external-skill-loader.ts` - Main service
- HTTP clients for skills.sh API and GitHub Tree API
- In-memory cache with automatic cleanup
- Relevance ranking algorithm

**Example:**
```typescript
import { createExternalSkillLoader } from '@matrixy/auto-skill';

const loader = createExternalSkillLoader({
  githubToken: process.env.GITHUB_TOKEN,
  cacheTtl: 86400, // 24 hours
});

await loader.start();

const response = await loader.search('react testing', {
  limit: 10,
  includeContent: true,
});

console.log(response.skills);
// [{ id, title, description, source, installCount, content, ... }]

await loader.stop();
```

---

### 2. **Proactive Skill Discovery**
Context-aware skill recommendations based on detected patterns.

**What it does:**
- Analyzes detected patterns for framework/language hints
- Generates targeted search queries (e.g., "react testing")
- Ranks external skills by confidence (install count + relevance)
- Suggests community skills BEFORE the user asks

**New module:**
- `src/core/proactive-discovery.ts`

**Triggers:**
| Context | Generated Query |
|---------|----------------|
| `frameworks: ['react'], intent: 'test'` | "react testing", "react test patterns" |
| `frameworks: ['nextjs'], intent: 'implement'` | "nextjs best practices" |
| `tools: ['Bash', 'Grep']` | "code search patterns" |

**Example:**
```typescript
import { createProactiveDiscovery } from '@matrixy/auto-skill';

const discovery = createProactiveDiscovery(loader);

const recommendations = await discovery.discoverForPattern(detectedPattern);

console.log(recommendations);
// [
//   {
//     skill: { title: 'React Test Patterns', ... },
//     reason: 'Detected react usage with test intent',
//     confidence: 0.85,
//     trigger: 'framework'
//   }
// ]
```

---

### 3. **Skill Recommendation Engine**
Unified interface combining local and external skill sources.

**What it does:**
- Recommends **local** generation when no external match found
- Recommends **external** loading for medium-confidence matches
- Recommends **hybrid graduation** for high-confidence matches (70%+)
- Provides actionable recommendations: `load`, `generate`, or `graduate`

**New module:**
- `src/core/skill-recommendation-engine.ts`

**Recommendation types:**
| Type | Confidence | Action | When |
|------|-----------|--------|------|
| **local** | N/A | `generate` | No external match found |
| **external** | 50-70% | `load` | Medium-confidence community skill |
| **hybrid** | 70%+ | `graduate` | High-confidence match - suggest upgrading |

**Example:**
```typescript
import { createSkillRecommendationEngine } from '@matrixy/auto-skill';

const engine = createSkillRecommendationEngine(loader, discovery, {
  graduationThreshold: 0.7, // Recommend graduation at 70%+
});

const recommendations = await engine.recommendForPattern(pattern);

console.log(recommendations);
// [
//   {
//     type: 'hybrid',
//     externalSkill: { ... },
//     localPattern: { ... },
//     reason: 'Your workflow matches "React Test Patterns". Use it instead?',
//     confidence: 0.9,
//     action: 'graduate'
//   }
// ]
```

---

### 4. **MCP Server Enhancements**
New tools for proactive discovery exposed via Model Context Protocol.

**New tools:**

#### `search_skills`
Search community skills by query string.

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

#### `discover_skills`
Proactively discover skills based on current context.

```json
{
  "name": "discover_skills",
  "arguments": {
    "frameworks": ["react", "nextjs"],
    "languages": ["typescript"],
    "intent": "test"
  }
}
```

**Updated:**
- `src/mcp/server.ts` - Added new tool definitions and handlers

---

### 5. **Native Fetch API Integration**
Zero-dependency HTTP client using Node.js built-in `fetch`.

**Why:**
- No external dependencies (no axios, got, etc.)
- Modern Promise-based API
- Standards-compliant (same as browser fetch)
- AbortSignal support for timeouts

**Usage:**
```typescript
const response = await fetch(url, {
  headers: { 'Accept': 'application/json' },
  signal: AbortSignal.timeout(10000), // 10s timeout
});
```

---

## 📚 Documentation

### New Guides
- 📖 **[Proactive Discovery Guide](docs/PROACTIVE_DISCOVERY.md)** - Comprehensive 500+ line guide
  - Architecture overview
  - API reference
  - Use cases and examples
  - Configuration options
  - Troubleshooting

### New Examples
- 🎯 **[examples/proactive-discovery.ts](examples/proactive-discovery.ts)** - 5 practical examples:
  1. Basic search
  2. Fetch full skill content
  3. Context-aware discovery
  4. Unified recommendations (hybrid)
  5. Manual skill loading

---

## 🔧 API Changes

### New Exports
```typescript
// Core modules
export { createExternalSkillLoader } from './core/external-skill-loader';
export { createProactiveDiscovery } from './core/proactive-discovery';
export { createSkillRecommendationEngine } from './core/skill-recommendation-engine';

// Types
export type { CommunitySkill } from './core/external-skill-loader';
export type { SkillSearchResponse } from './core/external-skill-loader';
export type { WorkflowContext } from './core/proactive-discovery';
export type { SkillRecommendation } from './core/proactive-discovery';
export type { UnifiedRecommendation } from './core/skill-recommendation-engine';
```

### Breaking Changes
None. All existing APIs remain backward compatible.

---

## 🎨 Architecture Improvements

### File Structure
```
src/core/
├── external-skill-loader.ts     # NEW: Skill search and fetching
├── proactive-discovery.ts       # NEW: Context-aware recommendations
└── skill-recommendation-engine.ts # NEW: Unified recommendation interface

docs/
└── PROACTIVE_DISCOVERY.md       # NEW: Comprehensive guide

examples/
└── proactive-discovery.ts       # NEW: 5 practical examples
```

### Module Dependencies
```
ExternalSkillLoader
  ├─ InMemoryCache (TTL-based)
  ├─ SkillsShSource (skills.sh API)
  ├─ GitHubClient (Tree API + raw content)
  └─ RelevanceRanker (multi-signal scoring)

ProactiveSkillDiscovery
  └─ ExternalSkillLoader

SkillRecommendationEngine
  ├─ ExternalSkillLoader
  └─ ProactiveSkillDiscovery
```

---

## 🚀 Performance

### Caching Strategy
- **Skill content**: 24 hour TTL (configurable)
- **GitHub branch detection**: Cached per repository
- **Search results**: Deduplicated within session

### Rate Limits
| GitHub Token | API Limit | Recommended For |
|--------------|-----------|-----------------|
| None | 60 req/hr | Manual usage |
| Personal | 5000 req/hr | CI/CD, automation |

### Optimizations
- Max 3 queries per pattern detection
- Lazy content fetching (`includeContent: false` by default)
- Automatic deduplication across sources
- Parallel search across multiple sources

---

## 🐛 Bug Fixes

None (new feature release).

---

## 📦 Dependencies

### Unchanged
All existing dependencies remain the same. No new external dependencies added.

### Built-in APIs Used
- `node:https` - Native HTTPS module (unused, replaced by fetch)
- `node:http` - Native HTTP module (unused, replaced by fetch)
- `fetch` - Node.js 18+ built-in (zero deps)

---

## 🔮 Future Roadmap

Planned for future releases:

- [ ] **Semantic search** - Embedding-based relevance matching
- [ ] **Usage analytics** - Track which external skills are most effective
- [ ] **Auto-loading** - Inject high-confidence skills into context automatically
- [ ] **Local registry** - Offline cache for frequently-used community skills
- [ ] **Skill fusion** - Merge local patterns with external skills
- [ ] **Well-known endpoint support** - RFC 8615 skill discovery
- [ ] **Registry source** - Local skill registry file support

---

## 🙏 Acknowledgments

This release was inspired by [Skyll](https://github.com/MaTriXy/skyll) and ports its core search service architecture to TypeScript for seamless integration with Auto-Skill's existing pattern detection system.

---

## 🔗 Links

- **Documentation:** [https://MaTriXy.github.io/auto-skill](https://MaTriXy.github.io/auto-skill)
- **Repository:** [https://github.com/MaTriXy/auto-skill](https://github.com/MaTriXy/auto-skill)
- **Skills.sh:** [https://skills.sh](https://skills.sh)
- **Skyll:** [https://github.com/MaTriXy/skyll](https://github.com/MaTriXy/skyll)

---

**Full Diff:** [v4.0.1...v5.0.0](https://github.com/MaTriXy/auto-skill/compare/v4.0.1...v5.0.0)
