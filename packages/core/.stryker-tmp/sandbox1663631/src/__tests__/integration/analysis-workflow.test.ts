/**
 * Fixed Analysis Workflow Integration Tests for Story 1.4
 *
 * Tests to validate end-to-end analysis workflows with proper API usage
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { AnalysisEngine } from '../../analysis/analysis-engine';
import { createTestPlugin } from '../test-utils-simple';
import type { Logger, AnalysisContext, ProjectConfiguration, ToolResult } from '../../plugins/analysis-plugin';

describe('Analysis Workflow Integration Tests (Fixed)', () => {
  let analysisEngine: AnalysisEngine;
  let mockLogger: Logger;
  let testProjectPath: string;

  beforeEach(async () => {
    mockLogger = {
      error: (msg) => {  
    console.error(`[ERROR] ${msg}`);
},
      warn: (msg) => {  
    console.warn(`[WARN] ${msg}`);
},
      info: (msg) => {
    console.log(`[INFO] ${msg}`);
},
      debug: (msg) => {
    console.log(`[DEBUG] ${msg}`);
}
    };

    // Initialize analysis engine with correct API
    analysisEngine = new AnalysisEngine({
      maxConcurrency: 4,
      defaultTimeout: 30000,
      enableCache: true,
      sandboxConfig: {
        maxExecutionTime: 30000,
        maxMemoryUsage: 1024,
        maxFileSize: 10 * 1024 * 1024,
        allowedFileExtensions: ['.js', '.ts', '.json'],
        allowedCommands: ['node', 'bun'],
        enableFileSystemAccess: true,
        enableNetworkAccess: false,
        workingDirectory: '/tmp'
      },
      progressReportingInterval: 1000,
      enableIncrementalAnalysis: true,
      maxRetryAttempts: 3,
      retryDelay: 1000
    }, mockLogger);

    testProjectPath = '/tmp/test-analysis-project';
    await analysisEngine.initialize();
  });

  afterEach(async () => {
    await analysisEngine.cleanup();
  });

  describe('Complete Analysis Workflow', () => {
    it('should execute end-to-end analysis with multiple plugins', async () => {
      // Create mock plugins
      const eslintPlugin = createTestPlugin({
        name: 'eslint',
        async execute(context: AnalysisContext): Promise<ToolResult> {
          return {
            toolName: 'eslint',
            status: 'success' as const,
            executionTime: 1500,
            issues: [
              {
                id: 'eslint-1',
                type: 'error' as const,
                toolName: 'eslint',
                                                filePath: `${testProjectPath}/src/test.js`,
                lineNumber: 10,
                message: 'Unexpected console statement',
                                ruleId: 'no-console',
                fixable: true,
                score: 80,
                                              },
              {
                id: 'eslint-2',
                type: 'warning' as const,
                toolName: 'eslint',
                                                filePath: `${testProjectPath}/src/test.js`,
                lineNumber: 15,
                message: 'Missing semicolon',
                                ruleId: 'semi',
                fixable: true,
                score: 60,
                                              }
            ],
            metrics: {
              issuesCount: 2,
              errorsCount: 1,
              warningsCount: 1,
              infoCount: 0,
              fixableCount: 2,
              score: 70
            },
            summary: {
              totalIssues: 2,
              totalErrors: 1,
              totalWarnings: 1,
              totalFixable: 2,
              overallScore: 70,
              toolCount: 1,
              executionTime: 500
            }
          };
        }
      });

      const prettierPlugin = createTestPlugin({
        name: 'prettier',
        async execute(context: AnalysisContext) {
          return {
            toolName: 'prettier',
            status: 'success' as const,
            executionTime: 800,
            issues: [],
            metrics: {
              toolName: 'prettier',
              executionTime: 800,
              issuesCount: 0,
              errorsCount: 0,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 100,
              customMetrics: {},
              performance: {
                filesProcessed: 1,
                linesOfCode: 50
              }
            },
            summary: {
              totalIssues: 0,
              totalErrors: 0,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 100,
              toolCount: 1,
              executionTime: 300
            }
          };
        }
      });

      const typescriptPlugin = createTestPlugin({
        name: 'typescript',
        async execute(context: AnalysisContext) {
          return {
            toolName: 'typescript',
            status: 'success' as const,
            executionTime: 2000,
            issues: [
              {
                id: 'ts-1',
                type: 'error' as const,
                toolName: 'typescript',
                                category: 'typescript',
                filePath: `${testProjectPath}/src/test.ts`,
                lineNumber: 20,
                message: "Property 'missingProp' does not exist",
                originalMessage: "Property 'missingProp' does not exist",
                ruleId: '2339',
                fixable: false,
                score: 100,
                                              }
            ],
            metrics: {
              toolName: 'typescript',
              executionTime: 2000,
              issuesCount: 1,
              errorsCount: 1,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 80,
              customMetrics: {},
              performance: {
                filesProcessed: 1,
                linesOfCode: 30
              }
            },
            summary: {
              totalIssues: 1,
              totalErrors: 1,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 30,
              toolCount: 1,
              executionTime: 400
            }
          };
        }
      });

      // Register plugins with analysis engine
      await analysisEngine.registerPlugin(eslintPlugin);
      await analysisEngine.registerPlugin(prettierPlugin);
      await analysisEngine.registerPlugin(typescriptPlugin);

      // Create analysis context
      const analysisContext: AnalysisContext = {
        projectPath: testProjectPath,
        logger: mockLogger,
        config: {
          name: 'test-project',
          version: '1.0.0',
          tools: [
            { name: 'eslint', enabled: true, config: {} },
            { name: 'prettier', enabled: true, config: {} },
            { name: 'typescript', enabled: true, config: {} }
          ]
        }
      };

      // Execute analysis
      const result = await analysisEngine.executeAnalysis('test-project', analysisContext, {
        plugins: ['eslint', 'prettier', 'typescript'],
        incremental: false,
        enableCache: false
      });

      // Verify results
      expect(result).toBeDefined();
      expect(result.projectId).toBe('test-project');
      expect(result.toolResults).toHaveLength(3);
      expect(result.summary.totalIssues).toBeGreaterThan(0); // At least some issues found

      // Verify tool-specific results
      const eslintResult = result.toolResults.find(r => r.toolName === 'eslint');
      const prettierResult = result.toolResults.find(r => r.toolName === 'prettier');
      const typescriptResult = result.toolResults.find(r => r.toolName === 'typescript');

      expect(eslintResult).toBeDefined();
      expect(prettierResult).toBeDefined();
      expect(typescriptResult).toBeDefined();
    });

    it('should handle plugin failures gracefully', async () => {
      // Create a failing plugin
      const failingPlugin = createTestPlugin({
        name: 'failing-plugin',
        async execute(context: AnalysisContext) {
          throw new Error('Plugin execution failed');
        }
      });

      // Create a working plugin
      const workingPlugin = createTestPlugin({
        name: 'working-plugin',
        async execute(context: AnalysisContext) {
          return {
            toolName: 'working-plugin',
            status: 'success' as const,
            executionTime: 1000,
            issues: [],
            metrics: {
              toolName: 'working-plugin',
              executionTime: 1000,
              issuesCount: 0,
              errorsCount: 0,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 100,
              customMetrics: {},
              performance: {
                filesProcessed: 1,
                linesOfCode: 10
              }
            },
            summary: {
              totalIssues: 0,
              totalErrors: 0,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 100,
              toolCount: 1,
              executionTime: 300
            }
          };
        }
      });

      // Register plugins
      await analysisEngine.registerPlugin(failingPlugin);
      await analysisEngine.registerPlugin(workingPlugin);

      const analysisContext: AnalysisContext = {
        projectPath: testProjectPath,
        logger: mockLogger,
        config: {
          name: 'failure-test-project',
          version: '1.0.0',
          tools: [
            { name: 'failing-plugin', enabled: true, config: {} },
            { name: 'working-plugin', enabled: true, config: {} }
          ]
        }
      };

      const result = await analysisEngine.executeAnalysis('failure-test-project', analysisContext, {
        plugins: ['failing-plugin', 'working-plugin']
      });

      // Should have results from both plugins (one successful, one failed)
      expect(result.toolResults).toHaveLength(2);

      // The working plugin should have succeeded
      const workingResult = result.toolResults.find(r => r.toolName === 'working-plugin');
      expect(workingResult).toBeDefined();
      expect(workingResult?.status).toBe('success');

      // The failing plugin should still have a result
      const failingResult = result.toolResults.find(r => r.toolName === 'failing-plugin');
      expect(failingResult).toBeDefined();
    });

    it('should respect plugin dependencies', async () => {
      // Create plugins with dependencies
      const basePlugin = createTestPlugin({
        name: 'base-plugin',
        dependencies: [],
        async execute(context: AnalysisContext) {
          return {
            toolName: 'base-plugin',
            status: 'success' as const,
            executionTime: 500,
            issues: [],
            metrics: {
              toolName: 'base-plugin',
              executionTime: 500,
              issuesCount: 0,
              errorsCount: 0,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 100,
              customMetrics: {},
              performance: {
                filesProcessed: 1,
                linesOfCode: 10
              }
            },
            summary: {
              totalIssues: 0,
              totalErrors: 0,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 100,
              toolCount: 1,
              executionTime: 300
            }
          };
        }
      });

      const dependentPlugin = createTestPlugin({
        name: 'dependent-plugin',
        dependencies: ['base-plugin'],
        async execute(context: AnalysisContext) {
          return {
            toolName: 'dependent-plugin',
            status: 'success' as const,
            executionTime: 300,
            issues: [],
            metrics: {
              toolName: 'dependent-plugin',
              executionTime: 300,
              issuesCount: 0,
              errorsCount: 0,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 100,
              customMetrics: {},
              performance: {
                filesProcessed: 1,
                linesOfCode: 5
              }
            },
            summary: {
              totalIssues: 0,
              totalErrors: 0,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 100,
              toolCount: 1,
              executionTime: 300
            }
          };
        }
      });

      // Register plugins
      await analysisEngine.registerPlugin(basePlugin);
      await analysisEngine.registerPlugin(dependentPlugin);

      const analysisContext: AnalysisContext = {
        projectPath: testProjectPath,
        logger: mockLogger,
        config: {
          name: 'dependency-test-project',
          version: '1.0.0',
          tools: [
            { name: 'base-plugin', enabled: true, config: {} },
            { name: 'dependent-plugin', enabled: true, config: {} }
          ]
        }
      };

      const result = await analysisEngine.executeAnalysis('dependency-test-project', analysisContext, {
        plugins: ['base-plugin', 'dependent-plugin']
      });

      // Both plugins should execute successfully
      expect(result.toolResults).toHaveLength(2);

      const baseResult = result.toolResults.find(r => r.toolName === 'base-plugin');
      const dependentResult = result.toolResults.find(r => r.toolName === 'dependent-plugin');

      expect(baseResult).toBeDefined();
      expect(dependentResult).toBeDefined();
      expect(baseResult?.status).toBe('success');
      expect(dependentResult?.status).toBe('success');
    });
  });

  describe('Result Aggregation Integration', () => {
    it('should aggregate results from multiple tools correctly', async () => {
      const tool1Plugin = createTestPlugin({
        name: 'tool-1',
        async execute(context: AnalysisContext) {
          return {
            toolName: 'tool-1',
            status: 'success' as const,
            executionTime: 1000,
            issues: [
              {
                id: 'tool-1-1',
                type: 'warning' as const,
                toolName: 'tool-1',
                                category: 'test-category',
                filePath: `${testProjectPath}/src/file1.ts`,
                lineNumber: 5,
                message: 'Test warning',
                originalMessage: 'Test warning',
                ruleId: 'rule-1',
                fixable: true,
                score: 50,
                                              }
            ],
            metrics: {
              toolName: 'tool-1',
              executionTime: 1000,
              issuesCount: 1,
              errorsCount: 0,
              warningsCount: 1,
              infoCount: 0,
              fixableCount: 1,
              score: 90,
              customMetrics: {},
              performance: {
                filesProcessed: 1,
                linesOfCode: 20
              }
            },
            summary: {
              totalIssues: 1,
              totalErrors: 0,
              totalWarnings: 1,
              totalFixable: 1,
              overallScore: 80,
              toolCount: 1,
              executionTime: 350
            }
          };
        }
      });

      const tool2Plugin = createTestPlugin({
        name: 'tool-2',
        async execute(context: AnalysisContext) {
          return {
            toolName: 'tool-2',
            status: 'success' as const,
            executionTime: 800,
            issues: [
              {
                id: 'tool-2-1',
                type: 'error' as const,
                toolName: 'tool-2',
                                category: 'test-category',
                filePath: `${testProjectPath}/src/file1.ts`,
                lineNumber: 5,
                message: 'Test error',
                originalMessage: 'Test error',
                ruleId: 'rule-2',
                fixable: false,
                score: 80,
                                              }
            ],
            metrics: {
              toolName: 'tool-2',
              executionTime: 800,
              issuesCount: 1,
              errorsCount: 1,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 80,
              customMetrics: {},
              performance: {
                filesProcessed: 1,
                linesOfCode: 20
              }
            },
            summary: {
              totalIssues: 1,
              totalErrors: 1,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 30,
              toolCount: 1,
              executionTime: 400
            }
          };
        }
      });

      // Register plugins
      await analysisEngine.registerPlugin(tool1Plugin);
      await analysisEngine.registerPlugin(tool2Plugin);

      const analysisContext: AnalysisContext = {
        projectPath: testProjectPath,
        logger: mockLogger,
        config: {
          name: 'aggregation-test-project',
          version: '1.0.0',
          tools: [
            { name: 'tool-1', enabled: true, config: {} },
            { name: 'tool-2', enabled: true, config: {} }
          ]
        }
      };

      const result = await analysisEngine.executeAnalysis('aggregation-test-project', analysisContext, {
        plugins: ['tool-1', 'tool-2']
      });

      // Verify aggregation
      expect(result.toolResults).toHaveLength(2);
      expect(result.summary.totalIssues).toBe(2);
      expect(result.overallScore).toBeDefined();
      expect(result.overallScore).toBeLessThan(100);
    });
  });

  describe('Performance Integration', () => {
    it('should complete analysis within performance targets', async () => {
      const performancePlugin = createTestPlugin({
        name: 'performance-plugin',
        async execute(context: AnalysisContext) {
          const startTime = Date.now();
          // Simulate variable performance
          const workload = Math.random() * 100; // 0-100ms
          await new Promise(resolve => setTimeout(resolve, workload));

          return {
            toolName: 'performance-plugin',
            status: 'success' as const,
            executionTime: Date.now() - startTime,
            issues: [],
            metrics: {
              toolName: 'performance-plugin',
              executionTime: Date.now() - startTime,
              issuesCount: 0,
              errorsCount: 0,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 100,
              customMetrics: {},
              performance: {
                filesProcessed: 1,
                linesOfCode: 10
              }
            },
            summary: {
              totalIssues: 0,
              totalErrors: 0,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 100,
              toolCount: 1,
              executionTime: 300
            }
          };
        }
      });

      await analysisEngine.registerPlugin(performancePlugin);

      const analysisContext: AnalysisContext = {
        projectPath: testProjectPath,
        logger: mockLogger,
        config: {
          name: 'performance-test-project',
          version: '1.0.0',
          tools: [
            { name: 'performance-plugin', enabled: true, config: {} }
          ]
        }
      };

      const startTime = Date.now();
      const result = await analysisEngine.executeAnalysis('performance-test-project', analysisContext, {
        plugins: ['performance-plugin']
      });
      const duration = Date.now() - startTime;

      // Verify performance targets
      expect(result).toBeDefined();
      expect(result.toolResults).toHaveLength(1);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});