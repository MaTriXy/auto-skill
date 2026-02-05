---
sidebar_position: 1
---

# Proactive Skill Discovery

Auto-Skill v5.0 introduces **Proactive Skill Discovery** - a closed-loop learning system that not only generates skills from your workflows but also discovers relevant community skills from external sources.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Auto-Skill v5.0 (Hybrid)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐     ┌─────────────────────┐               │
│  │   Observer   │────▶│  Pattern Detector   │               │
│  │  (Hooks)     │     │  (Local Patterns)   │               │
│  └──────────────┘     └──────────┬──────────┘               │
│                                   │                          │
│                       ┌───────────▼──────────┐               │
│                       │  Context Analyzer    │               │
│                       │  (Intent Detection)  │               │
│                       └───────────┬──────────┘               │
│                                   │                          │
│         ┌─────────────────────────┼────────────┐             │
│         ▼                         ▼            ▼             │
│  ┌────────────┐          ┌──────────────┐  ┌──────────────┐ │
│  │   Skill    │          │   Proactive  │  │    Skill     │ │
│  │ Generator  │          │    Skill     │  │   Loader     │ │
│  │  (Local)   │          │  Discovery   │  │  (External)  │ │
│  └────────────┘          └──────┬───────┘  └──────┬───────┘ │
│                                 │                  │         │
│                       ┌─────────▼──────────────────▼──────┐  │
│                       │  Skill Recommendation Engine      │  │
│                       │  - Local generation               │  │
│                       │  - External discovery (skills.sh) │  │
│                       │  - Hybrid graduation              │  │
│                       └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. **External Skill Search**

Search 27,000+ community skills from [skills.sh](https://skills.sh):

```typescript
import { createExternalSkillLoader } from '@matrixy/auto-skill';

const loader = createExternalSkillLoader({
  githubToken: process.env.GITHUB_TOKEN, // Optional, increases rate limits
  cacheTtl: 86400, // 24 hours
});

await loader.start();

// Search for React testing skills
const response = await loader.search('react testing', {
  limit: 10,
  includeContent: true, // Fetch full SKILL.md content
});

console.log(response.skills);
// [
//   {
//     id: 'react-test-patterns',
//     title: 'React Test Patterns',
//     description: 'Best practices for testing React components',
//     source: 'vercel-labs/agent-skills',
//     installCount: 1250,
//     content: '# React Test Patterns\n\n...',
//     skillsShUrl: 'https://skills.sh/vercel-labs/agent-skills/react-test-patterns',
//     githubUrl: 'https://github.com/vercel-labs/agent-skills/tree/main/skills/react-test-patterns'
//   }
// ]

await loader.stop();
```

### 2. **Context-Aware Recommendations**

Automatically discover skills based on detected patterns:

```typescript
import { createProactiveDiscovery, createExternalSkillLoader } from '@matrixy/auto-skill';

const loader = createExternalSkillLoader();
const discovery = createProactiveDiscovery(loader);

await loader.start();

// Get recommendations for a detected pattern
const pattern = {
  id: 'abc123',
  toolSequence: ['Read', 'Grep', 'Edit'],
  sessionContext: {
    primary_intent: 'test',
    problem_domains: ['react', 'typescript'],
  },
  // ... other pattern fields
};

const recommendations = await discovery.discoverForPattern(pattern);

console.log(recommendations);
// [
//   {
//     skill: { id: 'react-test-patterns', ... },
//     reason: 'Detected react usage with test intent',
//     confidence: 0.85,
//     trigger: 'framework'
//   }
// ]

await loader.stop();
```

### 3. **Unified Recommendations**

Combine local pattern detection with external skill discovery:

```typescript
import {
  createExternalSkillLoader,
  createProactiveDiscovery,
  createSkillRecommendationEngine,
} from '@matrixy/auto-skill';

const loader = createExternalSkillLoader();
const discovery = createProactiveDiscovery(loader);
const engine = createSkillRecommendationEngine(loader, discovery);

await loader.start();

const recommendations = await engine.recommendForPattern(pattern);

console.log(recommendations);
// [
//   {
//     type: 'hybrid', // or 'local' or 'external'
//     externalSkill: { ... },
//     localPattern: { ... },
//     reason: 'Your workflow matches "React Test Patterns". Consider using it.',
//     confidence: 0.9,
//     action: 'graduate' // or 'load' or 'generate'
//   }
// ]

await loader.stop();
```

## MCP Server Integration

The MCP server exposes proactive discovery tools:

### `search_skills`

Search community skills by query:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search_skills",
    "arguments": {
      "query": "react performance",
      "limit": 5,
      "includeContent": true
    }
  }
}
```

### `discover_skills`

Proactively discover skills based on context:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "discover_skills",
    "arguments": {
      "frameworks": ["react", "nextjs"],
      "languages": ["typescript"],
      "intent": "test"
    }
  }
}
```

## How It Works

### 1. **Pattern Detection Triggers Discovery**

When Auto-Skill detects a repetitive workflow pattern, it:

1. Extracts context (frameworks, languages, intent)
2. Generates search queries (e.g., "react testing", "nextjs performance")
3. Searches skills.sh for matching community skills
4. Ranks results by confidence (install count + relevance)

### 2. **Context Extraction**

The system analyzes:

- **Session context**: `primary_intent`, `problem_domains`, `workflow_type`
- **Code context**: `primary_languages`, file paths, imports
- **Tool sequence**: `Read → Grep → Edit` patterns

### 3. **Query Generation**

Smart query generation based on context:

| Context | Generated Queries |
|---------|------------------|
| `frameworks: ['react'], intent: 'test'` | "react testing", "react test patterns" |
| `frameworks: ['nextjs'], intent: 'implement'` | "nextjs best practices" |
| `tools: ['Bash', 'Grep']` | "code search patterns" |

### 4. **Confidence Scoring**

```typescript
confidence = (installCount / 1000) * 0.5 + (relevanceScore / 100) * 0.5
```

- **Install count** (50% weight): More installs = more battle-tested
- **Relevance score** (50% weight): How well the query matches

### 5. **Recommendation Types**

| Type | When | Action |
|------|------|--------|
| **local** | No high-confidence external match | Generate custom skill |
| **external** | Medium-confidence match | Load community skill |
| **hybrid** | High-confidence match | Graduate local pattern to external skill |

## Use Cases

### Scenario 1: React Testing Workflow

**User behavior:**
1. Reads React component
2. Searches for test patterns with Grep
3. Edits test file
4. Runs tests with Bash

**Auto-Skill response:**
1. Detects pattern: `Read → Grep → Edit → Bash`
2. Extracts context: `frameworks: ['react'], intent: 'test'`
3. Searches skills.sh: "react testing"
4. Finds: `react-test-patterns` (1250 installs, 0.9 confidence)
5. Recommends: **Hybrid** - "Your workflow matches `react-test-patterns`. Use it instead?"

### Scenario 2: Custom Workflow

**User behavior:**
1. Uses unique tool sequence: `WebFetch → Edit → Bash → Task`
2. No framework detected

**Auto-Skill response:**
1. Detects pattern: `WebFetch → Edit → Bash → Task`
2. Searches skills.sh: "workflow automation"
3. No high-confidence matches found
4. Recommends: **Local** - "Generate custom skill for this workflow"

## Configuration

### Environment Variables

```bash
# Optional: GitHub token for higher rate limits (5000/hr vs 60/hr)
GITHUB_TOKEN=ghp_your_token_here

# Cache TTL (default: 86400 = 24 hours)
CACHE_TTL=3600
```

### Graduation Threshold

Control when to suggest "graduating" local patterns to external skills:

```typescript
const engine = createSkillRecommendationEngine(loader, discovery, {
  graduationThreshold: 0.7, // 0-1 (default: 0.7)
});
```

- **0.7**: Recommend graduation when confidence ≥ 70%
- **0.9**: Only graduate on very high confidence
- **0.5**: More aggressive graduation

## Performance

### Caching Strategy

- **Skill content**: Cached for 24 hours (configurable)
- **Search results**: Deduplicates within session
- **GitHub API**: Branch detection cached per repository

### Rate Limits

| Token | GitHub API | Recommendation |
|-------|-----------|----------------|
| None | 60 req/hr | Fine for manual use |
| Personal | 5000 req/hr | Recommended for CI/CD |

### Optimization

1. **Limit queries**: Max 3 queries per pattern
2. **Lazy content fetch**: `includeContent: false` by default
3. **Deduplication**: Same skill across multiple queries → single entry

## Future Enhancements

- [ ] **Semantic search**: Use embeddings for better relevance matching
- [ ] **Usage analytics**: Track which external skills are most effective
- [ ] **Auto-loading**: Automatically inject high-confidence skills into context
- [ ] **Local registry**: Cache frequently-used community skills offline
- [ ] **Skill fusion**: Merge local patterns with external skills

## Examples

See `examples/proactive-discovery.ts` for complete usage examples.

## API Reference

### `ExternalSkillLoader`

```typescript
class ExternalSkillLoader {
  constructor(options?: {
    githubToken?: string;
    cacheTtl?: number;
  });

  async start(): Promise<void>;
  async stop(): Promise<void>;
  async search(query: string, options?: {
    limit?: number;
    includeContent?: boolean;
  }): Promise<SkillSearchResponse>;
  async getCacheStats(): Promise<{
    size: number;
    hits: number;
    misses: number;
  }>;
}
```

### `ProactiveSkillDiscovery`

```typescript
class ProactiveSkillDiscovery {
  constructor(loader: ExternalSkillLoader);

  async discoverForPattern(
    pattern: DetectedPattern
  ): Promise<SkillRecommendation[]>;

  clearCache(): void;
}
```

### `SkillRecommendationEngine`

```typescript
class SkillRecommendationEngine {
  constructor(
    loader: ExternalSkillLoader,
    discovery: ProactiveSkillDiscovery,
    options?: { graduationThreshold?: number }
  );

  async recommendForPattern(
    pattern: DetectedPattern
  ): Promise<UnifiedRecommendation[]>;

  async loadExternalSkill(
    source: string,
    skillId: string
  ): Promise<ExternalSkill | null>;

  async searchSkills(
    query: string,
    limit?: number
  ): Promise<ExternalSkill[]>;
}
```

## Troubleshooting

### No results from skills.sh

1. Check internet connection
2. Verify skills.sh API is accessible: `curl https://skills.sh/api/search?q=react`
3. Try broader queries: "testing" instead of "react-testing-library"

### GitHub rate limit exceeded

1. Add `GITHUB_TOKEN` environment variable
2. Use `cacheTtl` to reduce API calls
3. Set `includeContent: false` when content isn't needed

### Low confidence recommendations

1. Adjust `graduationThreshold` to be more lenient
2. Improve context extraction by adding framework hints to session metadata
3. Use more specific queries in manual search

---

**Built with** ❤️ **by the Auto-Skill team**

For questions or feedback, open an issue on [GitHub](https://github.com/MaTriXy/auto-skill).
