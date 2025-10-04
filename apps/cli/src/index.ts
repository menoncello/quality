#!/usr/bin/env node

import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { version } from '../package.json';
import { SetupCommand } from './commands/setup';
import { ConfigCommand } from './commands/config';
import { AnalyzeCommand } from './commands/analyze';
import { ReportCommand } from './commands/report';
import { App } from './components/app';

const program = new Command();

program
  .name('dev-quality')
  .description('DevQuality CLI tool for code quality analysis and reporting')
  .version(version, '-v, --version', 'Display the version number')
  .helpOption('-h, --help', 'Display help for command')
  .allowUnknownOption(false)
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: command => command.name(),
  });

program.option('--verbose', 'Enable verbose output', false);
program.option('--quiet', 'Suppress all output except errors', false);
program.option('--json', 'Output results as JSON', false);
program.option('--config <path>', 'Path to configuration file', '.dev-quality.json');
program.option('--no-cache', 'Disable caching', false);

program
  .command('setup')
  .description('Initialize DevQuality for your project')
  .option('-f, --force', 'Force overwrite existing configuration', false)
  .option('-i, --interactive', 'Interactive setup mode', true)
  .action(async options => {
    try {
      const setupCommand = new SetupCommand(options);
      await setupCommand.execute();
    } catch (error) {
      process.stderr.write(`Setup failed: ${error instanceof Error ? error.message : error}\n`);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Manage DevQuality configuration')
  .option('-s, --show', 'Show current configuration', false)
  .option('-e, --edit', 'Edit configuration', false)
  .option('-r, --reset', 'Reset to default configuration', false)
  .action(async options => {
    try {
      const configCommand = new ConfigCommand(options);
      await configCommand.execute();
    } catch (error) {
      process.stderr.write(
        `Config command failed: ${error instanceof Error ? error.message : error}\n`
      );
      process.exit(1);
    }
  });

program
  .command('analyze')
  .alias('a')
  .description('Analyze code quality using configured tools')
  .option('-t, --tools <tools>', 'Comma-separated list of tools to run')
  .option('-o, --output <path>', 'Output file path for results')
  .option('-f, --format <format>', 'Output format (json, html, md)', 'json')
  .option('--fail-on-error', 'Exit with error code on analysis failures', false)
  .option('-d, --dashboard', 'Show interactive dashboard', false)
  .option('--no-dashboard', 'Disable interactive dashboard')
  .option('--export <format>', 'Export results to specified format (json, txt, csv, md, junit)')
  .option('--filter <filter>', 'Apply filter to results (e.g., severity:error)')
  .option('--sort-by <field>', 'Sort results by field (score, severity, file, tool)')
  .option('--max-items <number>', 'Maximum number of items to display')
  .option('--quick', 'Quick analysis with minimal output', false)
  .action(async options => {
    try {
      const analyzeCommand = new AnalyzeCommand(options);
      await analyzeCommand.execute();
    } catch (error) {
      process.stderr.write(`Analysis failed: ${error instanceof Error ? error.message : error}\n`);
      process.exit(1);
    }
  });

program
  .command('report')
  .alias('r')
  .description('Generate comprehensive quality reports')
  .option('-t, --type <type>', 'Report type (summary, detailed, comparison)', 'summary')
  .option('-o, --output <path>', 'Output file path for report')
  .option('-f, --format <format>', 'Report format (html, md, json)', 'html')
  .option('--include-history', 'Include historical data in report', false)
  .action(async options => {
    try {
      const reportCommand = new ReportCommand(options);
      await reportCommand.execute();
    } catch (error) {
      process.stderr.write(
        `Report generation failed: ${error instanceof Error ? error.message : error}\n`
      );
      process.exit(1);
    }
  });

program
  .command('quick')
  .alias('q')
  .description('Quick analysis with default settings')
  .action(async () => {
    try {
      const analyzeCommand = new AnalyzeCommand({ quick: true });
      await analyzeCommand.execute();
    } catch (error) {
      process.stderr.write(
        `Quick analysis failed: ${error instanceof Error ? error.message : error}\n`
      );
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .alias('d')
  .description('Launch interactive quality dashboard')
  .option('-i, --input <path>', 'Load analysis results from file')
  .option('-t, --tools <tools>', 'Comma-separated list of tools to run')
  .option('--filter <filter>', 'Apply filter to results (e.g., severity:error)')
  .option('--sort-by <field>', 'Sort results by field (score, severity, file, tool)')
  .option('--max-items <number>', 'Maximum number of items to display')
  .option('--auto-analyze', 'Automatically run analysis on startup', true)
  .action(async options => {
    try {
      const { DashboardCommand } = await import('./commands/dashboard');
      const dashboardCommand = new DashboardCommand(options);
      await dashboardCommand.execute();
    } catch (error) {
      process.stderr.write(`Dashboard failed: ${error instanceof Error ? error.message : error}\n`);
      process.exit(1);
    }
  });

program
  .command('watch')
  .alias('w')
  .description('Watch for changes and run analysis automatically')
  .option('-d, --debounce <ms>', 'Debounce time in milliseconds', '1000')
  .option('-i, --interval <ms>', 'Check interval in milliseconds', '5000')
  .action(async options => {
    try {
      const { render } = await import('ink');
      const { WatchComponent } = await import('./components/watch');
      render(React.createElement(WatchComponent, options));
    } catch (error) {
      process.stderr.write(
        `Watch mode failed: ${error instanceof Error ? error.message : error}\n`
      );
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export analysis results to various formats')
  .option('-i, --input <path>', 'Input file path (JSON results)')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Export format (csv, xml, pdf)', 'csv')
  .action(async options => {
    try {
      const { ExportCommand } = await import('./commands/export');
      const exportCommand = new ExportCommand(options);
      await exportCommand.execute();
    } catch (error) {
      process.stderr.write(`Export failed: ${error instanceof Error ? error.message : error}\n`);
      process.exit(1);
    }
  });

program
  .command('coverage')
  .alias('cov')
  .description('Analyze and visualize test coverage')
  .option('-o, --output <path>', 'Output file path for report')
  .option('-f, --format <format>', 'Report format (json, html, markdown, csv)', 'json')
  .option('-i, --interactive', 'Show interactive dashboard', false)
  .option('--exclude <patterns...>', 'Exclude patterns for coverage analysis')
  .option('--include <pattern>', 'Include pattern for coverage analysis')
  .option('--coverage-threshold <threshold>', 'Coverage threshold percentage', '80')
  .option('--critical-paths <paths...>', 'Critical path patterns')
  .option('--no-trends', 'Disable trend analysis')
  .option('--no-quality-score', 'Disable quality scoring')
  .option('--no-risk-assessment', 'Disable risk assessment')
  .action(async options => {
    try {
      const { CoverageCommand } = await import('./commands/coverage');
      const coverageCommand = new CoverageCommand();
      await coverageCommand.execute(options);
    } catch (error) {
      process.stderr.write(
        `Coverage analysis failed: ${error instanceof Error ? error.message : error}\n`
      );
      process.exit(1);
    }
  });

program
  .command('history')
  .description('View analysis history and trends')
  .option('-n, --limit <number>', 'Number of history entries to show', '10')
  .option('--plot', 'Show trend visualization', false)
  .action(async options => {
    try {
      const { HistoryCommand } = await import('./commands/history');
      const historyCommand = new HistoryCommand(options);
      await historyCommand.execute();
    } catch (error) {
      process.stderr.write(
        `History command failed: ${error instanceof Error ? error.message : error}\n`
      );
      process.exit(1);
    }
  });

program.on('command:*', () => {
  process.stderr.write(
    `Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.\n`
  );
  process.exit(1);
});

export { program };

// Export a function to start the interactive mode separately for tests
export function startInteractiveMode() {
  render(React.createElement(App));
}
