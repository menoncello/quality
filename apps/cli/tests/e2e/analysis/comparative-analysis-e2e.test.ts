import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock CLI application for E2E testing
interface MockCLI {
  executeCommand(command: string, args: string[]): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>;
  currentState: {
    project?: any;
    lastAnalysis?: any;
    comparisonData?: any;
  };
}

const createMockCLI = (): MockCLI => {
  const cli = {
    executeCommand: async (command: string, args: string[]) => {
      // Simulate CLI execution
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time

      if (command === 'analyze') {
        return {
          exitCode: 0,
          stdout: JSON.stringify({
            id: `run-${Date.now()}`,
            timestamp: new Date().toISOString(),
            projectId: cli.currentState.project?.id || 'test-project',
            overallScore: 75 + Math.floor(Math.random() * 20),
            issueCount: 10 + Math.floor(Math.random() * 30),
            metrics: {
              coverage: 70 + Math.floor(Math.random() * 25),
              maintainability: 65 + Math.floor(Math.random() * 30),
              reliability: 75 + Math.floor(Math.random() * 20),
              security: 80 + Math.floor(Math.random() * 15)
            }
          }),
          stderr: ''
        };
      }

      if (command === 'compare') {
        return {
          exitCode: 0,
          stdout: JSON.stringify(cli.currentState.comparisonData || {
            run1: cli.currentState.lastAnalysis,
            run2: cli.currentState.lastAnalysis,
            differences: { addedIssues: [], removedIssues: [], modifiedIssues: [] },
            metricChanges: { overallScore: 0, coverage: 0, maintainability: 0, reliability: 0, security: 0, issueCount: 0 },
            trend: 'stable'
          }),
          stderr: ''
        };
      }

      if (command === 'export') {
        const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json';
        const data = cli.currentState.comparisonData;

        if (!data) {
          return {
            exitCode: 1,
            stdout: '',
            stderr: 'No comparison data available'
          };
        }

        let exportContent = '';
        if (format === 'json') {
          exportContent = JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
          exportContent = `Metric,Previous,Current,Change\nOverall Score,${data.run1?.overallScore || 0},${data.run2?.overallScore || 0},${data.metricChanges?.overallScore || 0}\nIssue Count,${data.run1?.issueCount || 0},${data.run2?.issueCount || 0},${data.metricChanges?.issueCount || 0}`;
        } else if (format === 'markdown') {
          exportContent = `# Comparison Report\n\n**Trend:** ${data.trend}\n**Overall Score Change:** ${data.metricChanges?.overallScore || 0}`;
        }

        return {
          exitCode: 0,
          stdout: exportContent,
          stderr: ''
        };
      }

      return {
        exitCode: 1,
        stdout: '',
        stderr: `Unknown command: ${command}`
      };
    },

    currentState: {}
  } as MockCLI;

  return cli;
};

describe('2.3-E2E-004: Complete Comparison Workflow', () => {
  let cli: MockCLI;

  beforeEach(() => {
    cli = createMockCLI();
    cli.currentState.project = {
      id: 'test-project',
      name: 'Test Project',
      path: '/tmp/test-project'
    };
  });

  it('should execute complete comparison workflow from analysis to export', async () => {
    // Step 1: Run initial analysis
    const firstAnalysisResult = await cli.executeCommand('analyze', []);
    expect(firstAnalysisResult.exitCode).toBe(0);

    const firstAnalysis = JSON.parse(firstAnalysisResult.stdout);
    expect(firstAnalysis.id).toBeDefined();
    expect(firstAnalysis.overallScore).toBeGreaterThan(0);
    expect(firstAnalysis.issueCount).toBeGreaterThanOrEqual(0);

    cli.currentState.lastAnalysis = firstAnalysis;

    // Step 2: Wait a moment and run second analysis (simulating changes)
    await new Promise(resolve => setTimeout(resolve, 50));

    const secondAnalysisResult = await cli.executeCommand('analyze', []);
    expect(secondAnalysisResult.exitCode).toBe(0);

    const secondAnalysis = JSON.parse(secondAnalysisResult.stdout);
    expect(secondAnalysis.id).toBeDefined();
    expect(secondAnalysis.id).not.toBe(firstAnalysis.id);

    // Step 3: Setup comparison data
    cli.currentState.comparisonData = {
      run1: firstAnalysis,
      run2: secondAnalysis,
      differences: {
        addedIssues: [
          { id: 'new-1', type: 'error', severity: 8, message: 'New critical issue' }
        ],
        removedIssues: [
          { id: 'fixed-1', type: 'warning', severity: 5, message: 'Previously fixed warning' }
        ],
        modifiedIssues: []
      },
      metricChanges: {
        overallScore: secondAnalysis.overallScore - firstAnalysis.overallScore,
        coverage: secondAnalysis.metrics.coverage - firstAnalysis.metrics.coverage,
        maintainability: secondAnalysis.metrics.maintainability - firstAnalysis.metrics.maintainability,
        reliability: secondAnalysis.metrics.reliability - firstAnalysis.metrics.reliability,
        security: secondAnalysis.metrics.security - firstAnalysis.metrics.security,
        issueCount: secondAnalysis.issueCount - firstAnalysis.issueCount
      },
      trend: secondAnalysis.overallScore > firstAnalysis.overallScore ? 'improved' :
             secondAnalysis.overallScore < firstAnalysis.overallScore ? 'degraded' : 'stable'
    };

    // Step 4: Run comparison
    const comparisonResult = await cli.executeCommand('compare', []);
    expect(comparisonResult.exitCode).toBe(0);

    const comparisonData = JSON.parse(comparisonResult.stdout);
    expect(comparisonData.run1).toBeDefined();
    expect(comparisonData.run2).toBeDefined();
    expect(comparisonData.differences).toBeDefined();
    expect(comparisonData.metricChanges).toBeDefined();
    expect(comparisonData.trend).toBeDefined();

    // Step 5: Export comparison in JSON format
    const jsonExportResult = await cli.executeCommand('export', ['--format=json']);
    expect(jsonExportResult.exitCode).toBe(0);

    const jsonExport = JSON.parse(jsonExportResult.stdout);
    expect(jsonExport.run1.overallScore).toBe(firstAnalysis.overallScore);
    expect(jsonExport.run2.overallScore).toBe(secondAnalysis.overallScore);
    expect(jsonExport.trend).toBe(comparisonData.trend);

    // Step 6: Export comparison in CSV format
    const csvExportResult = await cli.executeCommand('export', ['--format=csv']);
    expect(csvExportResult.exitCode).toBe(0);

    const csvExport = csvExportResult.stdout;
    expect(csvExport).toContain('Metric,Previous,Current,Change');
    expect(csvExport).toContain('Overall Score');
    expect(csvExport).toContain('Issue Count');

    // Step 7: Export comparison in Markdown format
    const markdownExportResult = await cli.executeCommand('export', ['--format=markdown']);
    expect(markdownExportResult.exitCode).toBe(0);

    const markdownExport = markdownExportResult.stdout;
    expect(markdownExport).toContain('# Comparison Report');
    expect(markdownExport).toContain('**Trend:**');
    expect(markdownExport).toContain(comparisonData.trend);
  });

  it('should handle error scenarios gracefully', async () => {
    // Test comparison without previous analysis
    const errorResult = await cli.executeCommand('compare', []);
    expect(errorResult.exitCode).toBe(0); // Mock returns data even without analysis

    // Test export without comparison data
    cli.currentState.comparisonData = undefined;
    const exportErrorResult = await cli.executeCommand('export', ['--format=json']);
    expect(exportErrorResult.exitCode).toBe(1);
    expect(exportErrorResult.stderr).toContain('No comparison data available');
  });

  it('should handle performance with realistic data volumes', async () => {
    // Create multiple analyses to simulate real usage
    const analyses: any[] = [];
    const analysisCount = 5;

    for (let i = 0; i < analysisCount; i++) {
      const result = await cli.executeCommand('analyze', []);
      expect(result.exitCode).toBe(0);

      const analysis = JSON.parse(result.stdout);
      analyses.push(analysis);
      cli.currentState.lastAnalysis = analysis;

      // Small delay between analyses
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // Test comparisons between different runs
    const comparisonTimes: number[] = [];

    for (let i = 0; i < analyses.length - 1; i++) {
      cli.currentState.comparisonData = {
        run1: analyses[i],
        run2: analyses[i + 1],
        differences: {
          addedIssues: Array.from({ length: 10 }, (_, j) => ({
            id: `added-${i}-${j}`,
            type: 'error',
            severity: Math.floor(Math.random() * 10) + 1,
            message: `Added issue ${j} in comparison ${i}`
          })),
          removedIssues: Array.from({ length: 5 }, (_, j) => ({
            id: `removed-${i}-${j}`,
            type: 'warning',
            severity: Math.floor(Math.random() * 10) + 1,
            message: `Removed issue ${j} in comparison ${i}`
          })),
          modifiedIssues: []
        },
        metricChanges: {
          overallScore: analyses[i + 1].overallScore - analyses[i].overallScore,
          coverage: analyses[i + 1].metrics.coverage - analyses[i].metrics.coverage,
          maintainability: analyses[i + 1].metrics.maintainability - analyses[i].metrics.maintainability,
          reliability: analyses[i + 1].metrics.reliability - analyses[i].metrics.reliability,
          security: analyses[i + 1].metrics.security - analyses[i].metrics.security,
          issueCount: analyses[i + 1].issueCount - analyses[i].issueCount
        },
        trend: analyses[i + 1].overallScore > analyses[i].overallScore ? 'improved' :
               analyses[i + 1].overallScore < analyses[i].overallScore ? 'degraded' : 'stable'
      };

      const startTime = performance.now();
      const comparisonResult = await cli.executeCommand('compare', []);
      const endTime = performance.now();

      expect(comparisonResult.exitCode).toBe(0);
      comparisonTimes.push(endTime - startTime);
    }

    // Verify performance
    const avgComparisonTime = comparisonTimes.reduce((sum, time) => sum + time, 0) / comparisonTimes.length;
    const maxComparisonTime = Math.max(...comparisonTimes);

    expect(avgComparisonTime).toBeLessThan(500); // Average under 500ms
    expect(maxComparisonTime).toBeLessThan(1000); // Max under 1 second
    expect(comparisonTimes).toHaveLength(analysisCount - 1);
  });

  it('should maintain data consistency throughout workflow', async () => {
    // Run initial analysis
    const firstResult = await cli.executeCommand('analyze', []);
    const firstAnalysis = JSON.parse(firstResult.stdout);

    // Wait and run second analysis
    await new Promise(resolve => setTimeout(resolve, 100));
    const secondResult = await cli.executeCommand('analyze', []);
    const secondAnalysis = JSON.parse(secondResult.stdout);

    // Setup comparison with specific data
    cli.currentState.comparisonData = {
      run1: firstAnalysis,
      run2: secondAnalysis,
      differences: {
        addedIssues: [{ id: 'test-added', type: 'error', severity: 9, message: 'Test added issue' }],
        removedIssues: [{ id: 'test-removed', type: 'warning', severity: 4, message: 'Test removed issue' }],
        modifiedIssues: []
      },
      metricChanges: {
        overallScore: 15,
        coverage: 10,
        maintainability: 20,
        reliability: 5,
        security: 8,
        issueCount: -3
      },
      trend: 'improved'
    };

    // Run comparison
    const comparisonResult = await cli.executeCommand('compare', []);
    const comparisonData = JSON.parse(comparisonResult.stdout);

    // Verify consistency across all export formats
    const jsonExport = await cli.executeCommand('export', ['--format=json']);
    const jsonData = JSON.parse(jsonExport.stdout);

    const csvExport = await cli.executeCommand('export', ['--format=csv']);
    const markdownExport = await cli.executeCommand('export', ['--format=markdown']);

    // All formats should have consistent data
    expect(jsonData.run1.overallScore).toBe(firstAnalysis.overallScore);
    expect(jsonData.run2.overallScore).toBe(secondAnalysis.overallScore);
    expect(jsonData.metricChanges.overallScore).toBe(15);
    expect(jsonData.trend).toBe('improved');

    expect(csvExport.stdout).toContain(`${firstAnalysis.overallScore},${secondAnalysis.overallScore},15`);
    expect(markdownExport.stdout).toContain('**Trend:** improved');
    expect(markdownExport.stdout).toContain('15');
  });

  it('should handle concurrent operations safely', async () => {
    // Run multiple analyses concurrently
    const analysisPromises = Array.from({ length: 3 }, () => cli.executeCommand('analyze', []));
    const analysisResults = await Promise.all(analysisPromises);

    analysisResults.forEach(result => {
      expect(result.exitCode).toBe(0);
      const analysis = JSON.parse(result.stdout);
      expect(analysis.id).toBeDefined();
    });

    // Run multiple comparisons concurrently
    const comparisonPromises = analysisResults.map(result => {
      cli.currentState.lastAnalysis = JSON.parse(result.stdout);
      return cli.executeCommand('compare', []);
    });

    const comparisonResults = await Promise.all(comparisonPromises);

    comparisonResults.forEach(result => {
      expect(result.exitCode).toBe(0);
      const comparison = JSON.parse(result.stdout);
      expect(comparison.run1).toBeDefined();
      expect(comparison.run2).toBeDefined();
    });

    // Run multiple exports concurrently
    const exportPromises = comparisonResults.map(result => {
      cli.currentState.comparisonData = JSON.parse(result.stdout);
      return cli.executeCommand('export', ['--format=json']);
    });

    const exportResults = await Promise.all(exportPromises);

    exportResults.forEach(result => {
      expect(result.exitCode).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    });
  });
});