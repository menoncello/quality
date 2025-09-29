import { BaseCommand } from './base-command';
import { CommandOptions, ProjectConfiguration } from '@dev-quality/types';

export class HelpCommand extends BaseCommand {
  constructor(options: CommandOptions) {
    super(options);
  }
  async execute(): Promise<void> {
    const helpText = `
DevQuality CLI - Code Quality Analysis and Reporting Tool

USAGE:
  dev-quality [OPTIONS] <COMMAND>

COMMANDS:
  setup        Initialize DevQuality for your project
  config       Manage DevQuality configuration
  analyze (a)  Analyze code quality using configured tools
  report (r)   Generate comprehensive quality reports
  quick (q)    Quick analysis with default settings
  watch (w)    Watch for changes and run analysis automatically
  export       Export analysis results to various formats
  history      View analysis history and trends
  help         Show this help message

GLOBAL OPTIONS:
  -v, --version           Display the version number
  -h, --help              Display help for command
  --verbose               Enable verbose output
  --quiet                 Suppress all output except errors
  --json                  Output results as JSON
  --config <path>         Path to configuration file
  --no-cache              Disable caching

EXAMPLES:
  # Initialize a new project
  dev-quality setup

  # Run analysis with default settings
  dev-quality analyze

  # Run specific tools
  dev-quality analyze --tools typescript,eslint

  # Generate HTML report
  dev-quality report --format html --output report.html

  # Watch mode for continuous analysis
  dev-quality watch

  # Quick analysis
  dev-quality quick

CONFIGURATION:
  The CLI looks for configuration in the following order:
  1. --config <path> (command line option)
  2. .dev-quality.json (current directory)
  3. dev-quality.json (current directory)

  Use 'dev-quality config --show' to view current configuration.

SUPPORT:
  For more information, visit: https://github.com/your-org/dev-quality-cli
`;

    process.stdout.write(helpText);
  }

  protected override async loadConfig(): Promise<ProjectConfiguration> {
    throw new Error('Help command does not load configuration');
  }
}
