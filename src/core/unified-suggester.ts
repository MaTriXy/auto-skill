/**
 * Unified Skill Suggester - Combines Mental, Skills.sh, and local patterns.
 *
 * This is the main discovery layer that integrates:
 * 1. Mental Model - Codebase semantic understanding
 * 2. Skills.sh - External community skills
 * 3. Auto-Skill V2 - Local pattern detection
 *
 * Provides ranked skill suggestions with confidence scores and context.
 *
 * Ported from Python core/unified_suggester.py.
 */

import type {
  SkillSuggestion,
  DetectedPattern,
  SkillAdoption,
} from "../types";
import type { SkillProvider } from "./providers/base";
import {
  createMentalAnalyzer,
  type MentalModel,
  type MentalCapability,
} from "./mental-analyzer";
import { createExternalSkillLoader } from "./external-skill-loader";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a skill name for deduplication (lowercase, hyphens and spaces to
 * underscores).
 */
function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[-\s]/g, "_");
}

/**
 * Build a Skills.sh search query from session context.
 */
function buildSearchQuery(
  sessionContext: Record<string, unknown>,
): string {
  const parts: string[] = [];

  if (typeof sessionContext.primary_intent === "string") {
    parts.push(sessionContext.primary_intent);
  }

  if (Array.isArray(sessionContext.problem_domains)) {
    const domains = sessionContext.problem_domains as string[];
    parts.push(...domains.slice(0, 2));
  }

  if (typeof sessionContext.workflow_type === "string") {
    const workflow = sessionContext.workflow_type;
    if (workflow !== "unknown" && workflow !== "general") {
      parts.push(workflow);
    }
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Stub skill tracker (inline, since skill-tracker.ts is not yet ported)
// ---------------------------------------------------------------------------

/**
 * Minimal in-memory skill tracker used until the full SkillTracker is ported.
 */
function createInMemoryTracker(): {
  recordUsage(
    skillId: string,
    skillName: string,
    source: string,
    success: boolean,
  ): void;
  getAdoption(skillId: string): SkillAdoption | null;
  shouldGraduate(skillId: string): boolean;
  markGraduated(skillId: string): void;
  getGraduationCandidates(): SkillAdoption[];
  getAllAdoptions(minConfidence?: number): SkillAdoption[];
} {
  const adoptions = new Map<string, SkillAdoption>();

  function calculateConfidence(
    initial: number,
    usageCount: number,
    successRate: number,
  ): number {
    const usageFactor = Math.min(usageCount / 10, 1);
    const weighted = successRate * 0.7 + usageFactor * 0.3;
    return Math.min(initial * 0.3 + weighted * 0.7, 0.95);
  }

  function initialConfidence(source: string): number {
    const map: Record<string, number> = {
      external: 0.5,
      "mental-hint": 0.6,
      local: 0.8,
    };
    return map[source] ?? 0.5;
  }

  return {
    recordUsage(
      skillId: string,
      skillName: string,
      source: string,
      success: boolean,
    ): void {
      const now = new Date().toISOString();
      const existing = adoptions.get(skillId);

      if (existing) {
        existing.usageCount += 1;
        if (success) {
          existing.successCount += 1;
        } else {
          existing.failureCount += 1;
        }
        const rate =
          existing.usageCount > 0
            ? existing.successCount / existing.usageCount
            : 0;
        existing.currentConfidence = calculateConfidence(
          existing.initialConfidence,
          existing.usageCount,
          rate,
        );
        existing.lastUsed = now;
      } else {
        const init = initialConfidence(source);
        adoptions.set(skillId, {
          skillId,
          skillName,
          source,
          initialConfidence: init,
          currentConfidence: init,
          usageCount: 1,
          successCount: success ? 1 : 0,
          failureCount: success ? 0 : 1,
          firstUsed: now,
          lastUsed: now,
          graduatedToLocal: false,
        });
      }
    },

    getAdoption(skillId: string): SkillAdoption | null {
      return adoptions.get(skillId) ?? null;
    },

    shouldGraduate(skillId: string): boolean {
      const a = adoptions.get(skillId);
      if (!a || a.graduatedToLocal) return false;
      if (a.source !== "external") return false;
      const rate = a.usageCount > 0 ? a.successCount / a.usageCount : 0;
      return a.currentConfidence >= 0.85 && a.usageCount >= 5 && rate >= 0.8;
    },

    markGraduated(skillId: string): void {
      const a = adoptions.get(skillId);
      if (a) {
        a.graduatedToLocal = true;
        a.source = "local";
        a.currentConfidence = 0.85;
      }
    },

    getGraduationCandidates(): SkillAdoption[] {
      const result: SkillAdoption[] = [];
      for (const [id, a] of adoptions) {
        if (
          !a.graduatedToLocal &&
          a.source === "external" &&
          a.currentConfidence >= 0.8
        ) {
          const rate = a.usageCount > 0 ? a.successCount / a.usageCount : 0;
          if (
            a.currentConfidence >= 0.85 &&
            a.usageCount >= 5 &&
            rate >= 0.8
          ) {
            result.push(a);
          }
        }
      }
      return result;
    },

    getAllAdoptions(minConfidence: number = 0): SkillAdoption[] {
      const result: SkillAdoption[] = [];
      for (const a of adoptions.values()) {
        if (a.currentConfidence >= minConfidence) {
          result.push(a);
        }
      }
      result.sort(
        (a, b) =>
          b.currentConfidence - a.currentConfidence ||
          b.usageCount - a.usageCount,
      );
      return result;
    },
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a unified skill suggester that combines all discovery sources.
 *
 * This is the main entry point for skill discovery. It:
 * 1. Queries the Mental model for codebase context
 * 2. Searches Skills.sh for external community skills
 * 3. Incorporates local pattern detection results
 * 4. Ranks and deduplicates suggestions
 * 5. Tracks adoption and confidence evolution
 *
 * @param options - Configuration options.
 * @param options.projectPath - Path to project (defaults to cwd).
 * @param options.enableMental - Enable Mental model integration (default true).
 * @param options.enableExternal - Enable Skills.sh integration (default true).
 * @param options.providers - Optional list of SkillProvider instances.
 * @returns Suggester object exposing suggestion and tracking methods.
 */
export function createUnifiedSuggester(options?: {
  projectPath?: string;
  enableMental?: boolean;
  enableExternal?: boolean;
  providers?: SkillProvider[];
}): {
  /**
   * Suggest skills based on current context.
   *
   * Combines suggestions from local patterns (highest confidence),
   * Mental model hints (medium confidence), and external skills
   * (variable confidence based on adoption).
   */
  suggestForContext(params: {
    detectedPatterns?: DetectedPattern[];
    sessionContext?: Record<string, unknown>;
    filePaths?: string[];
  }): Promise<SkillSuggestion[]>;

  /**
   * Suggest skills based on file paths using the Mental model.
   *
   * @param filePaths - List of file paths.
   * @param limit - Maximum number of suggestions (default 10).
   */
  suggestForFiles(filePaths: string[], limit?: number): SkillSuggestion[];

  /**
   * Suggest skills for a specific Mental domain.
   *
   * @param domainName - Name of domain (e.g., "Payment", "User").
   * @param limit - Maximum number of suggestions (default 10).
   */
  suggestForDomain(
    domainName: string,
    limit?: number,
  ): SkillSuggestion[];

  /**
   * Record that a skill was used.
   *
   * @param skillName - Name of skill.
   * @param skillSource - Source ("local", "external", "mental-hint").
   * @param success - Whether usage was successful.
   * @returns True if skill is ready to graduate, false otherwise.
   */
  recordSkillUsage(
    skillName: string,
    skillSource: string,
    success: boolean,
  ): boolean;

  /**
   * Get skills that are ready to graduate to local.
   */
  getGraduationCandidates(): SkillAdoption[];

  /**
   * Graduate an external skill to local.
   *
   * @param skillId - Skill identifier.
   */
  graduateSkill(skillId: string): void;

  /**
   * Get adoption statistics for all tracked skills.
   *
   * @param minConfidence - Minimum confidence threshold (default 0).
   */
  getAdoptionStats(minConfidence?: number): SkillAdoption[];
} {
  const projectPath = options?.projectPath ?? process.cwd();
  const enableMental = options?.enableMental ?? true;
  const enableExternal = options?.enableExternal ?? true;

  // Initialize analyzers
  const mental = enableMental ? createMentalAnalyzer(projectPath) : null;
  // NOTE: External skills now handled by external-skill-loader.ts (v5.0)
  const skillsClient = null; // Deprecated: use createExternalSkillLoader instead
  const tracker = createInMemoryTracker();

  // Provider-based discovery
  const providers: SkillProvider[] = options?.providers
    ? [...options.providers]
    : [];
  // NOTE: Skills.sh provider removed in v5.0 (use external-skill-loader instead)

  // Cache for Mental model (loaded once)
  let mentalModel: MentalModel | null = null;

  /**
   * Get or load the Mental model (cached).
   */
  function getMentalModel(): MentalModel | null {
    if (!mental) return null;
    if (mentalModel === null) {
      mentalModel = mental.loadModel();
    }
    return mentalModel;
  }

  /**
   * Create suggestions from locally detected patterns.
   */
  function suggestFromLocal(
    detectedPatterns: DetectedPattern[],
  ): SkillSuggestion[] {
    const suggestions: SkillSuggestion[] = [];

    for (const pattern of detectedPatterns) {
      if (pattern.confidence >= 0.7) {
        suggestions.push({
          name: pattern.suggestedName,
          description: pattern.suggestedDescription,
          source: "local",
          confidence: pattern.confidence,
          tags: [],
          patternMatch: {
            toolSequence: pattern.toolSequence,
            occurrences: pattern.occurrenceCount,
            successRate: pattern.successRate,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Create suggestions from Mental model.
   */
  function suggestFromMental(
    filePaths: string[],
    _sessionContext?: Record<string, unknown>,
  ): SkillSuggestion[] {
    if (!mental) return [];

    const mm = getMentalModel();
    if (!mm) return [];

    const relevantDomains = mental.getRelevantDomains(filePaths);
    if (relevantDomains.length === 0) return [];

    const capabilities = mental.getCapabilitiesForDomains(relevantDomains);
    const suggestions: SkillSuggestion[] = [];

    for (const capability of capabilities) {
      const skillHints = mental.suggestSkillsForCapability(capability);

      for (const hint of skillHints) {
        suggestions.push({
          name: hint.name,
          description: `Skill for ${capability.name}: ${capability.description}`,
          source: "mental-hint",
          confidence: hint.confidence,
          tags: [],
          mentalContext: {
            domains: relevantDomains.map((d) => d.name),
            capability: capability.name,
            operatesOn: capability.operatesOn,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Create suggestions from Skills.sh based on context.
   *
   * NOTE: Deprecated in v5.0 - External skills now handled by external-skill-loader.ts
   * This function remains for backward compatibility but always returns empty.
   */
  async function suggestFromExternal(
    _sessionContext: Record<string, unknown>,
  ): Promise<SkillSuggestion[]> {
    // Deprecated: Use createExternalSkillLoader() from external-skill-loader.ts instead
    return [];
  }

  /**
   * Remove duplicate suggestions, keeping the highest confidence version.
   */
  function deduplicate(
    suggestions: SkillSuggestion[],
  ): SkillSuggestion[] {
    const seen = new Map<string, SkillSuggestion>();

    for (const suggestion of suggestions) {
      const key = normalizeKey(suggestion.name);
      const existing = seen.get(key);
      if (!existing || suggestion.confidence > existing.confidence) {
        seen.set(key, suggestion);
      }
    }

    return Array.from(seen.values());
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    async suggestForContext(params: {
      detectedPatterns?: DetectedPattern[];
      sessionContext?: Record<string, unknown>;
      filePaths?: string[];
    }): Promise<SkillSuggestion[]> {
      const suggestions: SkillSuggestion[] = [];

      // 1. Local patterns (highest confidence)
      if (params.detectedPatterns) {
        suggestions.push(...suggestFromLocal(params.detectedPatterns));
      }

      // 2. Mental-based suggestions
      if (mental && (params.filePaths || params.sessionContext)) {
        const mentalSuggestions = suggestFromMental(
          params.filePaths ?? [],
          params.sessionContext,
        );
        suggestions.push(...mentalSuggestions);
      }

      // 3. External skills (deprecated in v5.0)
      // NOTE: External skills now handled by external-skill-loader.ts
      // Use createExternalSkillLoader() + createProactiveDiscovery() instead

      // Deduplicate and sort by confidence
      const unique = deduplicate(suggestions);
      unique.sort((a, b) => b.confidence - a.confidence);

      return unique;
    },

    suggestForFiles(
      filePaths: string[],
      limit: number = 10,
    ): SkillSuggestion[] {
      if (!mental) return [];

      const suggestions = suggestFromMental(filePaths);
      suggestions.sort((a, b) => b.confidence - a.confidence);
      return suggestions.slice(0, limit);
    },

    suggestForDomain(
      domainName: string,
      limit: number = 10,
    ): SkillSuggestion[] {
      if (!mental) return [];

      const mm = getMentalModel();
      if (!mm) return [];

      // Find domain
      const domain = mm.domains.find(
        (d) => d.name.toLowerCase() === domainName.toLowerCase(),
      );
      if (!domain) return [];

      // Get capabilities for this domain
      const capabilities = mental.getCapabilitiesForDomains([domain]);

      const suggestions: SkillSuggestion[] = [];
      for (const capability of capabilities) {
        const skillHints = mental.suggestSkillsForCapability(capability);
        for (const hint of skillHints) {
          suggestions.push({
            name: hint.name,
            description: `Skill for ${capability.name}: ${capability.description}`,
            source: "mental-hint",
            confidence: hint.confidence,
            tags: [],
            mentalContext: {
              domain: domain.name,
              capability: capability.name,
            },
          });
        }
      }

      suggestions.sort((a, b) => b.confidence - a.confidence);
      return suggestions.slice(0, limit);
    },

    recordSkillUsage(
      skillName: string,
      skillSource: string,
      success: boolean,
    ): boolean {
      const skillId = skillName
        .toLowerCase()
        .replace(/\s/g, "-")
        .replace(/_/g, "-");

      tracker.recordUsage(skillId, skillName, skillSource, success);

      if (
        skillSource === "external" &&
        tracker.shouldGraduate(skillId)
      ) {
        return true;
      }

      return false;
    },

    getGraduationCandidates(): SkillAdoption[] {
      return tracker.getGraduationCandidates();
    },

    graduateSkill(skillId: string): void {
      tracker.markGraduated(skillId);
    },

    getAdoptionStats(minConfidence: number = 0): SkillAdoption[] {
      return tracker.getAllAdoptions(minConfidence);
    },
  };
}
