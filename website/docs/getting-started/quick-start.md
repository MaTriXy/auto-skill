---
sidebar_position: 2
---

# Quick Start

Once you've [installed](/docs/getting-started/installation) Auto-Skill and registered the hooks, here's what happens.

## 1. Work Normally

Use your coding agent as you always do. The observer hook silently records tool events (which tools were called, inputs, outcomes) into a local SQLite database.

Every tool call generates an event like:

```typescript
{
  toolName: "Read",
  toolInput: { file_path: "src/auth.ts" },
  success: true,
  sessionId: "abc123",
  projectPath: "/my-project"
}
```

## 2. Patterns Emerge

After a few sessions, the detector looks for repeated tool sequences. For example, if you consistently:

1. **Read** a file
2. **Edit** it
3. **Bash** to run tests
4. **Bash** to check output

...and this happens 3+ times across sessions, it becomes a pattern candidate.

## 3. Review Suggestions

Discover detected patterns:

```bash
auto-skill discover
```

Output:

```
Detected Patterns:
  1. read-edit-test-verify (confidence: 0.82, occurrences: 5)
  2. debug-read-grep-fix  (confidence: 0.74, occurrences: 3)
```

## 4. Generate Skills

Patterns above the confidence threshold (default: 0.7) can be turned into SKILL.md files. The generated skill includes:

- YAML frontmatter with metadata and confidence scores
- Step-by-step workflow description
- Session context (intent, workflow type)
- Design patterns detected in your code

## 5. Discover Community Skills

Auto-Skill can proactively suggest community skills from Skills.sh when it detects patterns. For manual searching, use **Skills CLI**:

```bash
npx skills find testing workflow    # Interactive search
npx skills add owner/repo@skill     # Install specific skill
```

External skills start at 50% confidence and graduate to local skills after proving themselves (5+ uses, 80% success rate).

## 6. Web Dashboard (Optional)

Launch the web UI to visualize patterns and manage skills:

```bash
auto-skill start:web
# or: npm run start:web
# Open http://localhost:8000
```

## What's Next

- [Configuration](/docs/getting-started/configuration) — Tune detection thresholds and enable features
- [How It Works](/docs/how-it-works/architecture) — Understand the pipeline architecture
- [Pattern Detection](/docs/how-it-works/pattern-detection) — Deep dive into how patterns are found
