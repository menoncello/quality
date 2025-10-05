import { BaseToolAdapter } from '../base-tool-adapter.js';
import { CoverageAnalyzer } from '../../services/coverage-analyzer.js';
import type { CoverageConfiguration } from '../../types/coverage.js';
import type {
  AnalysisContext,
  ToolResult,
  ValidationResult,
  ToolConfiguration,
  Issue,
  CoverageData
} from '../analysis-plugin.js';


/**
 * Bun Test tool adapter for test execution and coverage analysis
 */
export class BunTestAdapter extends BaseToolAdapter {
  name = 'bun-test';
  version = '1.0.0';

  /**
   * Get default Bun Test configuration
   */
  getDefaultConfig(): ToolConfiguration {
    return {
      name: 'bun-test',
      enabled: true,
      config: {
        testMatch: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
        testPathIgnorePatterns: ['node_modules/', 'dist/', 'build/'],
        coverage: true,
        coverageThreshold: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
          criticalPaths: 90
        },
        coverageDirectory: 'coverage',
        coverageReporters: ['text', 'lcov', 'json'],
        enableAdvancedCoverage: true,
        coverageExclusions: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
        coverageIncludePatterns: ['**/*.{ts,tsx,js,jsx}'],
        criticalPaths: [],
        enableTrending: true,
        enableQualityScoring: true,
        enableRiskAssessment: true,
        bail: false,
        verbose: false,
        watch: false,
        timeout: 5000
      }
    };
  }

  /**
   * Validate Bun Test configuration
   */
  validateConfig(config: ToolConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const cfg = (config as any).config as unknown;

    if ((cfg as any).testMatch && !Array.isArray((cfg as any).testMatch)) {
      errors.push('Bun Test testMatch must be an array');
    }

    if ((cfg as any).testPathIgnorePatterns && !Array.isArray((cfg as any).testPathIgnorePatterns)) {
      errors.push('Bun Test testPathIgnorePatterns must be an array');
    }

    if ((cfg as any).coverage !== undefined && typeof (cfg as any).coverage !== 'boolean') {
      errors.push('Bun Test coverage must be a boolean');
    }

    if ((cfg as any).bail !== undefined && typeof (cfg as any).bail !== 'boolean') {
      errors.push('Bun Test bail must be a boolean');
    }

    if ((cfg as any).verbose !== undefined && typeof (cfg as any).verbose !== 'boolean') {
      errors.push('Bun Test verbose must be a boolean');
    }

    if ((cfg as any).watch !== undefined && typeof (cfg as any).watch !== 'boolean') {
      errors.push('Bun Test watch must be a boolean');
    }

    if ((cfg as any).timeout !== undefined && typeof (cfg as any).timeout !== 'number') {
      errors.push('Bun Test timeout must be a number');
    }

    // Validate coverage threshold
    if ((cfg as any).coverageThreshold) {
      const threshold = (cfg as any).coverageThreshold;
      const thresholdKeys = ['statements', 'branches', 'functions', 'lines', 'criticalPaths'];

      for (const key of thresholdKeys) {
        if (threshold[key] !== undefined && (typeof threshold[key] !== 'number'  || threshold[key] < 0 || threshold[key] > 100)) {
          errors.push(`Coverage threshold ${key} must be a number between 0 and 100`);
        }
      }
    }

    // Validate advanced coverage options
    if ((cfg as any).enableAdvancedCoverage !== undefined && typeof (cfg as any).enableAdvancedCoverage !== 'boolean') {
      errors.push('Bun Test enableAdvancedCoverage must be a boolean');
    }

    if ((cfg as any).coverageExclusions && !Array.isArray((cfg as any).coverageExclusions)) {
      errors.push('Bun Test coverageExclusions must be an array');
    }

    if ((cfg as any).coverageIncludePatterns && !Array.isArray((cfg as any).coverageIncludePatterns)) {
      errors.push('Bun Test coverageIncludePatterns must be an array');
    }

    if ((cfg as any).criticalPaths && !Array.isArray((cfg as any).criticalPaths)) {
      errors.push('Bun Test criticalPaths must be an array');
    }

    if ((cfg as any).enableTrending !== undefined && typeof (cfg as any).enableTrending !== 'boolean') {
      errors.push('Bun Test enableTrending must be a boolean');
    }

    if ((cfg as any).enableQualityScoring !== undefined && typeof (cfg as any).enableQualityScoring !== 'boolean') {
      errors.push('Bun Test enableQualityScoring must be a boolean');
    }

    if ((cfg as any).enableRiskAssessment !== undefined && typeof (cfg as any).enableRiskAssessment !== 'boolean') {
      errors.push('Bun Test enableRiskAssessment must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if Bun is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.executeCommand('bun', ['--version']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Bun Test help information
   */
  getHelp(): string {
    return `
Bun Test Adapter Configuration:
  testMatch: Glob patterns for test files (default: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'])
  testPathIgnorePatterns: Patterns to ignore when looking for tests (default: ['node_modules/', 'dist/', 'build/'])
  coverage: Enable coverage collection (default: true)
  coverageThreshold: Coverage thresholds as percentages (default: { statements: 80, branches: 80, functions: 80, lines: 80 })
  coverageDirectory: Directory for coverage reports (default: 'coverage')
  coverageReporters: Coverage report formats (default: ['text', 'lcov', 'json'])
  bail: Stop after first test failure (default: false)
  verbose: Enable verbose output (default: false)
  watch: Enable watch mode (default: false)
  timeout: Test timeout in milliseconds (default: 5000)

Usage:
  The Bun Test adapter executes tests and collects coverage information.
  It supports TypeScript, JavaScript, and JSX test files.
    `.trim();
  }

  /**
   * Execute Bun Test analysis
   */
  protected async executeTool(context: AnalysisContext): Promise<ToolResult> {
    const config = this.getToolConfig();

    // Check for incremental analysis
    if (context.changedFiles && this.supportsIncremental()) {
      return this.executeIncremental(context);
    }

    // Prepare Bun Test command
    const testCommand = this.buildBunTestCommand(context, config);

    // Execute tests
    const testResult = await this.executeCommand(testCommand.cmd, testCommand.args, {
      cwd: context.projectPath,
      timeout: this.getConfigValue('timeout', 120000) // Tests can take longer
    });

    // Parse test output
    const issues = this.parseOutput(testResult.stdout, testResult.stderr, context);

    // Collect coverage if enabled
    let coverage: CoverageData | undefined;
    if ((config as any).coverage) {
      coverage = await this.collectCoverage(context, config);
    }

    const metrics = {
      testsRun: this.extractTestCount(testResult.stdout),
      testsFailed: this.extractFailureCount(testResult.stdout),
      testsPassed: this.extractPassCount(testResult.stdout),
      testSuites: this.extractSuiteCount(testResult.stdout),
      coverage
    };

    return this.createToolResult(issues, metrics, coverage);
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
      this.shouldProcessFile(file, (config as any).testMatch as string[], (config as any).testPathIgnorePatterns as string[])
    );

    if (relevantFiles.length === 0) {
      return this.createToolResult([]);
    }

    const testCommand = this.buildBunTestCommand(context, config, relevantFiles);
    const testResult = await this.executeCommand(testCommand.cmd, testCommand.args, {
      cwd: context.projectPath,
      timeout: this.getConfigValue('timeout', 120000)
    });

    const issues = this.parseOutput(testResult.stdout, testResult.stderr, context);

    let coverage: CoverageData | undefined;
    if ((config as any).coverage) {
      coverage = await this.collectCoverage(context, config);
    }

    const metrics = {
      testsRun: this.extractTestCount(testResult.stdout),
      testsFailed: this.extractFailureCount(testResult.stdout),
      testsPassed: this.extractPassCount(testResult.stdout),
      testSuites: this.extractSuiteCount(testResult.stdout),
      coverage
    };

    return this.createToolResult(issues, metrics, coverage);
  }

  /**
   * Build Bun Test command
   */
  private buildBunTestCommand(context: AnalysisContext, config: unknown, files?: string[]): { cmd: string; args: string[] } {
    const cmd = 'bun';
    const args: string[] = ['test'];

    // Add coverage options
    if ((config as any).coverage) {
      args.push('--coverage');

      if ((config as any).coverageDirectory) {
        args.push('--coverage-dir', (config as any).coverageDirectory);
      }

      if ((config as any).coverageReporters) {
        args.push('--coverage-reporter', ...(config as any).coverageReporters);
      }
    }

    // Add test options
    if ((config as any).bail) {
      args.push('--bail');
    }

    if ((config as any).verbose) {
      args.push('--verbose');
    }

    if ((config as any).watch) {
      args.push('--watch');
    }

    if ((config as any).timeout) {
      args.push('--timeout', (config as any).timeout.toString());
    }

    // Add specific test files if provided
    if (files && files.length > 0) {
      args.push(...files);
    } else if ((config as any).testMatch) {
      // Use test patterns
      args.push(...(config as any).testMatch);
    }

    return { cmd, args };
  }

  /**
   * Collect coverage data
   */
  private async collectCoverage(context: AnalysisContext, config: unknown): Promise<CoverageData | undefined> {
    if (!(config as any).coverage) return undefined;

    try {
      const coveragePath = `${context.projectPath}/${(config as any).coverageDirectory  ?? 'coverage'}/coverage-summary.json`;
      const detailedCoveragePath = `${context.projectPath}/${(config as any).coverageDirectory  ?? 'coverage'}/coverage-final.json`;
      const fs = require('fs/promises');

      let basicCoverage: CoverageData | undefined;
      let detailedCoverage: unknown;

      try {
        // Read basic coverage summary
        const summaryData = await fs.readFile(coveragePath, 'utf8');
        const summary = JSON.parse(summaryData);

        basicCoverage = {
          lines: {
            total: summary.total?.lines?.total ?? 0,
            covered: summary.total?.lines?.covered ?? 0,
            percentage: summary.total?.lines?.pct ?? 0
          },
          functions: {
            total: summary.total?.functions?.total ?? 0,
            covered: summary.total?.functions?.covered ?? 0,
            percentage: summary.total?.functions?.pct ?? 0
          },
          branches: {
            total: summary.total?.branches?.total ?? 0,
            covered: summary.total?.branches?.covered ?? 0,
            percentage: summary.total?.branches?.pct ?? 0
          },
          statements: {
            total: summary.total?.statements?.total ?? 0,
            covered: summary.total?.statements?.covered ?? 0,
            percentage: summary.total?.statements?.pct ?? 0
          }
        };
      } catch {
        // Coverage file not found or invalid
        return undefined;
      }

      try {
        // Read detailed coverage data for enhanced analysis
        const detailedData = await fs.readFile(detailedCoveragePath, 'utf8');
        detailedCoverage = JSON.parse(detailedData);
      } catch {
        // Detailed coverage not available, will use basic coverage only
        detailedCoverage = null;
      }

      // Use enhanced coverage analyzer if detailed data is available
      if (detailedCoverage && (config as any).enableAdvancedCoverage !== false) {
        const analyzer = new CoverageAnalyzer(this.getCoverageAnalyzerConfig(config));
        const enhancedCoverage = await analyzer.analyzeCoverage(basicCoverage, context, detailedCoverage);

        // Return the enhanced coverage data which extends the basic CoverageData
        return enhancedCoverage as CoverageData;
      }

      return basicCoverage;
    } catch {
      return undefined;
    }
  }

  /**
   * Get coverage analyzer configuration from tool config
   */
  private getCoverageAnalyzerConfig(config: unknown): Partial<CoverageConfiguration> {
    return {
      thresholds: (config as any).coverageThreshold   ?? {
        overall: 80,
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
        criticalPaths: 90
      },
      criticalPaths: (config as any).criticalPaths ?? [],
      exclusions: (config as any).coverageExclusions ?? ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
      includePatterns: (config as any).coverageIncludePatterns ??  ['**/*.{ts,tsx,js,jsx}'],
      enableTrending: (config as any).enableTrending !== false,
      enableQualityScoring: (config as any).enableQualityScoring !== false,
      enableRiskAssessment: (config as any).enableRiskAssessment !== false
    };
  }

  /**
   * Parse Bun Test output to issues
   */
  protected parseOutput(stdout: string, stderr: string, context: AnalysisContext): Issue[] {
    const issues: Issue[] = [];
    const output = stdout + stderr;
    const lines = output.split('\n');

    let currentFile = '';

    for (const line of lines) {
      // Parse test failure format
      const failureMatch = line.match(/^✖\s+(.+)\s+\((\d+)ms\)$/);
      if (failureMatch) {
        const [, testName] = failureMatch;
        const _currentTest = testName;

        issues.push(this.createIssue(
          'error',
          currentFile,
          1,
          `Test failed: ${testName}`,
          'bun-test/test-failure',
          false
        ));
        continue;
      }

      // Parse error location format
      const errorMatch = line.match(/^(\s+→)\s+(.+):(\d+):(\d+)$/);
      if (errorMatch) {
        const [, , filePath, lineNum, _colNum] = errorMatch;
        currentFile = filePath;

        // Look for error message in next lines
        const errorIndex = lines.indexOf(line);
        if (errorIndex + 1 < lines.length) {
          const errorMessage = lines[errorIndex + 1].trim();
          if (errorMessage && !errorMessage.startsWith('✖') && !errorMessage.startsWith('→')) {
            issues.push(this.createIssue(
              'error',
              filePath,
              parseInt(lineNum, 10),
              errorMessage,
              'bun-test/test-error',
              false
            ));
          }
        }
        continue;
      }

      // Parse assertion errors
      const assertionMatch = line.match(/^expect\((.+)\)\.(.+)$/);
      if (assertionMatch) {
        const [, actual, assertion] = assertionMatch;
        issues.push(this.createIssue(
          'error',
          currentFile ?? '',
          1,
          `Assertion failed: expect(${actual}).${assertion}`,
          'bun-test/assertion-failed',
          false
        ));
        continue;
      }

      // Parse timeout errors
      if (line.includes('Test timed out')) {
        issues.push(this.createIssue(
          'error',
          currentFile ?? '',
          1,
          'Test timed out',
          'bun-test/test-timeout',
          false
        ));
      }
    }

    // Check for coverage threshold violations
    const toolConfig = context.config.tools?.find(t => t.name === 'bun-test')?.config;
    const coverageThreshold = (toolConfig as any)?.coverageThreshold;
    if (coverageThreshold) {
      const coverageViolations = this.checkCoverageThresholds(output, coverageThreshold);
      issues.push(...coverageViolations);
    }

    return issues;
  }

  /**
   * Check coverage threshold violations
   */
  private checkCoverageThresholds(output: string, thresholds: any): Issue[] {
    const issues: Issue[] = [];

    // Extract coverage percentages from output
    const coverageMatch = output.match(/Lines\s+:\s+(\d+(?:\.\d+)?)/);
    if (coverageMatch && thresholds?.lines) {
      const coverage = parseFloat(coverageMatch[1]);
      if (coverage < thresholds.lines) {
        issues.push(this.createIssue(
          'warning',
          '',
          1,
          `Line coverage ${coverage}% is below threshold ${thresholds.lines}%`,
          'bun-test/coverage-threshold',
          false,
          `Add more tests to increase line coverage to at least ${thresholds.lines}%`
        ));
      }
    }

    return issues;
  }

  /**
   * Extract test count from output
   */
  private extractTestCount(output: string): number {
    const match = output.match(/(\d+) test/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Extract failure count from output
   */
  private extractFailureCount(output: string): number {
    const match = output.match(/(\d+) fail/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Extract pass count from output
   */
  private extractPassCount(output: string): number {
    const match = output.match(/(\d+) pass/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Extract suite count from output
   */
  private extractSuiteCount(output: string): number {
    const match = output.match(/(\d+) suite/);
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
   * Initialize Bun Test-specific setup
   */
  protected onInitialize(): void {
    // Check for test configuration files
    const { join } = require('path');
    const possibleConfigs = [
      'bun.config.js',
      'bun.config.ts',
      'vitest.config.js',
      'vitest.config.ts',
      'jest.config.js',
      'jest.config.ts'
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
   * Cleanup Bun Test resources
   */
  protected onCleanup(): void {
    // No specific cleanup needed for Bun Test
  }
}