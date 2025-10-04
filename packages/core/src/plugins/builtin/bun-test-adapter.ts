import { BaseToolAdapter } from '../base-tool-adapter.js';
import { CoverageAnalyzer } from '../../services/coverage-analyzer.js';
import type {
  AnalysisContext,
  ToolResult,
  ValidationResult,
  ToolConfiguration,
  Issue,
  CoverageData
} from '../analysis-plugin.js';

import type { EnhancedCoverageData } from '../../types/coverage.js';

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

    const cfg = config.config as any;

    if (cfg.testMatch && !Array.isArray(cfg.testMatch)) {
      errors.push('Bun Test testMatch must be an array');
    }

    if (cfg.testPathIgnorePatterns && !Array.isArray(cfg.testPathIgnorePatterns)) {
      errors.push('Bun Test testPathIgnorePatterns must be an array');
    }

    if (cfg.coverage !== undefined && typeof cfg.coverage !== 'boolean') {
      errors.push('Bun Test coverage must be a boolean');
    }

    if (cfg.bail !== undefined && typeof cfg.bail !== 'boolean') {
      errors.push('Bun Test bail must be a boolean');
    }

    if (cfg.verbose !== undefined && typeof cfg.verbose !== 'boolean') {
      errors.push('Bun Test verbose must be a boolean');
    }

    if (cfg.watch !== undefined && typeof cfg.watch !== 'boolean') {
      errors.push('Bun Test watch must be a boolean');
    }

    if (cfg.timeout !== undefined && typeof cfg.timeout !== 'number') {
      errors.push('Bun Test timeout must be a number');
    }

    // Validate coverage threshold
    if (cfg.coverageThreshold) {
      const threshold = cfg.coverageThreshold;
      const thresholdKeys = ['statements', 'branches', 'functions', 'lines', 'criticalPaths'];

      for (const key of thresholdKeys) {
        if (threshold[key] !== undefined && (typeof threshold[key] !== 'number' || threshold[key] < 0 || threshold[key] > 100)) {
          errors.push(`Coverage threshold ${key} must be a number between 0 and 100`);
        }
      }
    }

    // Validate advanced coverage options
    if (cfg.enableAdvancedCoverage !== undefined && typeof cfg.enableAdvancedCoverage !== 'boolean') {
      errors.push('Bun Test enableAdvancedCoverage must be a boolean');
    }

    if (cfg.coverageExclusions && !Array.isArray(cfg.coverageExclusions)) {
      errors.push('Bun Test coverageExclusions must be an array');
    }

    if (cfg.coverageIncludePatterns && !Array.isArray(cfg.coverageIncludePatterns)) {
      errors.push('Bun Test coverageIncludePatterns must be an array');
    }

    if (cfg.criticalPaths && !Array.isArray(cfg.criticalPaths)) {
      errors.push('Bun Test criticalPaths must be an array');
    }

    if (cfg.enableTrending !== undefined && typeof cfg.enableTrending !== 'boolean') {
      errors.push('Bun Test enableTrending must be a boolean');
    }

    if (cfg.enableQualityScoring !== undefined && typeof cfg.enableQualityScoring !== 'boolean') {
      errors.push('Bun Test enableQualityScoring must be a boolean');
    }

    if (cfg.enableRiskAssessment !== undefined && typeof cfg.enableRiskAssessment !== 'boolean') {
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
    if (config.coverage) {
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
      this.shouldProcessFile(file, config.testMatch as string[], config.testPathIgnorePatterns as string[])
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
    if (config.coverage) {
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
  private buildBunTestCommand(context: AnalysisContext, config: any, files?: string[]): { cmd: string; args: string[] } {
    const cmd = 'bun';
    const args: string[] = ['test'];

    // Add coverage options
    if (config.coverage) {
      args.push('--coverage');

      if (config.coverageDirectory) {
        args.push('--coverage-dir', config.coverageDirectory);
      }

      if (config.coverageReporters) {
        args.push('--coverage-reporter', ...config.coverageReporters);
      }
    }

    // Add test options
    if (config.bail) {
      args.push('--bail');
    }

    if (config.verbose) {
      args.push('--verbose');
    }

    if (config.watch) {
      args.push('--watch');
    }

    if (config.timeout) {
      args.push('--timeout', config.timeout.toString());
    }

    // Add specific test files if provided
    if (files && files.length > 0) {
      args.push(...files);
    } else if (config.testMatch) {
      // Use test patterns
      args.push(...config.testMatch);
    }

    return { cmd, args };
  }

  /**
   * Collect coverage data
   */
  private async collectCoverage(context: AnalysisContext, config: any): Promise<CoverageData | undefined> {
    if (!config.coverage) return undefined;

    try {
      const coveragePath = `${context.projectPath}/${config.coverageDirectory || 'coverage'}/coverage-summary.json`;
      const detailedCoveragePath = `${context.projectPath}/${config.coverageDirectory || 'coverage'}/coverage-final.json`;
      const fs = require('fs/promises');

      let basicCoverage: CoverageData | undefined;
      let detailedCoverage: any;

      try {
        // Read basic coverage summary
        const summaryData = await fs.readFile(coveragePath, 'utf8');
        const summary = JSON.parse(summaryData);

        basicCoverage = {
          lines: {
            total: summary.total?.lines?.total || 0,
            covered: summary.total?.lines?.covered || 0,
            percentage: summary.total?.lines?.pct || 0
          },
          functions: {
            total: summary.total?.functions?.total || 0,
            covered: summary.total?.functions?.covered || 0,
            percentage: summary.total?.functions?.pct || 0
          },
          branches: {
            total: summary.total?.branches?.total || 0,
            covered: summary.total?.branches?.covered || 0,
            percentage: summary.total?.branches?.pct || 0
          },
          statements: {
            total: summary.total?.statements?.total || 0,
            covered: summary.total?.statements?.covered || 0,
            percentage: summary.total?.statements?.pct || 0
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
      if (detailedCoverage && config.enableAdvancedCoverage !== false) {
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
  private getCoverageAnalyzerConfig(config: any): any {
    return {
      thresholds: config.coverageThreshold || {
        overall: 80,
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
        criticalPaths: 90
      },
      criticalPaths: config.criticalPaths || [],
      exclusions: config.coverageExclusions || ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
      includePatterns: config.coverageIncludePatterns || ['**/*.{ts,tsx,js,jsx}'],
      enableTrending: config.enableTrending !== false,
      enableQualityScoring: config.enableQualityScoring !== false,
      enableRiskAssessment: config.enableRiskAssessment !== false
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
    let currentTest = '';

    for (const line of lines) {
      // Parse test failure format
      const failureMatch = line.match(/^✖\s+(.+)\s+\((\d+)ms\)$/);
      if (failureMatch) {
        const [, testName] = failureMatch;
        currentTest = testName;

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
        const [, , filePath, lineNum, colNum] = errorMatch;
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
          currentFile || '',
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
          currentFile || '',
          1,
          'Test timed out',
          'bun-test/test-timeout',
          false
        ));
      }
    }

    // Check for coverage threshold violations
    const coverageThreshold = (context.config.tools?.find(t => t.name === 'bun-test')?.config as any)?.coverageThreshold;
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
    if (coverageMatch) {
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