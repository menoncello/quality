import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';

import { CoverageDashboard } from '../components/coverage/coverage-dashboard';
import type {
  CoverageReport,
  CoverageAnalysisEngine,
  AnalysisContext as CoreAnalysisContext,
  ToolConfiguration,
  ToolResult,
} from '@dev-quality/core';
import { logger } from '../utils/logger.js';

interface CoverageCommandOptions {
  output?: string;
  format?: 'json' | 'html' | 'markdown' | 'csv';
  interactive?: boolean;
  exclude?: string[];
  include?: string;
  'coverage-threshold'?: string;
  'critical-paths'?: string;
  'no-trends'?: boolean;
  'no-quality-score'?: boolean;
  'no-risk-assessment'?: boolean;
}

interface CoverageConfig {
  thresholds: {
    overall: number;
    lines: number;
    branches: number;
    functions: number;
    statements: number;
    criticalPaths: number;
  };
  criticalPaths: Array<{
    name: string;
    patterns: string[];
    requiredCoverage: number;
    description: string;
  }>;
  exclusions: string[];
  includePatterns: string[];
  enableTrending: boolean;
  enableQualityScoring: boolean;
  enableRiskAssessment: boolean;
}

interface AnalysisContext extends Omit<CoreAnalysisContext, 'config'> {
  config: {
    name: string;
    version: string;
    tools: ToolConfiguration[];
  };
}

export class CoverageCommand {
  private coverageEngine: CoverageAnalysisEngine | null = null;

  constructor() {
    // Initialize coverage engine
  }

  public createCommand(): Command {
    const command = new Command('coverage');

    return command
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
      .action(async (options: CoverageCommandOptions) => {
        await this.execute(options);
      });
  }

  public async execute(options: CoverageCommandOptions): Promise<void> {
    try {
      this.showProgress('Starting coverage analysis...');

      // Initialize coverage engine
      const { CoverageAnalysisEngine } = await import('@dev-quality/core');
      this.coverageEngine = new CoverageAnalysisEngine(this.getCoverageConfig(options));

      // Get analysis context
      const context = await this.getAnalysisContext();

      // Run tests to generate coverage data
      this.showProgress('Running tests to collect coverage data...');
      const testResults = await this.runTests(context);

      // Analyze coverage
      this.showProgress('Analyzing coverage data...');
      const coverageReport = await this.coverageEngine.analyzeCoverage(context, testResults);

      // Display or export results
      if (options.interactive) {
        await this.showInteractiveDashboard(coverageReport);
      } else {
        await this.exportReport(coverageReport, options);
      }

      // Show summary
      this.showSummary(coverageReport);

      // Check exit code based on thresholds
      this.checkExitCode(coverageReport, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  private getCoverageConfig(options: CoverageCommandOptions): CoverageConfig {
    const thresholds = this.parseThresholds(options['coverage-threshold']);

    return {
      thresholds,
      criticalPaths: this.parseCriticalPaths(options['critical-paths'] ?? []),
      exclusions: options.exclude ?? [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      includePatterns: options.include ? [options.include] : ['**/*.{ts,tsx,js,jsx}'],
      enableTrending: !options['no-trends'],
      enableQualityScoring: !options['no-quality-score'],
      enableRiskAssessment: !options['no-risk-assessment'],
    };
  }

  private parseThresholds(thresholdStr?: string): CoverageConfig['thresholds'] {
    const defaults = {
      overall: 80,
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
      criticalPaths: 90,
    };

    if (!thresholdStr) {
      return defaults;
    }

    try {
      // Check if it's a simple number (just overall threshold)
      const simpleNumber = parseInt(thresholdStr, 10);
      if (!isNaN(simpleNumber) && simpleNumber >= 0 && simpleNumber <= 100) {
        return {
          ...defaults,
          overall: simpleNumber,
        };
      }

      // Parse format like "overall:85,lines:90,branches:80"
      const thresholds = { ...defaults };
      const pairs = thresholdStr.split(',');

      for (const pair of pairs) {
        const [key, value] = pair.split(':');
        if (key && value) {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            thresholds[key.trim()] = numValue;
          }
        }
      }

      return thresholds;
    } catch {
      return defaults;
    }
  }

  private parseCriticalPaths(paths?: string[] | string): CoverageConfig['criticalPaths'] {
    if (!paths) {
      return [];
    }

    const pathArray = Array.isArray(paths) ? paths : [paths];
    if (pathArray.length === 0) {
      return [];
    }

    return pathArray
      .map(path => {
        // Parse format like "auth:Authentication code:95"
        const parts = path.split(':');
        if (parts.length >= 3) {
          return {
            name: parts[0]?.trim() ?? '',
            patterns: [parts[0]?.trim() ?? ''],
            requiredCoverage: parseInt(parts[2] ?? '90', 10) || 90,
            description: parts[1]?.trim() ?? '',
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private async runTests(context: AnalysisContext): Promise<ToolResult[]> {
    const { BunTestAdapter } = await import('@dev-quality/core');

    const bunTestAdapter = new BunTestAdapter();
    await bunTestAdapter.initialize({
      enabled: true,
      timeout: 120000,
      cacheEnabled: true,
      logLevel: 'info',
    });

    try {
      const result = await bunTestAdapter.execute(context);
      return [result];
    } finally {
      await bunTestAdapter.cleanup();
    }
  }

  private async showInteractiveDashboard(report: CoverageReport): Promise<void> {
    const { App } = await import('../components/app.js');

    return new Promise(resolve => {
      const { waitUntilExit } = render(
        React.createElement(App, {
          children: React.createElement(CoverageDashboard, { coverageReport: report }),
        })
      );

      waitUntilExit().then(() => {
        resolve();
      });
    });
  }

  private async exportReport(
    report: CoverageReport,
    options: CoverageCommandOptions
  ): Promise<void> {
    const outputPath = options.output ?? `coverage-report.${options.format}`;

    this.showProgress(`Exporting report to ${outputPath}...`);

    try {
      if (!this.coverageEngine) {
        throw new Error('Coverage engine not initialized');
      }
      const exportedContent = await this.coverageEngine.exportReport(
        report,
        options.format as 'json' | 'html' | 'markdown' | 'csv',
        outputPath
      );

      if (!options.output) {
        // Display content to stdout if no output file specified
        logger.info(exportedContent);
      } else {
        logger.success(`✓ Report exported to ${outputPath}`);
      }
    } catch (error) {
      throw new Error(`Failed to export report: ${error}`);
    }
  }

  private showSummary(report: CoverageReport): void {
    const { summary } = report;

    logger.info('\n📊 Coverage Analysis Summary');
    logger.info('================================');
    logger.info(
      `Overall Coverage: ${summary.overallCoverage.toFixed(1)}% (Grade: ${summary.grade})`
    );
    logger.info(`Quality Score: ${summary.qualityScore.toFixed(1)} (Risk: ${summary.riskLevel})`);
    logger.info(
      `Files: ${summary.totalFiles} total, ${summary.coveredFiles} covered, ${summary.uncoveredFiles} uncovered`
    );

    if (summary.totalCriticalPaths > 0) {
      logger.info(
        `Critical Paths: ${summary.coveredCriticalPaths}/${summary.totalCriticalPaths} meet requirements`
      );
    }

    if (summary.highPriorityRecommendations > 0) {
      logger.warning(
        `⚠️  ${summary.highPriorityRecommendations} high-priority recommendations require attention`
      );
    }

    if (summary.overallCoverage >= 90) {
      logger.success('🎉 Excellent coverage!');
    } else if (summary.overallCoverage >= 80) {
      logger.success('👍 Good coverage!');
    } else if (summary.overallCoverage >= 70) {
      logger.warning('⚠️  Coverage needs improvement');
    } else {
      logger.error('❌ Critical: Coverage is too low');
    }
  }

  private checkExitCode(report: CoverageReport, options: CoverageCommandOptions): void {
    const thresholds = this.parseThresholds(options['coverage-threshold']);
    const { summary } = report;

    let shouldFail = false;

    if (summary.overallCoverage < thresholds.overall) {
      logger.error(
        `❌ Overall coverage ${summary.overallCoverage.toFixed(1)}% is below threshold ${thresholds.overall}%`
      );
      shouldFail = true;
    }

    if (summary.lineCoverage < thresholds.lines) {
      logger.error(
        `❌ Line coverage ${summary.lineCoverage.toFixed(1)}% is below threshold ${thresholds.lines}%`
      );
      shouldFail = true;
    }

    if (summary.branchCoverage < thresholds.branches) {
      logger.error(
        `❌ Branch coverage ${summary.branchCoverage.toFixed(1)}% is below threshold ${thresholds.branches}%`
      );
      shouldFail = true;
    }

    if (summary.functionCoverage < thresholds.functions) {
      logger.error(
        `❌ Function coverage ${summary.functionCoverage.toFixed(1)}% is below threshold ${thresholds.functions}%`
      );
      shouldFail = true;
    }

    if (shouldFail) {
      process.exit(1);
    }
  }

  private handleError(error: unknown): void {
    logger.error(
      '❌ Coverage analysis failed:',
      error instanceof Error ? error.message : String(error)
    );

    if (error instanceof Error) {
      if (error.message.includes('No coverage data found')) {
        logger.warning('\n💡 Make sure to:');
        logger.warning('  1. Have test files in your project');
        logger.warning('  2. Configure Bun test to generate coverage');
        logger.warning('  3. Run tests with --coverage flag');
      } else if (error.message.includes('Bun not found')) {
        logger.warning('\n💡 Install Bun: curl -fsSL https://bun.sh/install | bash');
      }
    }

    process.exit(1);
  }

  private showProgress(message: string): void {
    logger.info(message);
  }

  private async getAnalysisContext(): Promise<AnalysisContext> {
    // Return a mock analysis context for now
    return {
      projectPath: process.cwd(),
      config: {
        name: 'project',
        version: '1.0.0',
        tools: [],
      },
      logger: {
        error: () => {},
        warn: () => {},
        info: () => {},
        debug: () => {},
      },
    };
  }
}
