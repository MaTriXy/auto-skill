---
sidebar_position: 3
---

# Provider System

Auto-Skill uses a pluggable provider system for skill discovery. Providers implement the `SkillProvider` protocol and are orchestrated by the `ProviderManager`.

## Built-in Providers

### LocalProvider

Searches `~/.claude/skills/` for existing SKILL.md files. Parses YAML frontmatter to extract metadata.

### SkillsShProvider

Wraps the Skills.sh client to search 27,000+ community skills. Queries the [skills.sh](https://skills.sh) API for skill discovery, trending, and details.

### WellKnownProvider

Implements [RFC 8615](https://www.rfc-editor.org/rfc/rfc8615) discovery by fetching `/.well-known/agent-skills.json` from configured domains. Includes 15-minute response caching.

```bash
auto-skill discover --wellknown    # Include well-known discovery
```

## Custom Providers

Implement the `SkillProvider` protocol:

```typescript
import { SkillProvider, SkillSearchResult } from '../core/providers/base';

class MyProvider implements SkillProvider {
  get name(): string {
    return 'my-provider';
  }

  get sourceId(): string {
    return 'custom';
  }

  isAvailable(): boolean {
    return true;
  }

  search(query: string, limit = 10): SkillSearchResult[] {
    // Return matching skills
    return [];
  }

  getSkillDetails(skillId: string): Record<string, unknown> | null {
    // Return full skill metadata
    return null;
  }
}
```

Register with the `ProviderManager`:

```typescript
import { ProviderManager } from '../core/providers/manager';

const manager = new ProviderManager();
manager.register(new MyProvider());
const results = manager.searchAll('payment', 10);
```

Providers are queried in registration order (first = highest priority). Failed providers are skipped gracefully.
