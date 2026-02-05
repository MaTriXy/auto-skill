/**
 * Skill providers - pluggable skill discovery sources.
 *
 * Ported from Python core/providers/__init__.py.
 */

export { type SkillProvider, type SkillSearchResult } from "./base";
export { createProviderManager } from "./manager";
export { createLocalProvider } from "./local-provider";
export { createWellKnownProvider } from "./wellknown-provider";
