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
      console.error('Setup failed:', error instanceof Error ? error.message : error);
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
      console.error('Config command failed:', error instanceof Error ? error.message : error);
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
  .action(async options => {
    try {
      const analyzeCommand = new AnalyzeCommand(options);
      await analyzeCommand.execute();
    } catch (error) {
      console.error('Analysis failed:', error instanceof Error ? error.message : error);
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
      console.error('Report generation failed:', error instanceof Error ? error.message : error);
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
      console.error('Quick analysis failed:', error instanceof Error ? error.message : error);
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
      console.error('Watch mode failed:', error instanceof Error ? error.message : error);
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
      console.error('Export failed:', error instanceof Error ? error.message : error);
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
      console.error('History command failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.on('command:*', () => {
  console.error(
    'Invalid command: %s\nSee --help for a list of available commands.',
    program.args.join(' ')
  );
  process.exit(1);
});

if (process.argv.length === 2) {
  render(React.createElement(App));
} else {
  program.parse();
}

export { program };
