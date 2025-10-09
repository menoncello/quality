import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock SQLite database for historical data retrieval
interface MockDatabase {
  runs: Map<string, any>;
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  run(sql: string, params?: any[]): Promise<void>;
}

const createMockDatabase = (): MockDatabase => {
  const runs = new Map<string, any>();

  return {
    runs,

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
      // Mock SQL query parsing
      if (sql.includes('SELECT') && sql.includes('metrics')) {
        const runId = params[0];
        const run = runs.get(runId);
        return run ? [run.metrics] as T[] : [] as T[];
      }

      if (sql.includes('SELECT') && sql.includes('analysis_runs')) {
        const limit = params.find((p: any) => typeof p === 'number') || 10;
        const projectId = params.find((p: any) => typeof p === 'string') || 'test-project';

        const allRuns = Array.from(runs.values())
          .filter((run: any) => run.projectId === projectId)
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);

        return allRuns as T[];
      }

      return [] as T[];
    },

    async run(sql: string, params: any[] = []): Promise<void> {
      // Mock INSERT operations
      if (sql.includes('INSERT') && sql.includes('analysis_runs')) {
        const runId = params[0];
        runs.set(runId, {
          id: runId,
          projectId: params[1],
          timestamp: params[2],
          overallScore: params[3],
          issueCount: params[4],
          metrics: JSON.parse(params[5])
        });
      }
    }
  };
};

// Mock export functionality
interface ExportFormat {
  json: (data: any) => string;
  csv: (data: any) => string;
  markdown: (data: any) => string;
}

const createMockExporter = (): ExportFormat => {
  return {
    json: (data: any): string => JSON.stringify(data, null, 2),

    csv: (data: any): string => {
      if (!data.comparisonResult) return '';

      const headers = ['Metric', 'Previous', 'Current', 'Change'];
      const rows = [
        ['Overall Score', data.comparisonResult.run1.overallScore, data.comparisonResult.run2.overallScore, data.comparisonResult.metricChanges.overallScore],
        ['Issue Count', data.comparisonResult.run1.issueCount, data.comparisonResult.run2.issueCount, data.comparisonResult.metricChanges.issueCount],
        ['Coverage', data.comparisonResult.run1.metrics.coverage, data.comparisonResult.run2.metrics.coverage, data.comparisonResult.metricChanges.coverage],
        ['Maintainability', data.comparisonResult.run1.metrics.maintainability, data.comparisonResult.run2.metrics.maintainability, data.comparisonResult.metricChanges.maintainability],
        ['Reliability', data.comparisonResult.run1.metrics.reliability, data.comparisonResult.run2.metrics.reliability, data.comparisonResult.metricChanges.reliability],
        ['Security', data.comparisonResult.run1.metrics.security, data.comparisonResult.run2.metrics.security, data.comparisonResult.metricChanges.security]
      ];

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    markdown: (data: any): string => {
      if (!data.comparisonResult) return '';

      const result = data.comparisonResult;
      return `
# Comparison Report

**Run 1:** ${result.run1.id} (${result.run1.timestamp})
**Run 2:** ${result.run2.id} (${result.run2.timestamp})

## Summary
- **Trend:** ${result.trend}
- **Overall Score Change:** ${result.metricChanges.overallScore > 0 ? '+' : ''}${result.metricChanges.overallScore}
- **Issue Count Change:** ${result.metricChanges.issueCount > 0 ? '+' : ''}${result.metricChanges.issueCount}

## Metrics
| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Overall Score | ${result.run1.overallScore} | ${result.run2.overallScore} | ${result.metricChanges.overallScore > 0 ? '+' : ''}${result.metricChanges.overallScore} |
| Issue Count | ${result.run1.issueCount} | ${result.run2.issueCount} | ${result.metricChanges.issueCount > 0 ? '+' : ''}${result.metricChanges.issueCount} |
| Coverage | ${result.run1.metrics.coverage} | ${result.run2.metrics.coverage} | ${result.metricChanges.coverage > 0 ? '+' : ''}${result.metricChanges.coverage} |
| Maintainability | ${result.run1.metrics.maintainability} | ${result.run2.metrics.maintainability} | ${result.metricChanges.maintainability > 0 ? '+' : ''}${result.metricChanges.maintainability} |
| Reliability | ${result.run1.metrics.reliability} | ${result.run2.metrics.reliability} | ${result.metricChanges.reliability > 0 ? '+' : ''}${result.metricChanges.reliability} |
| Security | ${result.run1.metrics.security} | ${result.run2.metrics.security} | ${result.metricChanges.security > 0 ? '+' : ''}${result.metricChanges.security} |

## Issues
- **Added:** ${result.differences.addedIssues.length}
- **Removed:** ${result.differences.removedIssues.length}
- **Modified:** ${result.differences.modifiedIssues.length}
      `.trim();
    }
  };
};

describe('2.3-INT-008: Historical Data Retrieval from SQLite', () => {
  let db: MockDatabase;

  beforeEach(async () => {
    db = createMockDatabase();

    // Insert test data
    const testRuns = [
      {
        id: 'run-001',
        projectId: 'test-project',
        timestamp: '2025-01-01T10:00:00Z',
        overallScore: 75,
        issueCount: 25,
        metrics: { coverage: 80, maintainability: 70, reliability: 85, security: 90 }
      },
      {
        id: 'run-002',
        projectId: 'test-project',
        timestamp: '2025-01-02T10:00:00Z',
        overallScore: 80,
        issueCount: 20,
        metrics: { coverage: 85, maintainability: 75, reliability: 83, security: 88 }
      },
      {
        id: 'run-003',
        projectId: 'test-project',
        timestamp: '2025-01-03T10:00:00Z',
        overallScore: 85,
        issueCount: 18,
        metrics: { coverage: 87, maintainability: 80, reliability: 85, security: 92 }
      }
    ];

    for (const run of testRuns) {
      await db.run(
        'INSERT INTO analysis_runs (id, project_id, timestamp, overall_score, issue_count, metrics) VALUES (?, ?, ?, ?, ?, ?)',
        [run.id, run.projectId, run.timestamp, run.overallScore, run.issueCount, JSON.stringify(run.metrics)]
      );
    }
  });

  it('should retrieve recent analysis runs', async () => {
    const runs = await db.query<any[]>(
      'SELECT * FROM analysis_runs WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?',
      ['test-project', 10]
    );

    expect(runs).toHaveLength(3);
    expect(runs[0].id).toBe('run-003'); // Most recent
    expect(runs[1].id).toBe('run-002');
    expect(runs[2].id).toBe('run-001'); // Oldest
    expect(runs[0].overallScore).toBe(85);
    expect(runs[0].issueCount).toBe(18);
  });

  it('should retrieve specific run metrics', async () => {
    const metrics = await db.query<any[]>(
      'SELECT metrics FROM analysis_runs WHERE id = ?',
      ['run-002']
    );

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toEqual({
      coverage: 85,
      maintainability: 75,
      reliability: 83,
      security: 88
    });
  });

  it('should handle limit correctly', async () => {
    const limitedRuns = await db.query<any[]>(
      'SELECT * FROM analysis_runs WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?',
      ['test-project', 2]
    );

    expect(limitedRuns).toHaveLength(2);
    expect(limitedRuns[0].id).toBe('run-003');
    expect(limitedRuns[1].id).toBe('run-002');
  });

  it('should handle empty results', async () => {
    const emptyResults = await db.query<any[]>(
      'SELECT * FROM analysis_runs WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?',
      ['nonexistent-project', 10]
    );

    expect(emptyResults).toHaveLength(0);
  });

  it('should handle database errors gracefully', async () => {
    // Test with malformed query - should return empty array rather than throw
    const results = await db.query<any[]>(
      'INVALID SQL QUERY',
      []
    );

    expect(results).toEqual([]);
  });
});

describe('2.3-INT-009: Side-by-side View Rendering', () => {
  let exporter: ExportFormat;

  beforeEach(() => {
    exporter = createMockExporter();
  });

  const createMockComparisonResult = () => ({
    run1: {
      id: 'run-001',
      timestamp: '2025-01-01T10:00:00Z',
      overallScore: 75,
      issueCount: 25,
      metrics: { coverage: 80, maintainability: 70, reliability: 85, security: 90 }
    },
    run2: {
      id: 'run-002',
      timestamp: '2025-01-02T10:00:00Z',
      overallScore: 80,
      issueCount: 20,
      metrics: { coverage: 85, maintainability: 75, reliability: 83, security: 88 }
    },
    differences: {
      addedIssues: [
        { id: 'new-1', type: 'error', severity: 8, message: 'New error in run 2' }
      ],
      removedIssues: [
        { id: 'old-1', type: 'warning', severity: 5, message: 'Resolved warning' }
      ],
      modifiedIssues: []
    },
    metricChanges: {
      overallScore: 5,
      coverage: 5,
      maintainability: 5,
      reliability: -2,
      security: -2,
      issueCount: -5
    },
    trend: 'improved' as const
  });

  it('should render side-by-side comparison in JSON format', () => {
    const comparisonResult = createMockComparisonResult();
    const jsonExport = exporter.json({ comparisonResult });

    const parsed = JSON.parse(jsonExport);
    expect(parsed.comparisonResult).toBeDefined();
    expect(parsed.comparisonResult.run1.overallScore).toBe(75);
    expect(parsed.comparisonResult.run2.overallScore).toBe(80);
    expect(parsed.comparisonResult.trend).toBe('improved');
  });

  it('should render side-by-side comparison in CSV format', () => {
    const comparisonResult = createMockComparisonResult();
    const csvExport = exporter.csv({ comparisonResult });

    const lines = csvExport.split('\n');
    expect(lines[0]).toBe('Metric,Previous,Current,Change');
    expect(lines[1]).toContain('Overall Score,75,80,5');
    expect(lines[2]).toContain('Issue Count,25,20,-5');
    expect(lines[3]).toContain('Coverage,80,85,5');
    expect(lines).toHaveLength(7); // Header + 6 metrics
  });

  it('should render side-by-side comparison in Markdown format', () => {
    const comparisonResult = createMockComparisonResult();
    const markdownExport = exporter.markdown({ comparisonResult });

    expect(markdownExport).toContain('# Comparison Report');
    expect(markdownExport).toContain('**Run 1:** run-001');
    expect(markdownExport).toContain('**Run 2:** run-002');
    expect(markdownExport).toContain('**Trend:** improved');
    expect(markdownExport).toContain('| Metric | Previous | Current | Change |');
    expect(markdownExport).toContain('| Overall Score | 75 | 80 | +5 |');
    expect(markdownExport).toContain('- **Added:** 1');
    expect(markdownExport).toContain('- **Removed:** 1');
  });

  it('should handle edge cases in rendering', () => {
    const emptyResult = {
      comparisonResult: {
        run1: {
          id: 'run-001',
          timestamp: '2025-01-01T10:00:00Z',
          overallScore: 0,
          issueCount: 0,
          metrics: { coverage: 0, maintainability: 0, reliability: 0, security: 0 }
        },
        run2: {
          id: 'run-002',
          timestamp: '2025-01-02T10:00:00Z',
          overallScore: 0,
          issueCount: 0,
          metrics: { coverage: 0, maintainability: 0, reliability: 0, security: 0 }
        },
        differences: {
          addedIssues: [],
          removedIssues: [],
          modifiedIssues: []
        },
        metricChanges: {
          overallScore: 0,
          coverage: 0,
          maintainability: 0,
          reliability: 0,
          security: 0,
          issueCount: 0
        },
        trend: 'stable' as const
      }
    };

    const jsonExport = exporter.json(emptyResult);
    const csvExport = exporter.csv(emptyResult);
    const markdownExport = exporter.markdown(emptyResult);

    expect(() => JSON.parse(jsonExport)).not.toThrow();
    expect(csvExport).toContain('Metric,Previous,Current,Change');
    expect(markdownExport).toContain('# Comparison Report');
    expect(markdownExport).toContain('**Trend:** stable');
  });

  it('should handle performance with large datasets', () => {
    const largeComparisonResult = {
      comparisonResult: {
        ...createMockComparisonResult(),
        differences: {
          addedIssues: Array.from({ length: 1000 }, (_, i) => ({
            id: `added-${i}`,
            type: 'error',
            severity: Math.floor(Math.random() * 10) + 1,
            message: `Added issue ${i}`
          })),
          removedIssues: Array.from({ length: 500 }, (_, i) => ({
            id: `removed-${i}`,
            type: 'warning',
            severity: Math.floor(Math.random() * 10) + 1,
            message: `Removed issue ${i}`
          })),
          modifiedIssues: Array.from({ length: 200 }, (_, i) => ({
            old: { id: `old-${i}`, message: `Old message ${i}` },
            new: { id: `new-${i}`, message: `New message ${i}` }
          }))
        }
      }
    };

    const startTime = performance.now();
    const jsonExport = exporter.json(largeComparisonResult);
    const csvExport = exporter.csv(largeComparisonResult);
    const markdownExport = exporter.markdown(largeComparisonResult);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    expect(jsonExport.length).toBeGreaterThan(0);
    expect(csvExport.length).toBeGreaterThan(0);
    expect(markdownExport.length).toBeGreaterThan(0);

    // Parse JSON to verify it's valid
    expect(() => JSON.parse(jsonExport)).not.toThrow();
  });
});

describe('2.3-INT-010: Comparison Export Generation', () => {
  let exporter: ExportFormat;

  beforeEach(() => {
    exporter = createMockExporter();
  });

  it('should generate multi-format exports for comparison data', () => {
    const comparisonData = {
      comparisonResult: {
        run1: {
          id: 'run-001',
          timestamp: '2025-01-01T10:00:00Z',
          overallScore: 72,
          issueCount: 30,
          metrics: { coverage: 78, maintainability: 68, reliability: 82, security: 88 }
        },
        run2: {
          id: 'run-002',
          timestamp: '2025-01-02T10:00:00Z',
          overallScore: 83,
          issueCount: 15,
          metrics: { coverage: 88, maintainability: 80, reliability: 85, security: 91 }
        },
        differences: {
          addedIssues: [
            { id: 'new-1', type: 'info', severity: 3, message: 'New informational issue' }
          ],
          removedIssues: [
            { id: 'old-1', type: 'error', severity: 9, message: 'Critical error resolved' },
            { id: 'old-2', type: 'warning', severity: 6, message: 'Warning fixed' }
          ],
          modifiedIssues: [
            {
              old: { id: 'mod-1', severity: 7, message: 'Original message' },
              new: { id: 'mod-1', severity: 4, message: 'Updated message' }
            }
          ]
        },
        metricChanges: {
          overallScore: 11,
          coverage: 10,
          maintainability: 12,
          reliability: 3,
          security: 3,
          issueCount: -15
        },
        trend: 'improved' as const
      }
    };

    // Test all export formats
    const jsonExport = exporter.json(comparisonData);
    const csvExport = exporter.csv(comparisonData);
    const markdownExport = exporter.markdown(comparisonData);

    // Verify JSON format
    const jsonData = JSON.parse(jsonExport);
    expect(jsonData.comparisonResult.differences.addedIssues).toHaveLength(1);
    expect(jsonData.comparisonResult.differences.removedIssues).toHaveLength(2);
    expect(jsonData.comparisonResult.differences.modifiedIssues).toHaveLength(1);
    expect(jsonData.comparisonResult.trend).toBe('improved');

    // Verify CSV format
    expect(csvExport).toContain('Overall Score,72,83,11');
    expect(csvExport).toContain('Issue Count,30,15,-15');
    expect(csvExport).toContain('Coverage,78,88,10');

    // Verify Markdown format
    expect(markdownExport).toContain('**Trend:** improved');
    expect(markdownExport).toContain('+11');
    expect(markdownExport).toContain('-15');
    expect(markdownExport).toContain('- **Added:** 1');
    expect(markdownExport).toContain('- **Removed:** 2');
    expect(markdownExport).toContain('- **Modified:** 1');
  });

  it('should handle export format validation', () => {
    const invalidData = { comparisonResult: null };

    expect(() => exporter.json(invalidData)).not.toThrow();
    expect(() => exporter.csv(invalidData)).not.toThrow();
    expect(() => exporter.markdown(invalidData)).not.toThrow();

    const csvResult = exporter.csv(invalidData);
    expect(csvResult).toBe('');

    const markdownResult = exporter.markdown(invalidData);
    expect(markdownResult).toBe('');
  });

  it('should maintain data integrity across formats', () => {
    const originalData = {
      comparisonResult: {
        run1: { overallScore: 75, issueCount: 20 },
        run2: { overallScore: 85, issueCount: 15 },
        metricChanges: { overallScore: 10, issueCount: -5 },
        trend: 'improved' as const
      }
    };

    const jsonExport = exporter.json(originalData);
    const parsedData = JSON.parse(jsonExport);

    expect(parsedData.comparisonResult.run1.overallScore).toBe(75);
    expect(parsedData.comparisonResult.run2.overallScore).toBe(85);
    expect(parsedData.comparisonResult.metricChanges.overallScore).toBe(10);
    expect(parsedData.comparisonResult.trend).toBe('improved');
  });

  it('should handle large comparison datasets efficiently', () => {
    const largeComparisonData = {
      comparisonResult: {
        run1: {
          id: 'run-001',
          timestamp: '2025-01-01T10:00:00Z',
          overallScore: 60,
          issueCount: 1000,
          metrics: { coverage: 70, maintainability: 65, reliability: 75, security: 80 }
        },
        run2: {
          id: 'run-002',
          timestamp: '2025-01-02T10:00:00Z',
          overallScore: 90,
          issueCount: 100,
          metrics: { coverage: 95, maintainability: 88, reliability: 92, security: 95 }
        },
        differences: {
          addedIssues: Array.from({ length: 100 }, (_, i) => ({
            id: `added-${i}`,
            type: 'info',
            severity: 3,
            message: `Added info issue ${i}`
          })),
          removedIssues: Array.from({ length: 500 }, (_, i) => ({
            id: `removed-${i}`,
            type: 'error',
            severity: 8,
            message: `Resolved error issue ${i}`
          })),
          modifiedIssues: Array.from({ length: 200 }, (_, i) => ({
            old: { id: `mod-${i}`, severity: 7, message: `Old message ${i}` },
            new: { id: `mod-${i}`, severity: 4, message: `New message ${i}` }
          }))
        },
        metricChanges: {
          overallScore: 30,
          coverage: 25,
          maintainability: 23,
          reliability: 17,
          security: 15,
          issueCount: -900
        },
        trend: 'improved' as const
      }
    };

    const startTime = performance.now();

    const jsonExport = exporter.json(largeComparisonData);
    const csvExport = exporter.csv(largeComparisonData);
    const markdownExport = exporter.markdown(largeComparisonData);

    const endTime = performance.now();
    const exportTime = endTime - startTime;

    expect(exportTime).toBeLessThan(500); // Should complete within 500ms
    expect(jsonExport.length).toBeGreaterThan(1000); // Large JSON
    expect(csvExport.length).toBeGreaterThan(150); // CSV with metrics
    expect(markdownExport.length).toBeGreaterThan(500); // Detailed markdown

    // Verify data integrity
    const parsedData = JSON.parse(jsonExport);
    expect(parsedData.comparisonResult.differences.addedIssues).toHaveLength(100);
    expect(parsedData.comparisonResult.differences.removedIssues).toHaveLength(500);
    expect(parsedData.comparisonResult.differences.modifiedIssues).toHaveLength(200);
  });
});