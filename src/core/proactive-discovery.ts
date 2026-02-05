/**
 * Proactive Skill Discovery - Context-aware skill recommendations.
 *
 * This module analyzes the current workflow context and proactively
 * suggests relevant skills from external sources BEFORE the user asks.
 *
 * Triggers:
 * - Pattern detection (repetitive workflows)
 * - File context (detected frameworks, languages)
 * - Tool usage (specific tool sequences)
 * - User intent (debugging, testing, implementing)
 */

import type { DetectedPattern } from "../types";
import type { ExternalSkillLoader, ExternalSkill } from "./external-skill-loader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Context extracted from the current session. */
export interface WorkflowContext {
  /** Detected frameworks (react, nextjs, vue, etc.) */
  frameworks: string[];
  /** Detected languages (typescript, python, rust, etc.) */
  languages: string[];
  /** Tool sequence being used */
  tools: string[];
  /** User intent (debug, implement, test, refactor, etc.) */
  intent: string | null;
  /** File extensions being modified */
  fileExtensions: string[];
  /** Import/require statements detected */
  imports: string[];
}

/** Skill recommendation with reasoning. */
export interface SkillRecommendation {
  skill: ExternalSkill;
  reason: string;
  confidence: number; // 0-1
  trigger: "pattern" | "context" | "tool-sequence" | "framework";
}

// ---------------------------------------------------------------------------
// Context Extraction
// ---------------------------------------------------------------------------

/**
 * Extract workflow context from a detected pattern.
 */
function extractContext(pattern: DetectedPattern): WorkflowContext {
  const context: WorkflowContext = {
    frameworks: [],
    languages: [],
    tools: pattern.toolSequence,
    intent: null,
    fileExtensions: [],
    imports: [],
  };

  // Extract from session context
  if (pattern.sessionContext) {
    const ctx = pattern.sessionContext as Record<string, unknown>;

    if (ctx.primary_intent) {
      context.intent = String(ctx.primary_intent);
    }

    if (ctx.problem_domains && Array.isArray(ctx.problem_domains)) {
      // problem_domains might contain framework/language hints
      for (const domain of ctx.problem_domains) {
        const d = String(domain).toLowerCase();

        // Framework detection
        if (d.includes("react")) context.frameworks.push("react");
        if (d.includes("next")) context.frameworks.push("nextjs");
        if (d.includes("vue")) context.frameworks.push("vue");
        if (d.includes("svelte")) context.frameworks.push("svelte");
        if (d.includes("angular")) context.frameworks.push("angular");

        // Language detection
        if (d.includes("typescript")) context.languages.push("typescript");
        if (d.includes("javascript")) context.languages.push("javascript");
        if (d.includes("python")) context.languages.push("python");
        if (d.includes("rust")) context.languages.push("rust");
        if (d.includes("go")) context.languages.push("go");
      }
    }
  }

  // Extract from code context
  if (pattern.codeContext) {
    const ctx = pattern.codeContext as Record<string, unknown>;

    if (ctx.primary_languages && Array.isArray(ctx.primary_languages)) {
      context.languages.push(...ctx.primary_languages.map(String));
    }

    // File analysis could reveal more context
    if (ctx.analyzed_files) {
      // TODO: Parse file paths for extensions
    }
  }

  return context;
}

// ---------------------------------------------------------------------------
// Query Generation
// ---------------------------------------------------------------------------

/**
 * Generate search queries based on workflow context.
 */
function generateSearchQueries(context: WorkflowContext): string[] {
  const queries: string[] = [];

  // Framework + intent queries
  for (const framework of context.frameworks) {
    if (context.intent === "test") {
      queries.push(`${framework} testing`);
      queries.push(`${framework} test patterns`);
    } else if (context.intent === "debug") {
      queries.push(`${framework} debugging`);
    } else if (context.intent === "implement") {
      queries.push(`${framework} best practices`);
    }
  }

  // Tool-based queries
  if (context.tools.includes("Bash") && context.tools.includes("Grep")) {
    queries.push("code search patterns");
  }
  if (context.tools.includes("Task")) {
    queries.push("workflow automation");
  }

  // Generic intent queries
  if (context.intent === "test" && queries.length === 0) {
    queries.push("testing best practices");
    queries.push("test-driven development");
  }

  return queries.slice(0, 3); // Limit to top 3 queries
}

// ---------------------------------------------------------------------------
// Main Discovery Service
// ---------------------------------------------------------------------------

/**
 * Proactive Skill Discovery Service.
 */
export class ProactiveSkillDiscovery {
  private loader: ExternalSkillLoader;
  private recommendationCache = new Map<string, SkillRecommendation[]>();

  constructor(loader: ExternalSkillLoader) {
    this.loader = loader;
  }

  /**
   * Analyze a detected pattern and recommend relevant external skills.
   */
  async discoverForPattern(
    pattern: DetectedPattern
  ): Promise<SkillRecommendation[]> {
    const cacheKey = pattern.id;
    if (this.recommendationCache.has(cacheKey)) {
      return this.recommendationCache.get(cacheKey)!;
    }

    const context = extractContext(pattern);
    const queries = generateSearchQueries(context);

    if (queries.length === 0) {
      return [];
    }

    const recommendations: SkillRecommendation[] = [];

    // Search for each query
    for (const query of queries) {
      try {
        const response = await this.loader.search(query, {
          limit: 3,
          includeContent: false, // Don't fetch content yet
        });

        for (const skill of response.skills) {
          // Calculate confidence based on install count and relevance
          const confidence = Math.min(
            1.0,
            (skill.installCount / 1000) * 0.5 + (skill.relevanceScore / 100) * 0.5
          );

          recommendations.push({
            skill,
            reason: this.buildReason(query, context),
            confidence,
            trigger: this.determineTrigger(context),
          });
        }
      } catch (error) {
        console.error(`[ProactiveDiscovery] Query failed: ${query}`, error);
      }
    }

    // Deduplicate by skill ID
    const unique = new Map<string, SkillRecommendation>();
    for (const rec of recommendations) {
      const key = `${rec.skill.source}/${rec.skill.id}`;
      if (!unique.has(key) || unique.get(key)!.confidence < rec.confidence) {
        unique.set(key, rec);
      }
    }

    // Sort by confidence and take top 5
    const sorted = Array.from(unique.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    this.recommendationCache.set(cacheKey, sorted);
    return sorted;
  }

  /**
   * Build a human-readable reason for the recommendation.
   */
  private buildReason(query: string, context: WorkflowContext): string {
    if (context.frameworks.length > 0) {
      return `Detected ${context.frameworks[0]} usage with ${context.intent ?? "development"} intent`;
    }
    if (context.intent) {
      return `Detected ${context.intent} workflow`;
    }
    return `Matches query: ${query}`;
  }

  /**
   * Determine what triggered this recommendation.
   */
  private determineTrigger(context: WorkflowContext): SkillRecommendation["trigger"] {
    if (context.frameworks.length > 0) return "framework";
    if (context.tools.length > 2) return "tool-sequence";
    return "context";
  }

  /**
   * Clear recommendation cache.
   */
  clearCache(): void {
    this.recommendationCache.clear();
  }
}

/**
 * Factory function.
 */
export function createProactiveDiscovery(
  loader: ExternalSkillLoader
): ProactiveSkillDiscovery {
  return new ProactiveSkillDiscovery(loader);
}
