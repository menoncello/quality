import { BaseToolAdapter } from '../base-tool-adapter.js';
import type {
  AnalysisContext,
  ToolResult,
  ValidationResult,
  ToolConfiguration,
  Issue
} from '../analysis-plugin.js';

/**
 * ESLint tool adapter for JavaScript/TypeScript linting
 */
export class ESLintAdapter extends BaseToolAdapter {
  name = 'eslint';
  version = '1.0.0';

  private eslintPath: string | null = null;

  /**
   * Get default ESLint configuration
   */
  getDefaultConfig(): ToolConfiguration {
    return {
      name: 'eslint',
      enabled: true,
      config: {
        configFile: '.eslintrc.js',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        ignorePatterns: ['node_modules/**', 'dist/**', 'build/**'],
        maxWarnings: 0,
        fix: false,
        cache: true,
        cacheLocation: '.eslintcache'
      }
    };
  }

  /**
   * Validate ESLint configuration
   */
  validateConfig(config: ToolConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const cfg = config.config as any;

    if (cfg.configFile && typeof cfg.configFile !== 'string') {
      errors.push('ESLint configFile must be a string');
    }

    if (cfg.extensions && !Array.isArray(cfg.extensions)) {
      errors.push('ESLint extensions must be an array');
    }

    if (cfg.maxWarnings !== undefined && typeof cfg.maxWarnings !== 'number') {
      errors.push('ESLint maxWarnings must be a number');
    }

    if (cfg.fix !== undefined && typeof cfg.fix !== 'boolean') {
      errors.push('ESLint fix must be a boolean');
    }

    if (cfg.cache !== undefined && typeof cfg.cache !== 'boolean') {
      errors.push('ESLint cache must be a boolean');
    }

    if (cfg.ignorePatterns && !Array.isArray(cfg.ignorePatterns)) {
      errors.push('ESLint ignorePatterns must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if ESLint is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to resolve ESLint
      const eslintPath = require.resolve('eslint');
      this.eslintPath = eslintPath;

      // Try to load ESLint
      const { ESLint } = await import(eslintPath);
      return true;
    } catch {
      try {
        // Fallback to global ESLint
        await this.executeCommand('eslint', ['--version']);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get ESLint help information
   */
  getHelp(): string {
    return `
ESLint Adapter Configuration:
  configFile: Path to ESLint configuration file (default: .eslintrc.js)
  extensions: File extensions to lint (default: ['.js', '.jsx', '.ts', '.tsx'])
  ignorePatterns: Patterns to ignore (default: ['node_modules/**', 'dist/**', 'build/**'])
  maxWarnings: Maximum number of warnings allowed (default: 0)
  fix: Whether to auto-fix issues (default: false)
  cache: Whether to use caching (default: true)
  cacheLocation: Cache file location (default: .eslintcache)

Usage:
  The ESLint adapter automatically detects and uses project ESLint configuration.
  It can lint JavaScript, TypeScript, and JSX files.
    `.trim();
  }

  /**
   * Execute ESLint analysis
   */
  protected async executeTool(context: AnalysisContext): Promise<ToolResult> {
    const config = this.getToolConfig();

    // Check for incremental analysis
    if (context.changedFiles && this.supportsIncremental()) {
      return this.executeIncremental(context);
    }

    // Prepare ESLint command
    const command = this.buildESLintCommand(context, config);

    // Execute ESLint
    const result = await this.executeCommand(command.cmd, command.args, {
      cwd: context.projectPath,
      timeout: this.getConfigValue('timeout', 30000)
    });

    // Parse output
    const issues = this.parseOutput(result.stdout, result.stderr, context);

    return this.createToolResult(issues, {
      executionTime: 0, // Will be set by caller
      warningsIgnored: config.maxWarnings ? Math.max(0, issues.filter(i => i.type === 'warning').length - config.maxWarnings) : 0
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
      this.shouldProcessFile(file, config.extensions as string[], config.ignorePatterns as string[])
    );

    if (relevantFiles.length === 0) {
      return this.createToolResult([]);
    }

    const command = this.buildESLintCommand(context, config, relevantFiles);
    const result = await this.executeCommand(command.cmd, command.args, {
      cwd: context.projectPath,
      timeout: this.getConfigValue('timeout', 30000)
    });

    const issues = this.parseOutput(result.stdout, result.stderr, context);
    return this.createToolResult(issues);
  }

  /**
   * Build ESLint command
   */
  private buildESLintCommand(context: AnalysisContext, config: any, files?: string[]): { cmd: string; args: string[] } {
    const useLocalESLint = !!this.eslintPath;
    const cmd = useLocalESLint ? 'node' : 'eslint';
    const args: string[] = [];

    if (useLocalESLint) {
      args.push(require.resolve('eslint/bin/eslint.js'));
    }

    // Add configuration options
    if (config.configFile) {
      args.push('--config', config.configFile);
    }

    if (config.format) {
      args.push('--format', config.format);
    } else {
      args.push('--format', 'json');
    }

    if (config.maxWarnings !== undefined) {
      args.push('--max-warnings', config.maxWarnings.toString());
    }

    if (config.fix) {
      args.push('--fix');
    }

    if (config.cache) {
      args.push('--cache');
      if (config.cacheLocation) {
        args.push('--cache-location', config.cacheLocation);
      }
    }

    // Add ignore patterns
    if (config.ignorePatterns) {
      for (const pattern of config.ignorePatterns) {
        args.push('--ignore-pattern', pattern);
      }
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
   * Parse ESLint output to issues
   */
  protected parseOutput(stdout: string, stderr: string, context: AnalysisContext): Issue[] {
    const issues: Issue[] = [];

    try {
      // Try to parse JSON output
      const results = JSON.parse(stdout);

      if (Array.isArray(results)) {
        for (const result of results) {
          if (result.messages && Array.isArray(result.messages)) {
            for (const message of result.messages) {
              issues.push(this.createIssue(
                this.getIssueSeverity(message.severity),
                result.filePath,
                message.line || 1,
                message.message,
                message.ruleId,
                message.fix !== undefined,
                message.suggestion
              ));
            }
          }
        }
      }
    } catch {
      // Fallback to parsing text output
      issues.push(...this.parseTextOutput(stdout, stderr, context));
    }

    return issues;
  }

  /**
   * Parse text-based ESLint output
   */
  private parseTextOutput(stdout: string, stderr: string, context: AnalysisContext): Issue[] {
    const issues: Issue[] = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
      // Parse format: /path/to/file:line:column: severity message [rule]
      const match = line.match(/^([^:]+):(\d+):(\d+):\s+(\w+)\s+(.+?)(?:\s+\[([^\]]+)\])?$/);
      if (match) {
        const [, filePath, lineNum, colNum, severity, message, ruleId] = match;

        issues.push(this.createIssue(
          this.mapTextSeverity(severity),
          filePath,
          parseInt(lineNum, 10),
          message,
          ruleId,
          false
        ));
      }
    }

    return issues;
  }

  /**
   * Get issue severity from ESLint severity number
   */
  private getIssueSeverity(severity: number): 'error' | 'warning' | 'info' {
    switch (severity) {
      case 2: return 'error';
      case 1: return 'warning';
      default: return 'info';
    }
  }

  /**
   * Map text severity to issue type
   */
  private mapTextSeverity(severity: string): 'error' | 'warning' | 'info' {
    const normalized = severity.toLowerCase();
    if (normalized === 'error') return 'error';
    if (normalized === 'warning') return 'warning';
    return 'info';
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
   * Initialize ESLint-specific setup
   */
  protected onInitialize(): void {
    // Check for ESLint configuration in project
    const config = this.getToolConfig();
    const { join } = require('path');

    const possibleConfigs = [
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yml',
      '.eslintrc.yaml',
      '.eslintrc',
      'package.json'
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
   * Cleanup ESLint resources
   */
  protected onCleanup(): void {
    this.eslintPath = null;
  }
}