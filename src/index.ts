/**
 * Auto-Skill — Automatically learn from workflows and turn them into skills.
 * @module auto-skill
 */

// Core modules
export { openDatabase } from "./core/db";
export { createEventStore } from "./core/event-store";
export { createSkillStore } from "./core/skill-store";
export { createLockFile } from "./core/lock-file";
export { createPatternDetector } from "./core/pattern-detector";
export { createSequenceMatcher } from "./core/sequence-matcher";
export { createSessionAnalyzer } from "./core/session-analyzer";
export { createDesignPatternDetector } from "./core/design-pattern-detector";
export { createSkillGenerator } from "./core/skill-generator";
export { createGraduationManager } from "./core/graduation-manager";
export { createAgentRegistry } from "./core/agent-registry";
export { createTelemetryCollector, isTelemetryDisabled, track } from "./core/telemetry";
export { createSkillTracker } from "./core/skill-tracker";
export { createMentalAnalyzer } from "./core/mental-analyzer";
export { createUnifiedSuggester } from "./core/unified-suggester";
export { createSkillsShClient } from "./core/skillssh-client";
export { createExternalSkillLoader } from "./core/external-skill-loader";
export { createProactiveDiscovery } from "./core/proactive-discovery";
export { createSkillRecommendationEngine } from "./core/skill-recommendation-engine";

// Providers
export {
  createProviderManager,
  createLocalProvider,
  createSkillsShProvider,
  createWellKnownProvider,
} from "./core/providers";

// Utilities
export { sanitizeName, isPathSafe } from "./core/path-security";
export { loadConfig, DEFAULT_CONFIG } from "./core/config";
export { validateSkillMd, extractFrontmatter } from "./core/spec-validator";
export { atomicWrite } from "./util/atomic-write";
export { ulid } from "./util/ulid";

// Formatter
export {
  formatTable,
  formatJson,
  formatConfidenceBar,
  formatMarkdown,
  formatSkills,
  formatOutput,
} from "./formatter";

// CLI
export { createCli } from "./cli";

// MCP
export { startMcpServer, createMcpHttpServer } from "./mcp";

// Web
export { createApp, startWebServer } from "./web";

// Types
export type {
  ToolEvent,
  DetectedPattern,
  SkillCandidate,
  GraduationCandidate,
  SkillSearchResult,
  ExternalSkill,
  SkillSuggestion,
  SkillAdoption,
  PublishStatus,
  SequenceMatch,
  SessionContext,
  ConversationTurn,
  ProblemSolvingPattern,
  DesignPattern,
  PatternContext,
  SpecViolation,
  AgentConfig,
  LockedSkill,
  Config,
  DetectionConfig,
  TelemetryEvent,
  EffectivenessReport,
} from "./types";

// New proactive discovery types
export type {
  ExternalSkill as CommunitySkill,
  SkillSearchResponse,
} from "./core/external-skill-loader";
export type {
  WorkflowContext,
  SkillRecommendation,
} from "./core/proactive-discovery";
export type {
  UnifiedRecommendation,
} from "./core/skill-recommendation-engine";
