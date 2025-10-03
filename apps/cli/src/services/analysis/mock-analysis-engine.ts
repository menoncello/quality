/**
 * Mock analysis engine for testing and development
 */

import { EventEmitter } from 'events';
import type { AnalysisProgress } from '@dev-quality/core';
import type {
  Issue,
  ToolResult,
  AnalysisContext,
  AnalysisResult as CoreAnalysisResult,
} from '@dev-quality/core';
import { transformCoreAnalysisResultToCLI } from '../../utils/type-transformers';

export class MockAnalysisEngine extends EventEmitter {
  // Implement AnalysisEngine interface methods for compatibility
  // but don't directly implement to avoid type conflicts
  private isRunning = false;
  private currentAnalysis: string | null = null;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    // Mock analysis engine initialized
  }

  async executeAnalysis(
    projectId: string,
    context: AnalysisContext,
    options?: {
      plugins?: string[];
      incremental?: boolean;
      timeout?: number;
      enableCache?: boolean;
    }
  ): Promise<CoreAnalysisResult> {
    if (this.isRunning) {
      throw new Error('Analysis already in progress');
    }

    this.isRunning = true;
    this.currentAnalysis = projectId;

    const startTime = Date.now();
    const plugins = options?.plugins ?? ['eslint', 'typescript', 'prettier'];

    try {
      // Emit start event
      this.emit('analysis:start', projectId);

      // Simulate analysis progress
      const totalPlugins = plugins.length;
      for (let i = 0; i < totalPlugins; i++) {
        const pluginName = plugins[i];
        if (!pluginName) continue;

        // Emit progress update
        const progress: AnalysisProgress = {
          totalPlugins,
          completedPlugins: i,
          currentPlugin: pluginName,
          percentage: (i / totalPlugins) * 100,
          startTime: new Date(startTime),
          estimatedTimeRemaining: (totalPlugins - i) * 1000,
        };
        this.emit('analysis:progress', projectId, progress);

        // Emit plugin start
        this.emit('analysis:plugin-start', projectId, pluginName);

        // Simulate plugin execution time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Generate mock tool result
        const toolResult = this.generateMockToolResult(pluginName);

        // Emit plugin complete
        this.emit('analysis:plugin-complete', projectId, toolResult);
      }

      // Generate final result
      const coreResult = this.generateMockAnalysisResult(projectId, plugins, startTime);
      const result = transformCoreAnalysisResultToCLI(coreResult);

      // Emit completion
      this.emit('analysis:complete', projectId, result);

      return coreResult;
    } catch (error) {
      this.emit(
        'analysis:error',
        projectId,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    } finally {
      this.isRunning = false;
      this.currentAnalysis = null;
    }
  }

  private generateMockToolResult(toolName: string): ToolResult {
    const issueCount = Math.floor(Math.random() * 20) + 5;
    const issues: Issue[] = [];

    for (let i = 0; i < issueCount; i++) {
      const types = ['error', 'warning', 'info'];
      const type = types[Math.floor(Math.random() * types.length)] as 'error' | 'warning' | 'info';

      issues.push({
        id: `${toolName}-${i}-${Date.now()}`,
        type,
        toolName,
        filePath: this.generateMockFilePath(),
        lineNumber: Math.floor(Math.random() * 100) + 1,
        message: this.generateMockMessage(type),
        ruleId: `${toolName}-${type}-${i}`,
        fixable: Math.random() > 0.5,
        suggestion: Math.random() > 0.7 ? this.generateMockSuggestion() : undefined,
        score: Math.floor(Math.random() * 100) + 1,
      });
    }

    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const infoCount = issues.filter(i => i.type === 'info').length;
    const fixableCount = issues.filter(i => i.fixable).length;

    return {
      toolName,
      executionTime: 500 + Math.random() * 1000,
      status: Math.random() > 0.1 ? 'success' : 'warning',
      issues,
      metrics: {
        issuesCount: issues.length,
        errorsCount: errorCount,
        warningsCount: warningCount,
        infoCount,
        fixableCount,
        score: Math.floor(Math.random() * 100) + 1,
      },
      coverage: toolName === 'typescript' ? this.generateMockCoverage() : undefined,
    };
  }

  private generateMockAnalysisResult(
    projectId: string,
    plugins: string[],
    startTime: number
  ): CoreAnalysisResult {
    const toolResults = plugins.map(tool => this.generateMockToolResult(tool));
    const allIssues = toolResults.flatMap(result => result.issues);

    const totalErrors = allIssues.filter(issue => issue.type === 'error').length;
    const totalWarnings = allIssues.filter(issue => issue.type === 'warning').length;
    const totalFixable = allIssues.filter(issue => issue.fixable).length;

    const overallScore = Math.max(
      0,
      100 - totalErrors * 10 - totalWarnings * 3 - allIssues.length * 0.5
    );

    return {
      id: `analysis-${projectId}-${Date.now()}`,
      projectId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      overallScore: Math.round(overallScore),
      toolResults,
      summary: {
        totalIssues: allIssues.length,
        totalErrors,
        totalWarnings,
        totalFixable,
        overallScore: Math.round(overallScore),
        toolCount: plugins.length,
        executionTime: Date.now() - startTime,
      },
      aiPrompts: [],
    } as unknown as CoreAnalysisResult;
  }

  private generateMockFilePath(): string {
    const paths = [
      'src/components/dashboard.tsx',
      'src/hooks/useDashboardStore.ts',
      'src/services/dashboard/dashboard-service.ts',
      'src/utils/color-coding.ts',
      'src/types/dashboard.ts',
      'src/index.ts',
      'tests/unit/dashboard.test.ts',
      'docs/README.md',
    ];
    const randomPath = paths[Math.floor(Math.random() * paths.length)];
    return randomPath ?? 'src/index.ts';
  }

  private generateMockMessage(type: string): string {
    const messages = {
      error: [
        'Unexpected token in expression',
        'Type assertion is not allowed',
        'Cannot find module declaration',
        'Function must have a return type',
        'Variable is used before assignment',
      ],
      warning: [
        'Unused variable detected',
        'Missing dependency in useEffect',
        'Function is missing dependency array',
        'Type assertion may be unsafe',
        'Import is not used',
      ],
      info: [
        'Consider using useCallback for optimization',
        'File could benefit from better documentation',
        'Consider breaking down large function',
        'Add type annotations for better safety',
        'Consider using const instead of let',
      ],
    };

    const typeMessages = messages[type as keyof typeof messages] ?? messages.info;
    const randomMessage = typeMessages[Math.floor(Math.random() * typeMessages.length)];
    return randomMessage ?? 'Code quality issue detected';
  }

  private generateMockSuggestion(): string {
    const suggestions = [
      'Add proper error handling',
      'Consider refactoring into smaller functions',
      'Add type annotations',
      'Remove unused imports',
      'Add JSDoc comments',
      'Use more descriptive variable names',
      'Consider using early return pattern',
      'Add input validation',
    ];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    return randomSuggestion ?? 'Consider refactoring this code';
  }

  private generateMockCoverage() {
    return {
      lines: {
        total: 1000,
        covered: Math.floor(Math.random() * 500) + 500,
        percentage: Math.random() * 40 + 60,
      },
      functions: {
        total: 100,
        covered: Math.floor(Math.random() * 50) + 50,
        percentage: Math.random() * 30 + 70,
      },
      branches: {
        total: 200,
        covered: Math.floor(Math.random() * 100) + 100,
        percentage: Math.random() * 35 + 65,
      },
      statements: {
        total: 1200,
        covered: Math.floor(Math.random() * 600) + 600,
        percentage: Math.random() * 25 + 75,
      },
    };
  }
}
