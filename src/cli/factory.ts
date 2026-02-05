/**
 * CLI Factory - Creates the auto-skill CLI.
 *
 * Uses commander for argument parsing.
 * Factory pattern enables unit testing without side effects.
 */
import { Command } from "commander";

const VERSION = "4.0.1";

/**
 * Create and configure the auto-skill CLI program.
 * Returns a Commander instance that can be tested or executed.
 */
export function createCli(): Command {
  const program = new Command();

  program
    .name("auto-skill")
    .description("Auto-Skill - Automatically learn and generate skills")
    .version(VERSION);

  // init command
  program
    .command("init")
    .description("Initialize auto-skill")
    .option("--force", "Force recreate config")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const { initCommand } = await import("./commands/init");
      await initCommand(opts);
    });

  // discover command
  program
    .command("discover")
    .description("Discover skills for current project")
    .option("--project <path>", "Project path")
    .option("--no-mental", "Disable Mental integration")
    .option("--no-external", "Disable Skills.sh")
    .option("--limit <n>", "Limit results", "10")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const { discoverCommand } = await import("./commands/discover");
      await discoverCommand(opts);
    });

  // search command (DEPRECATED - use Skills CLI instead)
  program
    .command("search <query>")
    .description("[DEPRECATED] Search skills - use 'npx skills find' instead")
    .option("--limit <n>", "Limit results", "10")
    .option("--json", "Output as JSON")
    .action(async (query, opts) => {
      console.log("\n⚠️  DEPRECATED: 'auto-skill search' is deprecated.");
      console.log("Use Skills CLI for better search experience:\n");
      console.log(`  npx skills find ${query}\n`);
      console.log("Or for direct installation:");
      console.log(`  npx skills add owner/repo@skill-name\n`);

      console.log("(Running legacy search...)\n");
      const { searchCommand } = await import("./commands/discover");
      await searchCommand(query, opts);
    });

  // stats command
  program
    .command("stats")
    .description("Show adoption statistics")
    .option("--project <path>", "Project path")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const { statsCommand } = await import("./commands/discover");
      await statsCommand(opts);
    });

  // graduate command
  program
    .command("graduate [action]")
    .description("Manage skill graduation")
    .option("--max <n>", "Max skills to graduate", "5")
    .option("--json", "Output as JSON")
    .action(async (action = "detect", opts) => {
      const { graduateCommand } = await import("./commands/graduate");
      await graduateCommand(action, opts);
    });

  // agents command
  program
    .command("agents [action]")
    .description("Manage agent configurations")
    .option("--json", "Output as JSON")
    .action(async (action = "list", opts) => {
      const { agentsCommand } = await import("./commands/agents");
      await agentsCommand(action, opts);
    });

  // lock command
  program
    .command("lock [action]")
    .description("Manage skill lock file")
    .option("--json", "Output as JSON")
    .action(async (action = "status", opts) => {
      const { lockCommand } = await import("./commands/lock");
      await lockCommand(action, opts);
    });

  // telemetry command
  program
    .command("telemetry [action]")
    .description("View usage telemetry")
    .option("--skill <name>", "Filter to specific skill")
    .option("--limit <n>", "Limit events", "20")
    .option("--json", "Output as JSON")
    .action(async (action = "report", opts) => {
      const { telemetryCommand } = await import("./commands/telemetry");
      await telemetryCommand(action, opts);
    });

  return program;
}
