import { BaseCommand } from './base-command';
import React from 'react';
import { render } from 'ink';
import { CommandOptions, ProjectConfiguration, ToolConfiguration } from '@dev-quality/types';
import type { AnalysisResult } from '../types';
import { Dashboard } from '../components/dashboard';
import { useAnalysisResults } from '../hooks/useAnalysisResults';
import type { AnalysisProgress as _AnalysisProgress } from '@dev-quality/core';

export interface AnalyzeOptions {
  tools?: string;
  output?: string;
  format?: string;
  failOnError?: boolean;
  quick?: boolean;
  dashboard?: boolean;
  noDashboard?: boolean;
  export?: string;
  filter?: string;
  sortBy?: string;
  maxItems?: number;
}

export class AnalyzeCommand extends BaseCommand {
  constructor(options: CommandOptions & AnalyzeOptions) {
    super(options);
  }

  async execute(): Promise<void> {
    const analyzeOptions = this.options as AnalyzeOptions & CommandOptions;
    const showDashboard =
      analyzeOptions.dashboard ?? (!analyzeOptions.noDashboard && process.stdout.isTTY);

    if (showDashboard) {
      await this.executeWithDashboard();
    } else {
      await this.executeTraditional();
    }
  }

  private async executeWithDashboard(): Promise<void> {
    const analyzeOptions = this.options as AnalyzeOptions & CommandOptions;

    this.log('Starting code quality analysis with dashboard...');

    try {
      const config = await this.loadConfig();

      // Create a wrapper component for dashboard with analysis
      const DashboardWithAnalysis = () => {
        const { executeAnalysis, analysisError, isAnalyzing } = useAnalysisResults();

        // Execute analysis on component mount
        React.useEffect(() => {
          const projectId = config.name ?? 'default-project';
          const plugins = analyzeOptions.tools ? analyzeOptions.tools.split(',') : undefined;

          executeAnalysis(projectId, config, {
            plugins,
            incremental: !analyzeOptions.quick,
          });
        }, []);

        if (analysisError) {
          return React.createElement('div', {}, [
            React.createElement('h1', {}, 'Analysis Error'),
            React.createElement('p', {}, analysisError.message),
          ]);
        }

        if (isAnalyzing) {
          return React.createElement('div', {}, [
            React.createElement('h1', {}, 'Analyzing...'),
            React.createElement('p', {}, 'Please wait while we analyze your code quality.'),
          ]);
        }

        // Return dashboard component
        return React.createElement(Dashboard, {
          analysisResult: {
            id: 'mock-analysis',
            projectId: config.name ?? 'default-project',
            timestamp: new Date().toISOString(),
            duration: 1000,
            overallScore: 85,
            toolResults: [],
            summary: {
              totalIssues: 0,
              totalErrors: 0,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 85,
              toolCount: 0,
              executionTime: 1000,
            },
            aiPrompts: [],
          },
        });
      };

      // Render the dashboard
      const { waitUntilExit } = render(React.createElement(DashboardWithAnalysis));
      await waitUntilExit();

      this.log('Dashboard analysis completed');
    } catch (error) {
      this.log(
        `Dashboard analysis failed: ${error instanceof Error ? error.message : error}`,
        'error'
      );
      throw error;
    }
  }

  private async executeTraditional(): Promise<void> {
    this.log('Starting code quality analysis...');

    try {
      const config = await this.loadConfig();
      const toolsToRun = this.getToolsToRun(config);

      if (toolsToRun.length === 0) {
        this.log('No tools configured or enabled for analysis.', 'warn');
        return;
      }

      this.log(`Running analysis with tools: ${toolsToRun.join(', ')}`);

      const results: AnalysisResult[] = [];

      for (const toolName of toolsToRun) {
        this.logVerbose(`Running ${toolName} analysis...`);

        try {
          const result = await this.runToolAnalysis(toolName, config);
          results.push(result);

          const toolSuccess = result.toolResults[0]?.status === 'success';
          if (toolSuccess) {
            this.log(`${toolName} analysis completed successfully`);
          } else {
            this.log(`${toolName} analysis failed`, 'warn');
          }
        } catch (error) {
          this.log(`${toolName} analysis error: ${error}`, 'error');

          results.push({
            id: `${toolName}-error-${Date.now()}`,
            projectId: config.name ?? 'default-project',
            timestamp: new Date().toISOString(),
            duration: 0,
            overallScore: 0,
            toolResults: [
              {
                toolName,
                executionTime: 0,
                status: 'error',
                issues: [],
                metrics: {
                  issuesCount: 0,
                  errorsCount: 1,
                  warningsCount: 0,
                  infoCount: 0,
                  fixableCount: 0,
                  score: 0,
                },
              },
            ],
            summary: {
              totalIssues: 0,
              totalErrors: 1,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 0,
              toolCount: 1,
              executionTime: 0,
            },
            aiPrompts: [],
          });

          if ((this.options as AnalyzeOptions & CommandOptions).failOnError) {
            throw new Error(`Analysis failed for tool: ${toolName}`);
          }
        }
      }

      await this.outputResults(results);

      const summary = this.generateSummary(results);
      this.log(`Analysis completed: ${summary}`);
    } catch (error) {
      this.log(`Analysis failed: ${error instanceof Error ? error.message : error}`, 'error');
      throw error;
    }
  }

  private getToolsToRun(config: ProjectConfiguration): string[] {
    const analyzeOptions = this.options as AnalyzeOptions & CommandOptions;
    if (analyzeOptions.tools) {
      return analyzeOptions.tools.split(',').map(tool => tool.trim());
    }

    return (
      config.tools
        ?.filter((tool: ToolConfiguration) => tool.enabled)
        ?.map((tool: ToolConfiguration) => tool.name)
        ?.sort((a: string, b: string) => {
          const toolA = config.tools.find((t: ToolConfiguration) => t.name === a);
          const toolB = config.tools.find((t: ToolConfiguration) => t.name === b);
          return (toolA?.priority ?? 999) - (toolB?.priority ?? 999);
        }) ?? []
    );
  }

  private async runToolAnalysis(
    toolName: string,
    config: ProjectConfiguration
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    this.logVerbose(`Simulating ${toolName} analysis...`);

    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const success = Math.random() > 0.2;

    const result: AnalysisResult = {
      id: `${toolName}-${Date.now()}`,
      projectId: config.name ?? 'default-project',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      overallScore: success
        ? Math.floor(Math.random() * 30) + 70
        : Math.floor(Math.random() * 40) + 30,
      toolResults: [
        {
          toolName,
          executionTime: Date.now() - startTime,
          status: success ? 'success' : 'error',
          issues: [],
          metrics: {
            issuesCount: success
              ? Math.floor(Math.random() * 10)
              : Math.floor(Math.random() * 20) + 10,
            errorsCount: success ? 0 : Math.floor(Math.random() * 5) + 1,
            warningsCount: success
              ? Math.floor(Math.random() * 5)
              : Math.floor(Math.random() * 10) + 5,
            infoCount: 0,
            fixableCount: Math.floor(Math.random() * 8),
            score: success
              ? Math.floor(Math.random() * 30) + 70
              : Math.floor(Math.random() * 40) + 30,
          },
        },
      ],
      summary: {
        totalIssues: success ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 20) + 10,
        totalErrors: success ? 0 : Math.floor(Math.random() * 5) + 1,
        totalWarnings: success ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 10) + 5,
        totalFixable: Math.floor(Math.random() * 8),
        overallScore: success
          ? Math.floor(Math.random() * 30) + 70
          : Math.floor(Math.random() * 40) + 30,
        toolCount: 1,
        executionTime: Date.now() - startTime,
      },
      aiPrompts: [],
    };

    return result;
  }

  private async outputResults(results: AnalysisResult[]): Promise<void> {
    const analyzeOptions = this.options as AnalyzeOptions & CommandOptions;
    if (analyzeOptions.output) {
      const { writeFileSync } = await import('node:fs');
      const content = this.formatOutput(results);
      writeFileSync(analyzeOptions.output, content, 'utf-8');
      this.log(`Results saved to: ${analyzeOptions.output}`);
    } else {
      process.stdout.write(this.formatOutput(results));
    }
  }

  private generateSummary(results: AnalysisResult[]): string {
    const total = results.length;
    const passed = results.filter(r => r.toolResults[0]?.status === 'success').length;
    const failed = total - passed;

    return `${passed}/${total} tools passed, ${failed} failed`;
  }

  protected override async loadConfig(): Promise<ProjectConfiguration> {
    const path = this.options.config ?? '.dev-quality.json';

    try {
      const { readFileSync } = await import('node:fs');
      const content = readFileSync(path, 'utf-8');
      const config = JSON.parse(content);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}
