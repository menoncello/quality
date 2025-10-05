import { BaseToolAdapter } from '../base-tool-adapter.js';
import type {
  AnalysisContext,
  ToolResult,
  ValidationResult,
  ToolConfiguration,
  Issue
} from '../analysis-plugin.js';

/**
 * TypeScript tool adapter for TypeScript compilation analysis
 */
export class TypeScriptAdapter extends BaseToolAdapter {
  name = 'typescript';
  version = '1.0.0';

  private typescriptPath: string | null = null;

  /**
   * Get default TypeScript configuration
   */
  getDefaultConfig(): ToolConfiguration {
    return {
      name: 'typescript',
      enabled: true,
      config: {
        configFile: 'ts(config as any).json',
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
        include: ['src/**/*'],
        exclude: ['node_modules/**', 'dist/**', '**/*.test.*', '**/*.spec.*']
      }
    };
  }

  /**
   * Validate TypeScript configuration
   */
  validateConfig(config: ToolConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const cfg = (config as any).config as unknown;

    if ((cfg as any).configFile && typeof (cfg as any).configFile !== 'string') {
      errors.push('TypeScript configFile must be a string');
    }

    if ((cfg as any).noEmit !== undefined && typeof (cfg as any).noEmit !== 'boolean') {
      errors.push('TypeScript noEmit must be a boolean');
    }

    if ((cfg as any).skipLibCheck !== undefined && typeof (cfg as any).skipLibCheck !== 'boolean') {
      errors.push('TypeScript skipLibCheck must be a boolean');
    }

    if ((cfg as any).strict !== undefined && typeof (cfg as any).strict !== 'boolean') {
      errors.push('TypeScript strict must be a boolean');
    }

    if ((cfg as any).include && !Array.isArray((cfg as any).include)) {
      errors.push('TypeScript include must be an array');
    }

    if ((cfg as any).exclude && !Array.isArray((cfg as any).exclude)) {
      errors.push('TypeScript exclude must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if TypeScript is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to resolve TypeScript
      const typescriptPath = require.resolve('typescript');
      this.typescriptPath = typescriptPath;

      // Try to load TypeScript
      await import(typescriptPath);
      return true;
    } catch {
      try {
        // Fallback to global TypeScript
        await this.executeCommand('tsc', ['--version']);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get TypeScript help information
   */
  getHelp(): string {
    return `
TypeScript Adapter Configuration:
  configFile: Path to TypeScript configuration file (default: ts(config as any).json)
  noEmit: Do not emit output files (default: true)
  skipLibCheck: Skip type checking of declaration files (default: true)
  strict: Enable all strict type checking options (default: true)
  noImplicitAny: Raise error on expressions and declarations with an implied 'unknown' type (default: true)
  strictNullChecks: Enable strict null checks (default: true)
  strictFunctionTypes: Enable strict checking of function types (default: true)
  noImplicitReturns: Report error when not all code paths in function return a value (default: true)
  noFallthroughCasesInSwitch: Report errors for fallthrough cases in switch statement (default: true)
  noUncheckedIndexedAccess: Add 'undefined' to a type when accessed using an index (default: true)
  include: Glob patterns to include (default: ['src/**/*'])
  exclude: Glob patterns to exclude (default: ['node_modules/**', 'dist/**', '**/*.test.*', '**/*.spec.*'])

Usage:
  The TypeScript adapter performs type checking and compilation analysis.
  It detects type errors, missing declarations, and other TypeScript issues.
    `.trim();
  }

  /**
   * Execute TypeScript analysis
   */
  protected async executeTool(context: AnalysisContext): Promise<ToolResult> {
    const config = this.getToolConfig();

    // Check for incremental analysis
    if (context.changedFiles && this.supportsIncremental()) {
      return this.executeIncremental(context);
    }

    // Prepare TypeScript command
    const command = this.buildTypeScriptCommand(context, config);

    // Execute TypeScript
    const result = await this.executeCommand(command.cmd, command.args, {
      cwd: context.projectPath,
      timeout: this.getConfigValue('timeout', 60000) // TypeScript can take longer
    });

    // Parse output
    const issues = this.parseOutput(result.stdout, result.stderr, context);

    return this.createToolResult(issues, {
      filesChecked: this.extractFileCount(result.stdout),
      compilationTime: 0 // Will be set by caller
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
      this.shouldProcessFile(file, ['.ts', '.tsx'], (config as any).exclude as string[])
    );

    if (relevantFiles.length === 0) {
      return this.createToolResult([]);
    }

    const command = this.buildTypeScriptCommand(context, config, relevantFiles);
    const result = await this.executeCommand(command.cmd, command.args, {
      cwd: context.projectPath,
      timeout: this.getConfigValue('timeout', 60000)
    });

    const issues = this.parseOutput(result.stdout, result.stderr, context);
    return this.createToolResult(issues);
  }

  /**
   * Build TypeScript command
   */
  private buildTypeScriptCommand(context: AnalysisContext, config: unknown, files?: string[]): { cmd: string; args: string[] } {
    const useLocalTypeScript = !!this.typescriptPath;
    const cmd = useLocalTypeScript ? 'node' : 'tsc';
    const args: string[] = [];

    if (useLocalTypeScript) {
      args.push(require.resolve('typescript/bin/tsc'));
    }

    // Add configuration options
    if ((config as any).configFile) {
      args.push('--project', (config as any).configFile);
    }

    if ((config as any).noEmit) {
      args.push('--noEmit');
    }

    if ((config as any).skipLibCheck) {
      args.push('--skipLibCheck');
    }

    if ((config as any).strict) {
      args.push('--strict');
    }

    if ((config as any).noImplicitAny) {
      args.push('--noImplicitAny');
    }

    if ((config as any).strictNullChecks) {
      args.push('--strictNullChecks');
    }

    if ((config as any).strictFunctionTypes) {
      args.push('--strictFunctionTypes');
    }

    if ((config as any).noImplicitReturns) {
      args.push('--noImplicitReturns');
    }

    if ((config as any).noFallthroughCasesInSwitch) {
      args.push('--noFallthroughCasesInSwitch');
    }

    if ((config as any).noUncheckedIndexedAccess) {
      args.push('--noUncheckedIndexedAccess');
    }

    // Add include/exclude patterns if no config file is specified
    if (!(config as any).configFile) {
      if ((config as any).include) {
        for (const pattern of (config as any).include) {
          args.push('--include', pattern);
        }
      }

      if ((config as any).exclude) {
        for (const pattern of (config as any).exclude) {
          args.push('--exclude', pattern);
        }
      }
    }

    // Add specific files if provided
    if (files && files.length > 0) {
      args.push(...files);
    }

    return { cmd, args };
  }

  /**
   * Parse TypeScript output to issues
   */
  protected parseOutput(stdout: string, stderr: string, _context: AnalysisContext): Issue[] {
    const issues: Issue[] = [];

    // TypeScript outputs to stderr by default
    const output = stderr ?? stdout;
    const lines = output.split('\n');

    for (const line of lines) {
      // Parse format: filename(line,column): error TS####: message
      const match = line.match(/^([^(]+)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
      if (match) {
        const [, filePath, lineNum, _colNum, severity, errorCode, message] = match;

        issues.push(this.createIssue(
          severity === 'error' ? 'error' : 'warning',
          filePath,
          parseInt(lineNum, 10),
          message,
          `typescript/ts${errorCode}`,
          this.isFixableError(errorCode),
          this.getFixSuggestion(errorCode)
        ));
      }
    }

    return issues;
  }

  /**
   * Check if a TypeScript error is fixable
   */
  private isFixableError(errorCode: string): boolean {
    const fixableErrors = [
      '2304', // Cannot find name
      '2328', // All declared parameters must be used
      '2339', // Property does not exist on type
      '2362', // Left-hand side of assignment expression is not a variable
      '2368', // Duplicate identifier
      '2395', // Duplicate identifier
      '2440', // Property does not exist on type
      '2500', // Duplicate identifier
      '2502', // Duplicate identifier
      '2580', // Duplicate identifier
      '2769', // Type mismatch
      '7006', // Parameter implicitly has 'unknown' type
      '7027' // Unreachable code detected
    ];

    return fixableErrors.includes(errorCode);
  }

  /**
   * Get fix suggestion for TypeScript error codes
   */
  private getFixSuggestion(errorCode: string): string | undefined {
    const suggestions: Record<string, string> = {
      '2304': 'Import the missing module or declare the variable',
      '2328': 'Remove unused parameters or prefix with underscore',
      '2339': 'Check property name or extend type definition',
      '2362': 'Assign to a variable instead of a value',
      '2368': 'Rename one of the identifiers',
      '2395': 'Rename one of the identifiers',
      '2440': 'Check property spelling or add it to type definition',
      '2500': 'Rename one of the identifiers',
      '2502': 'Rename one of the identifiers',
      '2580': 'Rename one of the identifiers',
      '2769': 'Ensure types match or use type assertion',
      '7006': 'Add explicit type annotation',
      '7027': 'Remove unreachable code'
    };

    return suggestions[errorCode];
  }

  /**
   * Extract file count from TypeScript output
   */
  private extractFileCount(stdout: string): number {
    // Try to find file count in TypeScript output
    const match = stdout.match(/Found (\d+) errors?/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Count unique file references in output
    const files = new Set<string>();
    const lines = stdout.split('\n');
    for (const line of lines) {
      const fileMatch = line.match(/^([^(]+)\(/);
      if (fileMatch) {
        files.add(fileMatch[1]);
      }
    }

    return files.size;
  }

  /**
   * Check if incremental analysis is supported
   */
  override supportsIncremental(): boolean {
    return true;
  }

  /**
   * Check if caching is supported
   */
  override supportsCache(): boolean {
    return this.isFeatureEnabled('cache', true);
  }

  /**
   * Initialize TypeScript-specific setup
   */
  protected override onInitialize(): void {
    // Check for TypeScript configuration in project
    this.getToolConfig();
    const { join } = require('path');

    const possibleConfigs = [
      'ts(config as any).json',
      'ts(config as any).build.json',
      'ts(config as any).base.json'
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
   * Cleanup TypeScript resources
   */
  protected override onCleanup(): void {
    this.typescriptPath = null;
  }
}