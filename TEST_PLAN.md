# v5.0.0 Test Plan

## Pre-Release Testing Checklist

### 1. Local Build & Unit Tests (5 min)
```bash
# Clean build
npm run clean
npm install
npm run build
npm test

# Verify build output
ls -la dist/
ls -la dist/core/
```

**Expected:**
- ✅ TypeScript compiles without errors
- ✅ All tests pass
- ✅ dist/ contains compiled JS + type definitions

---

### 2. CLI Local Testing (10 min)

```bash
# Link package locally
npm link

# Test CLI commands
auto-skill version
# Expected: 5.0.0

auto-skill init
# Expected: Creates config and directories

auto-skill discover
# Expected: Shows detected patterns and recommendations

auto-skill agents detect
# Expected: Lists detected coding agents
```

**Expected:**
- ✅ CLI commands execute without errors
- ✅ Version shows 5.0.0
- ✅ Search connects to skills.sh API

---

### 3. MCP Server Testing (10 min)

**Test stdio server:**
```bash
node dist/mcp/server.js
```

**Send test request (in another terminal):**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | node dist/mcp/server.js
```

**Expected output:**
```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"auto-skill","version":"5.0.0"}}}
```

**Test tools/list:**
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node dist/mcp/server.js
```

**Expected:**
- ✅ Server responds with version 5.0.0
- ✅ tools/list returns search_skills and discover_skills

**Test search_skills tool:**
```bash
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_skills","arguments":{"query":"react","limit":3}}}' | node dist/mcp/server.js
```

**Expected:**
- ✅ Returns actual search results (not "queued" stub)
- ✅ Results include skills from skills.sh

---

### 4. Skills Integration Testing (10 min)

```bash
# Install as skill via Skills CLI
cd /tmp
npx skills add MaTriXy/auto-skill

# Verify installation
ls -la ~/.claude/skills/auto-skill/
cat ~/.claude/skills/auto-skill/skills/SKILL.md
```

**Expected:**
- ✅ Skills installed to ~/.claude/skills/auto-skill/
- ✅ SKILL.md files present
- ✅ Skills show up in Claude Code

---

### 5. Examples Testing (10 min)

```bash
# Set GitHub token (optional but recommended)
export GITHUB_TOKEN=ghp_your_token_here

# Run examples
npx tsx examples/proactive-discovery.ts
```

**Expected:**
- ✅ Example 1: Search returns results
- ✅ Example 2: Content fetch succeeds
- ✅ Example 3: Recommendations generated
- ✅ Example 4: Unified recommendations work
- ✅ Example 5: Manual loading succeeds

---

### 6. Integration with Claude Code (15 min)

**Via Skills:**
1. Open Claude Code
2. Type `/auto-skill:skill-discovery`
3. Verify skill loads

**Via MCP:**
1. Add to Claude Code MCP config:
```json
{
  "mcpServers": {
    "auto-skill": {
      "command": "node",
      "args": ["/path/to/auto-skill/dist/mcp/server.js"]
    }
  }
}
```
2. Restart Claude Code
3. Test: "Search for react testing skills"

**Expected:**
- ✅ Skills load without errors
- ✅ MCP tools are available
- ✅ Search returns results

---

## Beta Release Testing (Post npm publish --tag next)

### 7. npm Installation Testing (5 min)

```bash
# Install from npm
npm install -g @matrixy/auto-skill@next

# Verify installation
which auto-skill
auto-skill version
# Expected: 5.0.0-beta.1

# Test discover
auto-skill discover
```

**Expected:**
- ✅ Package installs globally
- ✅ CLI works from any directory
- ✅ All commands functional

---

### 8. Package Integrity (5 min)

```bash
# Check what's in the published package
npm pack @matrixy/auto-skill@next
tar -tzf matrixy-auto-skill-5.0.0-beta.1.tgz | grep -E "(dist|skills|bin)"
```

**Expected files:**
- ✅ dist/ folder with compiled code
- ✅ bin/auto-skill.js
- ✅ skills/ folder with SKILL.md files (if included in "files")

---

## Known Gotchas to Test

1. **Node version requirement** (18+)
   ```bash
   node --version
   # Should be >= 18.0.0
   ```

2. **Native fetch API**
   - Test without polyfills
   - Verify HTTPS requests work

3. **GitHub rate limits**
   - Test without token (60 req/hr)
   - Test with token (5000 req/hr)

4. **Skill.md frontmatter parsing**
   - Verify YAML is valid
   - Check auto-generated flag

5. **MCP server async handling**
   - Tools should execute (not return stub)
   - Error handling works

---

## Success Criteria

Before merging to main and publishing v5.0.0:

- [ ] All unit tests pass
- [ ] CLI commands work locally
- [ ] MCP server responds correctly
- [ ] Search returns real results (not stub)
- [ ] Examples execute successfully
- [ ] Skills load in Claude Code
- [ ] Beta npm package installs and works
- [ ] Documentation is accurate

---

## Rollback Plan

If critical issues found after publish:

1. **Immediate:**
   ```bash
   npm deprecate @matrixy/auto-skill@5.0.0 "Critical bug - use 4.0.1"
   npm dist-tag add @matrixy/auto-skill@4.0.1 latest
   ```

2. **Fix & republish:**
   ```bash
   npm version 5.0.1
   # Fix issues
   npm publish
   ```

---

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Build & Unit Tests | ⬜ | |
| CLI Local Testing | ⬜ | |
| MCP Server | ⬜ | |
| Skills Integration | ⬜ | |
| Examples | ⬜ | |
| Claude Code Integration | ⬜ | |
| npm Beta Install | ⬜ | |
| Package Integrity | ⬜ | |

---

**Tester:** _____________________
**Date:** _____________________
**Environment:** Node v_____ / OS: _____
