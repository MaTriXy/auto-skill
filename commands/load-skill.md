---
name: load-skill
description: Load an auto-generated skill into the current session for immediate use
arguments:
  - name: skill-name
    description: "Name of the skill to load (partial match supported)"
    required: false
---

# Load Auto-Generated Skill

This command loads a previously generated skill into the current session, making it immediately active without requiring a restart.

## How It Works

Skills in Claude Code are normally discovered at session start. This command bypasses that limitation by:
1. Retrieving the skill content from the registry
2. Outputting it with clear delimiters that signal "these are active instructions"
3. Making the skill immediately available for the current conversation

## Usage

### List Available Skills
If no skill name is provided, list all available auto-generated skills:

```bash
auto-skill discover
```

Display the output to the user so they can choose which skill to load.

### Search for Community Skills
If the user wants to find community skills, use **Skills CLI**:

```bash
npx skills find <query>         # Interactive search
npx skills add owner/repo       # Install skill
```

### Load a Specific Skill
When a skill name is provided:

```bash
auto-skill load "<skill-name>"
```

**IMPORTANT**: The output from the `auto-skill load` command contains the skill instructions wrapped in clear delimiters (`======`). You should:
1. Display this output directly to the user
2. Treat the content between the delimiters as **active instructions** you should follow when relevant
3. Confirm to the user that the skill is now loaded

## Example Output

```
======================================================================
SKILL LOADED: grep-edit-workflow-a1b2c3
Confidence: 85%
Tokens: ~500
======================================================================

## Instructions

1. Search for the relevant patterns in the codebase
2. Read the relevant file(s) to understand the current state
3. Make the necessary edits to the file

======================================================================
END OF SKILL INSTRUCTIONS - FOLLOW WHEN RELEVANT
======================================================================
```

## Notes

- The skill registry is automatically updated when skills are created/deleted
- Use `--rebuild` flag if the registry seems out of date
- Skills loaded this way are session-scoped (they persist for the current conversation)
- Multiple skills can be loaded in the same session
