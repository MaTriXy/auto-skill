/**
 * Proactive Skill Discovery - Example Usage
 *
 * This example demonstrates how to use Auto-Skill's proactive discovery
 * features to search for community skills and get context-aware recommendations.
 */

import {
  createExternalSkillLoader,
  createProactiveDiscovery,
  createSkillRecommendationEngine,
  type DetectedPattern,
} from "../src/index";

// ---------------------------------------------------------------------------
// Example 1: Basic Search
// ---------------------------------------------------------------------------

async function example1_basicSearch() {
  console.log("\n=== Example 1: Basic Search ===\n");

  const loader = createExternalSkillLoader({
    githubToken: process.env.GITHUB_TOKEN, // Optional
  });

  await loader.start();

  try {
    // Search for React testing skills
    const response = await loader.search("react testing", {
      limit: 5,
      includeContent: false, // Don't fetch full content for listing
    });

    console.log(`Found ${response.count} skills for "${response.query}":\n`);

    for (const skill of response.skills) {
      console.log(`📦 ${skill.title}`);
      console.log(`   ID: ${skill.id}`);
      console.log(`   Source: ${skill.source}`);
      console.log(`   Installs: ${skill.installCount}`);
      console.log(`   URL: ${skill.skillsShUrl}`);
      if (skill.description) {
        console.log(`   Description: ${skill.description}`);
      }
      console.log();
    }

    // Get cache stats
    const stats = await loader.getCacheStats();
    console.log(`Cache: ${stats.size} entries`);
  } finally {
    await loader.stop();
  }
}

// ---------------------------------------------------------------------------
// Example 2: Fetch Full Skill Content
// ---------------------------------------------------------------------------

async function example2_fetchContent() {
  console.log("\n=== Example 2: Fetch Full Skill Content ===\n");

  const loader = createExternalSkillLoader();
  await loader.start();

  try {
    const response = await loader.search("nextjs", {
      limit: 1,
      includeContent: true, // Fetch full SKILL.md content
    });

    if (response.skills.length > 0) {
      const skill = response.skills[0];
      console.log(`📦 ${skill.title}\n`);
      console.log("Full SKILL.md content:");
      console.log("─".repeat(60));
      console.log(skill.content?.slice(0, 500) + "..."); // First 500 chars
      console.log("─".repeat(60));
      console.log(`\nRaw URL: ${skill.rawUrl}`);
    } else {
      console.log("No skills found");
    }
  } finally {
    await loader.stop();
  }
}

// ---------------------------------------------------------------------------
// Example 3: Context-Aware Discovery
// ---------------------------------------------------------------------------

async function example3_contextAwareDiscovery() {
  console.log("\n=== Example 3: Context-Aware Discovery ===\n");

  // Simulate a detected pattern
  const pattern: DetectedPattern = {
    id: "pattern-abc123",
    toolSequence: ["Read", "Grep", "Edit", "Bash"],
    occurrenceCount: 5,
    confidence: 0.85,
    sessionIds: ["session-1", "session-2"],
    firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    lastSeen: new Date().toISOString(),
    successRate: 0.9,
    suggestedName: "react-test-workflow",
    suggestedDescription: "Workflow for testing React components",

    // Context hints
    sessionContext: {
      primary_intent: "test",
      problem_domains: ["react", "typescript"],
      workflow_type: "TDD",
      tool_success_rate: 0.9,
    },

    codeContext: {
      primary_languages: ["typescript"],
      analyzed_files: 10,
    },

    designPatterns: [],
    problemSolvingApproach: null,
    mentalContext: null,
  };

  const loader = createExternalSkillLoader();
  const discovery = createProactiveDiscovery(loader);

  await loader.start();

  try {
    const recommendations = await discovery.discoverForPattern(pattern);

    console.log(`Found ${recommendations.length} recommendations:\n`);

    for (const rec of recommendations) {
      console.log(`🎯 ${rec.skill.title}`);
      console.log(`   Confidence: ${Math.round(rec.confidence * 100)}%`);
      console.log(`   Reason: ${rec.reason}`);
      console.log(`   Trigger: ${rec.trigger}`);
      console.log(`   Installs: ${rec.skill.installCount}`);
      console.log(`   URL: ${rec.skill.skillsShUrl}`);
      console.log();
    }
  } finally {
    await loader.stop();
  }
}

// ---------------------------------------------------------------------------
// Example 4: Unified Recommendations (Hybrid System)
// ---------------------------------------------------------------------------

async function example4_unifiedRecommendations() {
  console.log("\n=== Example 4: Unified Recommendations ===\n");

  const pattern: DetectedPattern = {
    id: "pattern-xyz789",
    toolSequence: ["Read", "Edit", "Bash"],
    occurrenceCount: 3,
    confidence: 0.75,
    sessionIds: ["session-3"],
    firstSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeen: new Date().toISOString(),
    successRate: 1.0,
    suggestedName: "nextjs-deployment",
    suggestedDescription: "Deploy Next.js app",

    sessionContext: {
      primary_intent: "implement",
      problem_domains: ["nextjs", "vercel"],
      workflow_type: "deployment",
      tool_success_rate: 1.0,
    },

    codeContext: {
      primary_languages: ["typescript"],
      analyzed_files: 5,
    },

    designPatterns: [],
    problemSolvingApproach: null,
    mentalContext: null,
  };

  const loader = createExternalSkillLoader();
  const discovery = createProactiveDiscovery(loader);
  const engine = createSkillRecommendationEngine(loader, discovery, {
    graduationThreshold: 0.7, // Recommend graduation at 70% confidence
  });

  await loader.start();

  try {
    const recommendations = await engine.recommendForPattern(pattern);

    console.log(`Found ${recommendations.length} unified recommendations:\n`);

    for (const rec of recommendations) {
      console.log(`📋 Type: ${rec.type.toUpperCase()}`);
      console.log(`   Action: ${rec.action}`);
      console.log(`   Confidence: ${Math.round(rec.confidence * 100)}%`);
      console.log(`   Reason: ${rec.reason}`);

      if (rec.externalSkill) {
        console.log(`   External Skill: ${rec.externalSkill.title}`);
        console.log(`   URL: ${rec.externalSkill.skillsShUrl}`);
      }

      if (rec.localPattern) {
        console.log(`   Local Pattern: ${rec.localPattern.suggestedName}`);
      }

      console.log();
    }
  } finally {
    await loader.stop();
  }
}

// ---------------------------------------------------------------------------
// Example 5: Manual Skill Loading
// ---------------------------------------------------------------------------

async function example5_manualLoading() {
  console.log("\n=== Example 5: Manual Skill Loading ===\n");

  const loader = createExternalSkillLoader();
  const discovery = createProactiveDiscovery(loader);
  const engine = createSkillRecommendationEngine(loader, discovery);

  await loader.start();

  try {
    // Search for a specific skill
    const skills = await engine.searchSkills("vercel deployment", 5);

    console.log(`Found ${skills.length} skills:\n`);

    if (skills.length > 0) {
      // Load the first skill with full content
      const firstSkill = skills[0];
      console.log(`Loading: ${firstSkill.title}...`);

      const fullSkill = await engine.loadExternalSkill(
        firstSkill.source,
        firstSkill.id
      );

      if (fullSkill?.content) {
        console.log("\n✅ Skill loaded successfully!");
        console.log(`Content length: ${fullSkill.content.length} chars`);
        console.log("\nPreview:");
        console.log("─".repeat(60));
        console.log(fullSkill.content.slice(0, 300) + "...");
        console.log("─".repeat(60));
      } else {
        console.log("\n❌ Failed to load skill content");
      }
    }
  } finally {
    await loader.stop();
  }
}

// ---------------------------------------------------------------------------
// Run Examples
// ---------------------------------------------------------------------------

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  Auto-Skill Proactive Discovery - Examples       ║");
  console.log("╚═══════════════════════════════════════════════════╝");

  // Run all examples
  await example1_basicSearch();
  await example2_fetchContent();
  await example3_contextAwareDiscovery();
  await example4_unifiedRecommendations();
  await example5_manualLoading();

  console.log("\n✅ All examples completed!\n");
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
}

export {
  example1_basicSearch,
  example2_fetchContent,
  example3_contextAwareDiscovery,
  example4_unifiedRecommendations,
  example5_manualLoading,
};
