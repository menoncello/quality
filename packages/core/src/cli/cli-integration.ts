import type { Logger } from '../plugins/analysis-plugin.js';
import type { AnalysisEngine, AnalysisProgress } from '../analysis/analysis-engine.js';
import type { ReportConfig } from '../analysis/result-reporter.js';
import { ReportFormat } from '../analysis/result-reporter.js';
import type { ProjectConfiguration } from '../plugins/analysis-plugin.js';

/**
 * CLI command options
 */
export interface CLICommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  timeout?: number;
  concurrency?: number;
  config?: string;
  output?: string;
  format?: string;
  include?: string[];
  exclude?: string[];
  plugins?: string[];
  incremental?: boolean;
  watch?: boolean;
  fix?: boolean;
  dryRun?: boolean;
}

/**
 * CLI output format
 */
export enum CLIOutputFormat {
  TEXT = 'text',
  JSON = 'json',
  COMPACT = 'compact',
  VERBOSE = 'verbose'
}

/**
 * CLI configuration
 */
export interface CLIConfiguration {
  defaultOutputFormat: CLIOutputFormat;
  showProgress: boolean;
  showColors: boolean;
  showIcons: boolean;
  maxWidth: number;
  indent: string;
  spinner: string;
  progressBar: {
    width: number;
    completeChar: string;
    incompleteChar: string;
  };
}

/**
 * Progress indicator
 */
export interface ProgressIndicator {
  start(message: string): void;
  update(current: number, total: number, message?: string): void;
  complete(message?: string): void;
  error(message: string): void;
}

/**
 * CLI output formatter
 */
export class CLIOutputFormatter {
  private config: CLIConfiguration;
  private logger: Logger;
  private useColors: boolean;

  constructor(config: CLIConfiguration, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.useColors = config.showColors && this.supportsColor();
  }

  /**
   * Format success message
   */
  success(message: string): string {
    const icon = this.config.showIcons ? '✓ ' : '';
    const color = this.useColors ? '\x1b[32m' : '';
    const reset = this.useColors ? '\x1b[0m' : '';
    return `${color}${icon}${message}${reset}`;
  }

  /**
   * Format error message
   */
  error(message: string): string {
    const icon = this.config.showIcons ? '✗ ' : '';
    const color = this.useColors ? '\x1b[31m' : '';
    const reset = this.useColors ? '\x1b[0m' : '';
    return `${color}${icon}${message}${reset}`;
  }

  /**
   * Format warning message
   */
  warning(message: string): string {
    const icon = this.config.showIcons ? '⚠ ' : '';
    const color = this.useColors ? '\x1b[33m' : '';
    const reset = this.useColors ? '\x1b[0m' : '';
    return `${color}${icon}${message}${reset}`;
  }

  /**
   * Format info message
   */
  info(message: string): string {
    const icon = this.config.showIcons ? 'ℹ ' : '';
    const color = this.useColors ? '\x1b[36m' : '';
    const reset = this.useColors ? '\x1b[0m' : '';
    return `${color}${icon}${message}${reset}`;
  }

  /**
   * Format header
   */
  header(text: string): string {
    const line = '='.repeat(Math.max(text.length + 4, this.config.maxWidth));
    return `${line}\n  ${text}\n${line}`;
  }

  /**
   * Format section header
   */
  section(text: string): string {
    return `\n${text}\n${'-'.repeat(text.length)}`;
  }

  /**
   * Format key-value pair
   */
  keyValue(key: string, value: string): string {
    const padding = ' '.repeat(Math.max(1, 30 - key.length));
    return `${key}:${padding}${value}`;
  }

  /**
   * Format list item
   */
  listItem(text: string, level: number = 0): string {
    const indent = this.config.indent.repeat(level);
    const bullet = this.config.showIcons ? '• ' : '- ';
    return `${indent}${bullet}${text}`;
  }

  /**
   * Format table row
   */
  tableRow(cells: string[], widths: number[]): string {
    return cells.map((cell, index) => {
      const width = widths[index] || 20;
      const padding = width - cell.length;
      return cell + ' '.repeat(Math.max(0, padding));
    }).join(' | ');
  }

  /**
   * Format issue
   */
  issue(severity: string, file: string, line: number, message: string): string {
    const severityColor = this.getSeverityColor(severity);
    const reset = this.useColors ? '\x1b[0m' : '';
    const icon = this.config.showIcons ? this.getSeverityIcon(severity) : '';

    return `${icon}${severityColor}${severity.toUpperCase()}${reset} ${file}:${line} - ${message}`;
  }

  /**
   * Format duration
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${(ms / 60000).toFixed(1)}m`;
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Private methods

  /**
   * Check if terminal supports color
   */
  private supportsColor(): boolean {
    const process = require('process');
    return Boolean(
      process.stdout &&
      process.stdout.isTTY &&
      process.env.TERM !== 'dumb' &&
      (!('CI' in process.env) || process.env.CI === 'false')
    );
  }

  /**
   * Get color for severity
   */
  private getSeverityColor(severity: string): string {
    if (!this.useColors) return '';

    switch (severity.toLowerCase()) {
      case 'error': return '\x1b[31m';
      case 'warning': return '\x1b[33m';
      case 'info': return '\x1b[36m';
      default: return '\x1b[37m';
    }
  }

  /**
   * Get icon for severity
   */
  private getSeverityIcon(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'error': return '❌ ';
      case 'warning': return '⚠️ ';
      case 'info': return 'ℹ️ ';
      default: return '• ';
    }
  }
}

/**
 * CLI progress indicator
 */
export class CLIProgressIndicator implements ProgressIndicator {
  private formatter: CLIOutputFormatter;
  private currentProgress = 0;
  private total = 0;
  private currentMessage = '';
  private startTime = 0;
  private isActive = false;
  private interval: NodeJS.Timeout | null = null;

  constructor(formatter: CLIOutputFormatter) {
    this.formatter = formatter;
  }

  /**
   * Start progress indicator
   */
  start(message: string): void {
    this.currentMessage = message;
    this.startTime = Date.now();
    this.isActive = true;
    this.currentProgress = 0;
    this.total = 0;

    process.stdout.write(`${message}... `);

    // Start progress updates
    this.interval = setInterval(() => {
      this.updateProgress();
    }, 100);
  }

  /**
   * Update progress
   */
  update(current: number, total: number, message?: string): void {
    if (!this.isActive) return;

    this.currentProgress = current;
    this.total = total;
    if (message) {
      this.currentMessage = message;
    }

    this.updateProgress();
  }

  /**
   * Complete progress indicator
   */
  complete(message?: string): void {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    const duration = Date.now() - this.startTime;
    const durationText = this.formatter.formatDuration(duration);

    // Clear current line and show completion
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(
      this.formatter.success(
        `${message || this.currentMessage} completed in ${durationText}`
      ) + '\n'
    );
  }

  /**
   * Show error
   */
  error(message: string): void {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Clear current line and show error
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(this.formatter.error(message) + '\n');
  }

  // Private methods

  /**
   * Update progress display
   */
  private updateProgress(): void {
    if (!this.isActive || this.total === 0) return;

    const percentage = Math.round((this.currentProgress / this.total) * 100);
    const progressBar = this.createProgressBar(percentage);

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${this.currentMessage} ${progressBar} ${percentage}%`);
  }

  /**
   * Create progress bar string
   */
  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    const filledChar = '█';
    const emptyChar = '░';

    return `[${filledChar.repeat(filled)}${emptyChar.repeat(empty)}]`;
  }
}

/**
 * CLI integration manager
 */
export class CLIIntegrationManager {
  private formatter: CLIOutputFormatter;
  private progress: CLIProgressIndicator;
  private logger: Logger;
  private config: CLIConfiguration;

  constructor(config: CLIConfiguration, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.formatter = new CLIOutputFormatter(config, logger);
    this.progress = new CLIProgressIndicator(this.formatter);
  }

  /**
   * Parse CLI options
   */
  parseOptions(args: string[]): CLICommandOptions {
    const options: CLICommandOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--quiet':
        case '-q':
          options.quiet = true;
          break;
        case '--timeout':
        case '-t':
          if (nextArg) {
            options.timeout = parseInt(nextArg);
            i++;
          }
          break;
        case '--concurrency':
        case '-c':
          if (nextArg) {
            options.concurrency = parseInt(nextArg);
            i++;
          }
          break;
        case '--config':
          if (nextArg) {
            options.config = nextArg;
            i++;
          }
          break;
        case '--output':
        case '-o':
          if (nextArg) {
            options.output = nextArg;
            i++;
          }
          break;
        case '--format':
        case '-f':
          if (nextArg) {
            options.format = nextArg;
            i++;
          }
          break;
        case '--include':
          if (nextArg) {
            options.include = nextArg.split(',');
            i++;
          }
          break;
        case '--exclude':
          if (nextArg) {
            options.exclude = nextArg.split(',');
            i++;
          }
          break;
        case '--plugins':
        case '-p':
          if (nextArg) {
            options.plugins = nextArg.split(',');
            i++;
          }
          break;
        case '--incremental':
        case '-i':
          options.incremental = true;
          break;
        case '--watch':
        case '-w':
          options.watch = true;
          break;
        case '--fix':
          options.fix = true;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
      }
    }

    return options;
  }

  /**
   * Setup analysis engine for CLI usage
   */
  setupAnalysisEngine(
    analysisEngine: AnalysisEngine,
    options: CLICommandOptions
  ): void {
    // Configure engine based on CLI options
    const engineConfig = {
      maxConcurrency: options.concurrency || 4,
      defaultTimeout: options.timeout || 30000,
      enableCache: true,
      sandboxConfig: {
        maxExecutionTime: options.timeout || 30000,
        maxMemoryUsage: 1024, // 1GB
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.md'],
        allowedCommands: ['eslint', 'prettier', 'tsc', 'bun'],
        enableFileSystemAccess: true,
        enableNetworkAccess: false,
        workingDirectory: process.cwd()
      },
      progressReportingInterval: 1000,
      enableIncrementalAnalysis: options.incremental || false,
      maxRetryAttempts: 3,
      retryDelay: 1000
    };

    analysisEngine.updateConfig(engineConfig);

    // Setup event handlers for CLI output
    this.setupEventHandlers(analysisEngine, options);
  }

  /**
   * Create report configuration from CLI options
   */
  createReportConfig(options: CLICommandOptions): ReportConfig {
    const format = this.parseReportFormat(options.format);

    return {
      format,
      outputPath: options.output,
      includeDetails: !options.quiet,
      includeMetrics: true,
      includeRecommendations: true,
      includeCharts: false, // CLI doesn't support charts
      groupBy: 'tool',
      sortBy: 'severity',
      filter: {
        minSeverity: options.verbose ? 'info' : 'warning'
      }
    };
  }

  /**
   * Display analysis results in CLI format
   */
  displayResults(result: any, options: CLICommandOptions): void {
    if (options.quiet) {
      return;
    }

    console.log(this.formatter.header('Code Quality Analysis Results'));

    // Summary
    console.log(this.formatter.section('Summary'));
    console.log(this.formatter.keyValue('Overall Score', `${result.overallScore}%`));
    console.log(this.formatter.keyValue('Total Issues', result.summary.totalIssues.toString()));
    console.log(this.formatter.keyValue('Errors', result.summary.totalErrors.toString()));
    console.log(this.formatter.keyValue('Warnings', result.summary.totalWarnings.toString()));
    console.log(this.formatter.keyValue('Fixable Issues', result.summary.totalFixable.toString()));
    console.log(this.formatter.keyValue('Execution Time', this.formatter.formatDuration(result.duration)));

    // Tool results
    console.log(this.formatter.section('Tool Results'));

    for (const tool of result.toolResults) {
      const statusIcon = tool.status === 'success' ? this.formatter.success('✓') :
                         tool.status === 'warning' ? this.formatter.warning('⚠') :
                         this.formatter.error('✗');

      console.log(`\n${tool.toolName} ${statusIcon}`);
      console.log(this.formatter.keyValue('Status', tool.status));
      console.log(this.formatter.keyValue('Issues', tool.issues.length.toString()));
      console.log(this.formatter.keyValue('Time', this.formatter.formatDuration(tool.executionTime)));

      if (!options.verbose && tool.issues.length > 0) {
        console.log('Top issues:');
        tool.issues.slice(0, 5).forEach(issue => {
          console.log(`  ${this.formatter.issue(issue.type, issue.filePath, issue.lineNumber, issue.message)}`);
        });
        if (tool.issues.length > 5) {
          console.log(`  ... and ${tool.issues.length - 5} more issues`);
        }
      } else if (options.verbose) {
        tool.issues.forEach(issue => {
          console.log(`  ${this.formatter.issue(issue.type, issue.filePath, issue.lineNumber, issue.message)}`);
        });
      }
    }

    // Recommendations
    if (result.aiPrompts && result.aiPrompts.length > 0) {
      console.log(this.formatter.section('AI Recommendations'));
      result.aiPrompts.forEach(prompt => {
        console.log(this.formatter.listItem(`${prompt.title}: ${prompt.description}`));
      });
    }

    console.log(''); // Empty line at the end
  }

  /**
   * Get progress indicator
   */
  getProgress(): ProgressIndicator {
    return this.progress;
  }

  /**
   * Get formatter
   */
  getFormatter(): CLIOutputFormatter {
    return this.formatter;
  }

  // Private methods

  /**
   * Parse report format from string
   */
  private parseReportFormat(format?: string): ReportFormat {
    switch (format?.toLowerCase()) {
      case 'json':
        return ReportFormat.JSON;
      case 'html':
        return ReportFormat.HTML;
      case 'markdown':
      case 'md':
        return ReportFormat.MARKDOWN;
      case 'junit':
        return ReportFormat.JUNIT;
      case 'csv':
        return ReportFormat.CSV;
      case 'sarif':
        return ReportFormat.SARIF;
      default:
        return ReportFormat.TEXT;
    }
  }

  /**
   * Setup event handlers for analysis engine
   */
  private setupEventHandlers(analysisEngine: AnalysisEngine, options: CLICommandOptions): void {
    analysisEngine.on('analysis:start', (projectId: string) => {
      if (!options.quiet) {
        console.log(this.formatter.info(`Starting analysis for project: ${projectId}`));
      }
    });

    analysisEngine.on('analysis:progress', (projectId: string, progress: AnalysisProgress) => {
      if (options.verbose && !options.quiet) {
        console.log(`Progress: ${progress.completedPlugins}/${progress.totalPlugins} plugins completed`);
      }
    });

    analysisEngine.on('analysis:plugin-start', (projectId: string, pluginName: string) => {
      if (options.verbose && !options.quiet) {
        console.log(this.formatter.info(`Running ${pluginName}...`));
      }
    });

    analysisEngine.on('analysis:plugin-complete', (projectId: string, pluginName: string, result: any) => {
      if (options.verbose && !options.quiet) {
        const status = result.status === 'success' ? this.formatter.success('✓') :
                     result.status === 'warning' ? this.formatter.warning('⚠') :
                     this.formatter.error('✗');
        console.log(`Completed ${pluginName} ${status} (${result.issues.length} issues)`);
      }
    });

    analysisEngine.on('analysis:complete', (projectId: string, result: any) => {
      if (!options.quiet) {
        console.log(this.formatter.success(`Analysis completed for project: ${projectId}`));
      }
    });

    analysisEngine.on('analysis:error', (projectId: string, error: Error) => {
      console.log(this.formatter.error(`Analysis failed for project ${projectId}: ${error.message}`));
    });
  }
}