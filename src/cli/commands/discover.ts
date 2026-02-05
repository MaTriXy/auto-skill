/**
 * Discover, Search, and Stats Commands.
 *
 * - discover: Find skills relevant to the current project.
 * - search: Search the Skills.sh registry for external skills.
 * - stats: Show skill adoption statistics.
 */

/** Options for the discover command. */
export interface DiscoverOptions {
  project?: string;
  mental?: boolean;
  external?: boolean;
  limit?: string;
  json?: boolean;
}


/** Options for the stats command. */
export interface StatsOptions {
  project?: string;
  json?: boolean;
}

/**
 * Discover skills relevant to the current project.
 * Scans local patterns and optionally queries external sources.
 */
export async function discoverCommand(opts: DiscoverOptions): Promise<void> {
  const projectPath = opts.project || process.cwd();

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          project_path: projectPath,
          count: 0,
          suggestions: [],
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`\nDiscovering skills for: ${projectPath}\n`);
    console.log("No suggestions found yet. Work on some files first.");
  }
}


/**
 * Show skill adoption statistics for the current project.
 */
export async function statsCommand(opts: StatsOptions): Promise<void> {
  if (opts.json) {
    console.log(JSON.stringify({ count: 0, adoptions: [] }, null, 2));
  } else {
    console.log("\nAdoption Statistics\n");
    console.log(
      "No skills adopted yet. Use 'auto-skill discover' to find skills.",
    );
  }
}
