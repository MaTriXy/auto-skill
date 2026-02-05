/**
 * External Skill Loader - Port of Skyll's SkillSearchService to TypeScript.
 *
 * Provides runtime skill discovery and loading from external sources:
 * - skills.sh API (27,000+ community skills)
 * - GitHub skill registries
 * - .well-known endpoints (RFC 8615)
 *
 * Enables proactive skill recommendations based on context.
 */

import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Skill metadata from external sources. */
export interface ExternalSkill {
  id: string;
  title: string;
  description: string | null;
  source: string; // owner/repo
  installCount: number;
  relevanceScore: number;
  content: string | null; // Full SKILL.md content
  rawUrl: string | null;
  skillsShUrl: string | null;
  githubUrl: string | null;
  version?: string;
  allowedTools?: string[];
  tags?: string[];
  fetchError?: string;
}

/** Search response. */
export interface SkillSearchResponse {
  query: string;
  count: number;
  skills: ExternalSkill[];
}

/** Skill source provider interface. */
export interface SkillSource {
  name: string;
  enabled: boolean;
  search(query: string, limit: number): Promise<SkillSearchResult[]>;
}

/** Internal search result from a single source. */
export interface SkillSearchResult {
  id: string;
  name: string;
  description?: string;
  source: string; // owner/repo
  sourceRegistry: string; // "skills.sh" | "registry" | "wellknown"
  installs: number;
  uniqueKey: string; // For deduplication
}

/** Cache entry structure. */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** GitHub fetch result. */
interface GitHubFetchResult {
  success: boolean;
  content: string | null;
  rawUrl: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// In-Memory Cache
// ---------------------------------------------------------------------------

/**
 * Simple in-memory cache with TTL.
 */
class InMemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTtl: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(defaultTtl: number = 86400) {
    this.defaultTtl = defaultTtl;
  }

  start(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, 300000);
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const ttlMs = (ttl ?? this.defaultTtl) * 1000;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async stats(): Promise<{ size: number; hits: number; misses: number }> {
    return { size: this.cache.size, hits: 0, misses: 0 };
  }
}

// ---------------------------------------------------------------------------
// Skills.sh Source
// ---------------------------------------------------------------------------

/**
 * Skills.sh API source provider.
 */
class SkillsShSource implements SkillSource {
  name = "skills.sh";
  enabled = true;
  private baseUrl = "https://skills.sh";

  async search(query: string, limit: number): Promise<SkillSearchResult[]> {
    try {
      const url = new URL(`${this.baseUrl}/api/search`);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", String(limit));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "auto-skill/5.0.0",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        console.error(`[SkillsShSource] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json() as {
        results?: Array<{
          id: string;
          name: string;
          description?: string;
          owner: string;
          repo: string;
          install_count?: number;
        }>;
      };

      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        source: `${item.owner}/${item.repo}`,
        sourceRegistry: "skills.sh",
        installs: item.install_count ?? 0,
        uniqueKey: `${item.owner}/${item.repo}/${item.id}`,
      }));
    } catch (error) {
      console.error("[SkillsShSource] Search failed:", error);
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// GitHub Client
// ---------------------------------------------------------------------------

/**
 * GitHub API client for fetching SKILL.md content.
 */
class GitHubClient {
  private token: string | null;
  private branchCache = new Map<string, string>(); // repo -> default branch

  constructor(token?: string) {
    this.token = token ?? null;
  }

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github+json",
      "User-Agent": "auto-skill/5.0.0",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Detect the default branch for a repository.
   */
  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const cacheKey = `${owner}/${repo}`;
    if (this.branchCache.has(cacheKey)) {
      return this.branchCache.get(cacheKey)!;
    }

    try {
      const url = `https://api.github.com/repos/${owner}/${repo}`;
      const response = await fetch(url, {
        headers: this.headers,
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        // Fallback to 'main'
        return "main";
      }

      const data = await response.json() as { default_branch?: string };
      const branch = data.default_branch ?? "main";
      this.branchCache.set(cacheKey, branch);
      return branch;
    } catch {
      return "main";
    }
  }

  /**
   * Find SKILL.md path in repository tree.
   */
  private async findSkillPath(
    owner: string,
    repo: string,
    branch: string,
    skillId: string
  ): Promise<string | null> {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
      const response = await fetch(url, {
        headers: this.headers,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as {
        tree?: Array<{ path: string; type: string }>;
      };

      if (!data.tree) {
        return null;
      }

      // Search patterns: skills/{skillId}/SKILL.md, {skillId}/SKILL.md, SKILL.md
      const patterns = [
        `skills/${skillId}/SKILL.md`,
        `${skillId}/SKILL.md`,
        `SKILL.md`,
      ];

      for (const pattern of patterns) {
        const found = data.tree.find(
          (item) => item.type === "blob" && item.path === pattern
        );
        if (found) {
          return found.path;
        }
      }

      // Fallback: any SKILL.md containing skillId in path
      const fallback = data.tree.find(
        (item) =>
          item.type === "blob" &&
          item.path.includes(skillId) &&
          item.path.endsWith("SKILL.md")
      );

      return fallback?.path ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch skill content from GitHub.
   */
  async fetchSkill(source: string, skillId: string): Promise<GitHubFetchResult> {
    try {
      const [owner, repo] = source.split("/");
      if (!owner || !repo) {
        return {
          success: false,
          content: null,
          rawUrl: null,
          error: `Invalid source format: ${source}`,
        };
      }

      // 1. Get default branch
      const branch = await this.getDefaultBranch(owner, repo);

      // 2. Find SKILL.md path
      const skillPath = await this.findSkillPath(owner, repo, branch, skillId);
      if (!skillPath) {
        return {
          success: false,
          content: null,
          rawUrl: null,
          error: `SKILL.md not found for ${skillId}`,
        };
      }

      // 3. Fetch raw content
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${skillPath}`;
      const response = await fetch(rawUrl, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return {
          success: false,
          content: null,
          rawUrl,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const content = await response.text();

      return {
        success: true,
        content,
        rawUrl,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        content: null,
        rawUrl: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getSkillsShUrl(source: string, skillId: string): string {
    return `https://skills.sh/${source}/${skillId}`;
  }

  getGithubUrl(source: string, skillId: string): string {
    return `https://github.com/${source}/tree/main/skills/${skillId}`;
  }
}

// ---------------------------------------------------------------------------
// Relevance Ranker
// ---------------------------------------------------------------------------

/**
 * Ranks skills by relevance score.
 */
class RelevanceRanker {
  rank(skills: ExternalSkill[], query: string): ExternalSkill[] {
    // TODO: Implement multi-signal ranking
    // Signals: query match, install count, content relevance
    // For now, just sort by install count
    return skills.sort((a, b) => b.installCount - a.installCount);
  }
}

// ---------------------------------------------------------------------------
// Main Service
// ---------------------------------------------------------------------------

/**
 * External Skill Loader Service.
 *
 * Port of Skyll's SkillSearchService to TypeScript.
 */
export class ExternalSkillLoader {
  private cache: InMemoryCache;
  private sources: SkillSource[];
  private githubClient: GitHubClient;
  private ranker: RelevanceRanker;
  private cacheTtl: number;

  constructor(options?: { githubToken?: string; cacheTtl?: number }) {
    this.cacheTtl = options?.cacheTtl ?? 86400; // 24 hours
    this.cache = new InMemoryCache(this.cacheTtl);
    this.githubClient = new GitHubClient(options?.githubToken);
    this.ranker = new RelevanceRanker();
    this.sources = [new SkillsShSource()];
  }

  async start(): Promise<void> {
    this.cache.start();
  }

  async stop(): Promise<void> {
    this.cache.stop();
  }

  private cacheKey(source: string, skillId: string): string {
    return `skill:${source}:${skillId}`;
  }

  /**
   * Search for skills across all sources.
   */
  async search(
    query: string,
    options?: { limit?: number; includeContent?: boolean }
  ): Promise<SkillSearchResponse> {
    const limit = options?.limit ?? 10;
    const includeContent = options?.includeContent ?? false;

    // Search all sources in parallel
    const searchResults = await this.searchAllSources(query, limit);

    if (searchResults.length === 0) {
      return { query, count: 0, skills: [] };
    }

    // Build ExternalSkill objects
    const skills: ExternalSkill[] = [];
    for (const result of searchResults) {
      let content: string | null = null;
      let rawUrl: string | null = null;
      let fetchError: string | undefined;

      if (includeContent) {
        const cached = await this.cache.get<{ content: string; rawUrl: string }>(
          this.cacheKey(result.source, result.id)
        );

        if (cached) {
          content = cached.content;
          rawUrl = cached.rawUrl;
        } else {
          const fetchResult = await this.githubClient.fetchSkill(result.source, result.id);
          if (fetchResult.success) {
            content = fetchResult.content;
            rawUrl = fetchResult.rawUrl;
            await this.cache.set(
              this.cacheKey(result.source, result.id),
              { content, rawUrl },
              this.cacheTtl
            );
          } else {
            fetchError = fetchResult.error ?? undefined;
          }
        }
      }

      skills.push({
        id: result.id,
        title: result.name,
        description: result.description ?? null,
        source: result.source,
        installCount: result.installs,
        relevanceScore: result.installs,
        content,
        rawUrl,
        skillsShUrl: this.githubClient.getSkillsShUrl(result.source, result.id),
        githubUrl: this.githubClient.getGithubUrl(result.source, result.id),
        fetchError,
      });
    }

    // Rank by relevance
    const ranked = this.ranker.rank(skills, query);

    return { query, count: ranked.length, skills: ranked };
  }

  /**
   * Search all sources and deduplicate.
   */
  private async searchAllSources(query: string, limit: number): Promise<SkillSearchResult[]> {
    const allResults = await Promise.all(
      this.sources.filter((s) => s.enabled).map((s) => s.search(query, limit))
    );

    // Deduplicate by unique key
    const seen = new Map<string, SkillSearchResult>();
    for (const results of allResults) {
      for (const result of results) {
        const key = result.uniqueKey;
        if (!seen.has(key) || result.sourceRegistry === "skills.sh") {
          seen.set(key, result);
        }
      }
    }

    // Sort by install count
    const deduplicated = Array.from(seen.values());
    deduplicated.sort((a, b) => b.installs - a.installs);

    return deduplicated.slice(0, limit);
  }

  /**
   * Get cache statistics.
   */
  async getCacheStats(): Promise<{ size: number; hits: number; misses: number }> {
    return this.cache.stats();
  }
}

/**
 * Factory function to create the loader.
 */
export function createExternalSkillLoader(options?: {
  githubToken?: string;
  cacheTtl?: number;
}): ExternalSkillLoader {
  return new ExternalSkillLoader(options);
}
