import { BaseToolAdapter } from '../base-tool-adapter.js';
import type {
  AnalysisContext,
  ToolResult,
  ValidationResult,
  ToolConfiguration,
  Issue
} from '../analysis-plugin.js';

/**
 * Prettier tool adapter for code formatting checks
 */
export class PrettierAdapter extends BaseToolAdapter {
  name = 'prettier';
  version = '1.0.0';

  private prettierPath: string | null = null;

  /**
   * Get default Prettier configuration
   */
  getDefaultConfig(): ToolConfiguration {
    return {
      name: 'prettier',
      enabled: true,
      config: {
        configFile: '.prettierrc',
        ignorePath: '.prettierignore',
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.scss', '.html'],
        check: true,
        write: false,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: false,
        trailingComma: 'es5',
        bracketSpacing: true,
        arrowParens: 'avoid'
      }
    };
  }

  /**
   * Validate Prettier configuration
   */
  validateConfig(config: ToolConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const cfg = config.config as any;

    if (cfg.configFile && typeof cfg.configFile !== 'string') {
      errors.push('Prettier configFile must be a string');
    }

    if (cfg.ignorePath && typeof cfg.ignorePath !== 'string') {
      errors.push('Prettier ignorePath must be a string');
    }

    if (cfg.extensions && !Array.isArray(cfg.extensions)) {
      errors.push('Prettier extensions must be an array');
    }

    if (cfg.check !== undefined && typeof cfg.check !== 'boolean') {
      errors.push('Prettier check must be a boolean');
    }

    if (cfg.write !== undefined && typeof cfg.write !== 'boolean') {
      errors.push('Prettier write must be a boolean');
    }

    // Validate specific Prettier options
    const numericOptions = ['tabWidth'];
    for (const option of numericOptions) {
      if (cfg[option] !== undefined && typeof cfg[option] !== 'number') {
        errors.push(`Prettier ${option} must be a number`);
      }
    }

    const booleanOptions = ['useTabs', 'semi', 'singleQuote', 'bracketSpacing'];
    for (const option of booleanOptions) {
      if (cfg[option] !== undefined && typeof cfg[option] !== 'boolean') {
        errors.push(`Prettier ${option} must be a boolean`);
      }
    }

    const stringOptions = ['trailingComma', 'arrowParens'];
    for (const option of stringOptions) {
      if (cfg[option] !== undefined && typeof cfg[option] !== 'string') {
        errors.push(`Prettier ${option} must be a string`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if Prettier is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to resolve Prettier
      const prettierPath = require.resolve('prettier');
      this.prettierPath = prettierPath;

      // Try to load Prettier
      const prettier = await import(prettierPath);
      return true;
    } catch {
      try {
        // Fallback to global Prettier
        await this.executeCommand('prettier', ['--version']);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get Prettier help information
   */
  getHelp(): string {
    return `
Prettier Adapter Configuration:
  configFile: Path to Prettier configuration file (default: .prettierrc)
  ignorePath: Path to Prettier ignore file (default: .prettierignore)
  extensions: File extensions to format (default: ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.scss', '.html'])
  check: Whether to check formatting without writing (default: true)
  write: Whether to write formatted files (default: false)
  tabWidth: Number of spaces per indentation level (default: 2)
  useTabs: Use tabs instead of spaces (default: false)
  semi: Add semicolons at the end of statements (default: true)
  singleQuote: Use single quotes instead of double quotes (default: false)
  trailingComma: Print trailing commas (default: 'es5')
  bracketSpacing: Print spaces between brackets (default: true)
  arrowParens: Include parentheses around a sole arrow function parameter (default: 'avoid')

Usage:
  The Prettier adapter checks code formatting according to Prettier rules.
  It can either check for formatting issues or automatically fix them.
    `.trim();
  }

  /**
   * Execute Prettier analysis
   */
  protected async executeTool(context: AnalysisContext): Promise<ToolResult> {
    const config = this.getToolConfig();

    // Check for incremental analysis
    if (context.changedFiles && this.supportsIncremental()) {
      return this.executeIncremental(context);
    }

    // Prepare Prettier command
    const command = this.buildPrettierCommand(context, config);

    // Execute Prettier
    const result = await this.executeCommand(command.cmd, command.args, {
      cwd: context.projectPath,
      timeout: this.getConfigValue('timeout', 30000)
    });

    // Parse output
    const issues = this.parseOutput(result.stdout, result.stderr, context);

    return this.createToolResult(issues, {
      filesChecked: this.extractFileCount(result.stdout)
    });
  }

  /**
   * Execute incremental analysis
   */
  private async executeIncremental(context: AnalysisContext): Promise<ToolResult> {
    if (!context.changedFiles || context.changedFiles.length === 0) {
      return this.createToolResult([]);
    }

    const config = this.getToolConfig();
    const relevantFiles = context.changedFiles.filter(file =>
      this.shouldProcessFile(file, config.extensions as string[])
    );

    if (relevantFiles.length === 0) {
      return this.createToolResult([]);
    }

    const command = this.buildPrettierCommand(context, config, relevantFiles);
    const result = await this.executeCommand(command.cmd, command.args, {
      cwd: context.projectPath,
      timeout: this.getConfigValue('timeout', 30000)
    });

    const issues = this.parseOutput(result.stdout, result.stderr, context);
    return this.createToolResult(issues);
  }

  /**
   * Build Prettier command
   */
  private buildPrettierCommand(context: AnalysisContext, config: any, files?: string[]): { cmd: string; args: string[] } {
    const useLocalPrettier = !!this.prettierPath;
    const cmd = useLocalPrettier ? 'node' : 'prettier';
    const args: string[] = [];

    if (useLocalPrettier) {
      args.push(require.resolve('prettier/bin-prettier.js'));
    }

    // Add configuration options
    if (config.configFile) {
      args.push('--config', config.configFile);
    }

    if (config.ignorePath) {
      args.push('--ignore-path', config.ignorePath);
    }

    // Add formatting options
    if (config.tabWidth !== undefined) {
      args.push('--tab-width', config.tabWidth.toString());
    }

    if (config.useTabs !== undefined) {
      args.push(config.useTabs ? '--use-tabs' : '--no-use-tabs');
    }

    if (config.semi !== undefined) {
      args.push(config.semi ? '--semi' : '--no-semi');
    }

    if (config.singleQuote !== undefined) {
      args.push(config.singleQuote ? '--single-quote' : '--no-single-quote');
    }

    if (config.trailingComma !== undefined) {
      args.push('--trailing-comma', config.trailingComma);
    }

    if (config.bracketSpacing !== undefined) {
      args.push(config.bracketSpacing ? '--bracket-spacing' : '--no-bracket-spacing');
    }

    if (config.arrowParens !== undefined) {
      args.push('--arrow-parens', config.arrowParens);
    }

    // Add check or write option
    if (config.check) {
      args.push('--check');
    } else if (config.write) {
      args.push('--write');
    } else {
      args.push('--check'); // Default to check mode
    }

    // Add files or project path
    if (files && files.length > 0) {
      args.push(...files);
    } else {
      args.push('.');
    }

    return { cmd, args };
  }

  /**
   * Parse Prettier output to issues
   */
  protected parseOutput(stdout: string, stderr: string, context: AnalysisContext): Issue[] {
    const issues: Issue[] = [];

    // Prettier outputs list of files that need formatting when using --check
    const lines = stdout.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Parse format: /path/to/file
      if (line.trim() && !line.startsWith('[') && !line.includes('Code style issues')) {
        const filePath = line.trim();

        issues.push(this.createIssue(
          'warning',
          filePath,
          1,
          'File is not formatted according to Prettier rules',
          'prettier/prettier',
          true,
          'Run Prettier to fix formatting issues'
        ));
      }
    }

    // If there's stderr output, create an issue for that
    if (stderr.trim()) {
      issues.push(this.createIssue(
        'error',
        '',
        1,
        `Prettier execution error: ${stderr.trim()}`,
        'prettier/error',
        false
      ));
    }

    return issues;
  }

  /**
   * Extract file count from Prettier output
   */
  private extractFileCount(stdout: string): number {
    const match = stdout.match(/(\d+) files?/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if incremental analysis is supported
   */
  supportsIncremental(): boolean {
    return true;
  }

  /**
   * Check if caching is supported
   */
  supportsCache(): boolean {
    return this.isFeatureEnabled('cache', true);
  }

  /**
   * Initialize Prettier-specific setup
   */
  protected onInitialize(): void {
    // Check for Prettier configuration in project
    const config = this.getToolConfig();
    const { join } = require('path');

    const possibleConfigs = [
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.yml',
      '.prettierrc.yaml',
      '.prettierrc.json5',
      '.prettierrc.js',
      '.prettierrc.cjs',
      'prettier.config.js',
      'prettier.config.cjs'
    ];

    for (const configFile of possibleConfigs) {
      const configPath = join(process.cwd(), configFile);
      try {
        const fs = require('fs');
        if (fs.existsSync(configPath)) {
          break;
        }
      } catch {
        // Continue checking other config files
      }
    }
  }

  /**
   * Cleanup Prettier resources
   */
  protected onCleanup(): void {
    this.prettierPath = null;
  }
}