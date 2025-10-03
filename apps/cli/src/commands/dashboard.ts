/**
 * Dashboard command for launching interactive quality dashboard
 */

import { BaseCommand } from './base-command';
import React from 'react';
import { render } from 'ink';
import type { CommandOptions, ProjectConfiguration } from '@dev-quality/types';
import { Dashboard } from '../components/dashboard';
import { useAnalysisResults } from '../hooks/useAnalysisResults';
import type { AnalysisResult } from '../types';

export interface DashboardOptions {
  input?: string;
  tools?: string;
  filter?: string;
  sortBy?: string;
  maxItems?: number;
  autoAnalyze?: boolean;
}

export class DashboardCommand extends BaseCommand {
  constructor(options: CommandOptions & DashboardOptions) {
    super(options);
  }

  async execute(): Promise<void> {
    const dashboardOptions = this.options as DashboardOptions & CommandOptions;

    this.log('Launching DevQuality Dashboard...');

    try {
      // Create a wrapper component for the dashboard
      const DashboardWrapper = () => {
        const { executeAnalysis, loadResults, analysisError, isAnalyzing } = useAnalysisResults();
        const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);

        // Load analysis result on mount
        React.useEffect(() => {
          this.getAnalysisResult()
            .then(setAnalysisResult)
            .catch(error => {
              this.log(`Failed to load analysis result: ${error}`, 'error');
            });
        }, []);

        // Execute analysis automatically if requested
        React.useEffect(() => {
          if (dashboardOptions.autoAnalyze !== false) {
            this.runAnalysis(executeAnalysis, loadResults);
          }
        }, []);

        if (analysisError) {
          return React.createElement('div', {}, [
            React.createElement('h1', {}, 'Dashboard Error'),
            React.createElement('p', {}, analysisError.message),
          ]);
        }

        if (isAnalyzing || !analysisResult) {
          return React.createElement('div', {}, [
            React.createElement('h1', {}, isAnalyzing ? 'Analyzing...' : 'Loading...'),
            React.createElement(
              'p',
              {},
              isAnalyzing
                ? 'Please wait while we analyze your code quality.'
                : 'Please wait while we load the results.'
            ),
          ]);
        }

        // Return dashboard component with mock or loaded results
        return React.createElement(Dashboard, {
          analysisResult,
        });
      };

      // Render the dashboard
      const { waitUntilExit } = render(React.createElement(DashboardWrapper));
      await waitUntilExit();

      this.log('Dashboard session ended');
    } catch (error) {
      this.log(`Dashboard failed: ${error instanceof Error ? error.message : error}`, 'error');
      throw error;
    }
  }

  private async runAnalysis(
    executeAnalysis: (
      projectId: string,
      config: ProjectConfiguration,
      options?: Record<string, unknown>
    ) => Promise<Record<string, unknown>>,
    loadResults: (result: AnalysisResult) => void
  ): Promise<void> {
    try {
      const config = await this.loadConfig();
      const dashboardOptions = this.options as DashboardOptions;

      const plugins = dashboardOptions.tools ? dashboardOptions.tools.split(',') : undefined;

      const result = await executeAnalysis('dashboard-project', config, {
        plugins,
      });

      if (result['success'] && result['result']) {
        loadResults(result['result'] as AnalysisResult);
      }
    } catch (error) {
      this.log(`Auto-analysis failed: ${error instanceof Error ? error.message : error}`, 'warn');
    }
  }

  private async getAnalysisResult(): Promise<AnalysisResult> {
    const dashboardOptions = this.options as DashboardOptions;

    // If input file is specified, load from there
    if (dashboardOptions.input) {
      try {
        const { readFileSync } = await import('node:fs');
        const content = readFileSync(dashboardOptions.input, 'utf-8');
        const result = JSON.parse(content);
        return result as AnalysisResult;
      } catch (error) {
        this.log(`Failed to load results from ${dashboardOptions.input}: ${error}`, 'warn');
      }
    }

    // Return mock result for now
    return {
      id: 'mock-dashboard-analysis',
      projectId: 'dashboard-project',
      timestamp: new Date().toISOString(),
      duration: 5000,
      overallScore: 78,
      toolResults: [
        {
          toolName: 'eslint',
          executionTime: 1500,
          status: 'success',
          issues: [
            {
              id: 'eslint-1',
              type: 'warning',
              toolName: 'eslint',
              filePath: 'src/components/dashboard.tsx',
              lineNumber: 45,
              message: 'Unused variable "example"',
              ruleId: 'no-unused-vars',
              fixable: true,
              suggestion: 'Remove the unused variable or use it in your code',
              score: 25,
            },
            {
              id: 'eslint-2',
              type: 'error',
              toolName: 'eslint',
              filePath: 'src/hooks/useDashboardStore.ts',
              lineNumber: 23,
              message: 'Missing return type annotation',
              ruleId: '@typescript-eslint/explicit-function-return-type',
              fixable: true,
              suggestion: 'Add explicit return type annotation',
              score: 50,
            },
          ],
          metrics: {
            issuesCount: 2,
            errorsCount: 1,
            warningsCount: 1,
            infoCount: 0,
            fixableCount: 2,
            score: 75,
          },
        },
        {
          toolName: 'typescript',
          executionTime: 2000,
          status: 'success',
          issues: [
            {
              id: 'ts-1',
              type: 'error',
              toolName: 'typescript',
              filePath: 'src/types/dashboard.ts',
              lineNumber: 15,
              message: 'Type "any" is not allowed',
              ruleId: 'no-explicit-any',
              fixable: true,
              suggestion: 'Use proper type annotations instead of "any"',
              score: 60,
            },
          ],
          metrics: {
            issuesCount: 1,
            errorsCount: 1,
            warningsCount: 0,
            infoCount: 0,
            fixableCount: 1,
            score: 85,
          },
          coverage: {
            lines: { total: 500, covered: 425, percentage: 85 },
            functions: { total: 50, covered: 45, percentage: 90 },
            branches: { total: 100, covered: 80, percentage: 80 },
            statements: { total: 600, covered: 510, percentage: 85 },
          },
        },
      ],
      summary: {
        totalIssues: 3,
        totalErrors: 2,
        totalWarnings: 1,
        totalFixable: 3,
        overallScore: 78,
        toolCount: 2,
        executionTime: 3500,
      },
      aiPrompts: [],
    };
  }
}
