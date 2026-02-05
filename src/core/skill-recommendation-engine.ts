/**
 * Skill Recommendation Engine - Unified interface for skill suggestions.
 *
 * Combines:
 * - Local auto-generated skills (from pattern-detector)
 * - External community skills (from skills.sh)
 * - Hybrid recommendations (when local patterns match external skills)
 *
 * This is the main entry point for the "proactive skill loading" feature.
 */

import type { DetectedPattern } from "../types";
import type { ExternalSkillLoader, ExternalSkill } from "./external-skill-loader";
import type {
  ProactiveSkillDiscovery,
  SkillRecommendation,
} from "./proactive-discovery";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Combined recommendation from local + external sources. */
export interface UnifiedRecommendation {
  /** Recommendation type. */
  type: "local" | "external" | "hybrid";

  /** External skill (if type is external or hybrid). */
  externalSkill?: ExternalSkill;

  /** Local pattern (if type is local or hybrid). */
  localPattern?: DetectedPattern;

  /** Why this skill is being recommended. */
  reason: string;

  /** Confidence score 0-1. */
  confidence: number;

  /** Suggested action for the user. */
  action: "load" | "generate" | "graduate";
}

// ---------------------------------------------------------------------------
// Main Engine
// ---------------------------------------------------------------------------

/**
 * Skill Recommendation Engine.
 *
 * Analyzes detected patterns and recommends skills from:
 * 1. External sources (skills.sh) - "Hey, the community has a skill for this!"
 * 2. Local generation - "I'll create a skill for your workflow"
 * 3. Hybrid - "Your pattern matches an external skill - let's graduate it!"
 */
export class SkillRecommendationEngine {
  private loader: ExternalSkillLoader;
  private discovery: ProactiveSkillDiscovery;
  private graduationThreshold: number;

  constructor(
    loader: ExternalSkillLoader,
    discovery: ProactiveSkillDiscovery,
    options?: { graduationThreshold?: number }
  ) {
    this.loader = loader;
    this.discovery = discovery;
    this.graduationThreshold = options?.graduationThreshold ?? 0.7;
  }

  /**
   * Generate unified recommendations for a detected pattern.
   *
   * This is called by the pattern detector after a pattern is identified.
   */
  async recommendForPattern(
    pattern: DetectedPattern
  ): Promise<UnifiedRecommendation[]> {
    const recommendations: UnifiedRecommendation[] = [];

    // 1. Check if external skills exist for this pattern
    const externalRecs = await this.discovery.discoverForPattern(pattern);

    // 2. If high-confidence external skills exist, recommend loading them
    for (const rec of externalRecs) {
      if (rec.confidence >= this.graduationThreshold) {
        // High confidence - suggest graduating local pattern to external skill
        recommendations.push({
          type: "hybrid",
          externalSkill: rec.skill,
          localPattern: pattern,
          reason: `Your workflow matches the community skill "${rec.skill.title}". Consider using it instead of generating a new skill.`,
          confidence: rec.confidence,
          action: "graduate",
        });
      } else {
        // Medium confidence - suggest as alternative
        recommendations.push({
          type: "external",
          externalSkill: rec.skill,
          reason: rec.reason,
          confidence: rec.confidence,
          action: "load",
        });
      }
    }

    // 3. If no high-confidence external skills, recommend generating local skill
    if (!recommendations.some((r) => r.type === "hybrid")) {
      recommendations.push({
        type: "local",
        localPattern: pattern,
        reason: "No community skill found for this pattern. Generate a custom skill.",
        confidence: pattern.confidence,
        action: "generate",
      });
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get external skill details (fetch content).
   */
  async loadExternalSkill(
    source: string,
    skillId: string
  ): Promise<ExternalSkill | null> {
    const response = await this.loader.search(skillId, {
      limit: 1,
      includeContent: true,
    });

    return response.skills.length > 0 ? response.skills[0] : null;
  }

  /**
   * Search for skills by query (for manual discovery).
   */
  async searchSkills(query: string, limit: number = 10): Promise<ExternalSkill[]> {
    const response = await this.loader.search(query, {
      limit,
      includeContent: false,
    });
    return response.skills;
  }
}

/**
 * Factory function.
 */
export function createSkillRecommendationEngine(
  loader: ExternalSkillLoader,
  discovery: ProactiveSkillDiscovery,
  options?: { graduationThreshold?: number }
): SkillRecommendationEngine {
  return new SkillRecommendationEngine(loader, discovery, options);
}
