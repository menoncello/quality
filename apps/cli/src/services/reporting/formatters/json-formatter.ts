/**
 * JSON Report Formatter
 * Generates comprehensive JSON reports with full analysis data
 */

import type {
  ReportTemplate,
  ReportConfiguration,
  ExecutiveSummary,
  TrendAnalysis
} from '../report-generator';

interface ToolResult {
  toolName: string;
  status: string;
  executionTime: number;
  metrics: { score: number };
  issues: Issue[];
  coverage?: unknown;
}

interface Issue {
  id: string;
  type: string;
  severity: string;
  toolName: string;
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  message: string;
  ruleId?: string;
  ruleUrl?: string;
  score: number;
  fixable: boolean;
  suggestion?: string;
  context?: unknown;
  source?: unknown;
}

interface AnalysisResult {
  projectId: string;
  timestamp: string;
  duration: number;
  overallScore: number;
  toolResults?: ToolResult[];
  aiPrompts?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    priority: string;
    issues: Issue[];
  }>;
}

interface Metrics {
  coverage?: {
    lines: { percentage: number };
    functions: { percentage: number };
    branches: { percentage: number };
    statements: { percentage: number };
  };
  performance?: unknown;
  complexity?: unknown;
  maintainability?: unknown;
  reliability?: unknown;
  security?: unknown;
  totalIssues?: number;
  errorCount?: number;
  warningCount?: number;
  infoCount?: number;
  fixableCount?: number;
}

interface HistoricalDataPoint {
  timestamp: Date;
  overallScore: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
  toolResults?: unknown;
}

interface ReportData {
  metadata: {
    title: string;
    description?: string;
    version: string;
    generatedAt: string;
    reportId: string;
  };
  analysisResult: AnalysisResult;
  issues: Issue[];
  metrics: Metrics;
  executiveSummary?: ExecutiveSummary;
  trendAnalysis?: TrendAnalysis;
  historicalData?: HistoricalDataPoint[];
  template: ReportTemplate;
  configuration: ReportConfiguration;
}

export class JSONFormatter {
  /**
   * Format report data as JSON
   */
  async format(data: ReportData, template: ReportTemplate): Promise<string> {
    const reportData = this.buildReportData(data, template);

    try {
      return JSON.stringify(reportData, null, 2);
    } catch (error) {
      throw new Error(`Failed to generate JSON report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build comprehensive JSON report data structure
   */
  private buildReportData(data: ReportData, template: ReportTemplate): Record<string, unknown> {
    const {
      metadata,
      analysisResult,
      issues,
      metrics,
      executiveSummary,
      trendAnalysis,
      historicalData,
      configuration,
    } = data;

    const report: Record<string, unknown> = {
      $schema: 'https://dev-quality-cli.com/schemas/report/v1.json',
      metadata: {
        ...metadata,
        format: 'json',
        template: {
          id: template.id,
          name: template.name,
          type: template.templateType,
        },
        configuration: {
          id: configuration.id,
          name: configuration.name,
          filters: configuration.filters,
        },
        generator: {
          name: 'DevQuality CLI',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      },
      summary: {
        project: {
          id: analysisResult.projectId,
          analysisDate: analysisResult.timestamp,
          duration: analysisResult.duration,
          overallScore: analysisResult.overallScore,
        },
        issues: {
          total: issues.length,
          errors: issues.filter(i => i.type === 'error').length,
          warnings: issues.filter(i => i.type === 'warning').length,
          info: issues.filter(i => i.type === 'info').length,
          fixable: issues.filter(i => i.fixable).length,
        },
        tools: analysisResult.toolResults?.map(tool => ({
          name: tool.toolName,
          status: tool.status,
          executionTime: tool.executionTime,
          score: tool.metrics.score,
          issuesCount: tool.issues.length,
        })),
        metrics: this.includeEnabledSections(metrics, template),
      },
    };

    // Include executive summary if enabled
    if (executiveSummary && this.sectionEnabled(template, 'summary')) {
      report.executiveSummary = executiveSummary;
    }

    // Include detailed issues if enabled
    if (this.sectionEnabled(template, 'issues')) {
      report.issues = issues.map(issue => this.formatIssue(issue));
    }

    // Include tool results if enabled
    if (this.sectionEnabled(template, 'metrics')) {
      report.toolResults = analysisResult.toolResults?.map(tool => ({
        toolName: tool.toolName,
        status: tool.status,
        executionTime: tool.executionTime,
        metrics: tool.metrics,
        issues: tool.issues.map(issue => this.formatIssue(issue)),
        coverage: tool.coverage,
      }));
    }

    // Include trend analysis if available
    if (trendAnalysis && this.sectionEnabled(template, 'trends')) {
      report.trends = {
        analysis: trendAnalysis,
        historicalData: historicalData?.map(data => ({
          timestamp: data.timestamp.toISOString(),
          overallScore: data.overallScore,
          totalIssues: data.totalIssues,
          breakdown: {
            errors: data.errorCount,
            warnings: data.warningCount,
            info: data.infoCount,
            fixable: data.fixableCount,
          },
          toolResults: data.toolResults,
        })),
      };
    }

    // Include AI prompts if available
    if (analysisResult.aiPrompts && analysisResult.aiPrompts.length > 0) {
      report.aiPrompts = analysisResult.aiPrompts.map(prompt => ({
        id: prompt.id,
        type: prompt.type,
        title: prompt.title,
        description: prompt.description,
        priority: prompt.priority,
        issuesCount: prompt.issues.length,
      }));
    }

    // Include custom sections from template
    const customSections = template.sections.filter(section => section.type === 'custom' && section.enabled);
    if (customSections.length > 0) {
      report.customSections = customSections.map(section => ({
        id: section.id,
        name: section.name,
        order: section.order,
        config: section.config,
      }));
    }

    return report;
  }

  /**
   * Format issue for JSON output
   */
  private formatIssue(issue: Issue): Record<string, unknown> {
    return {
      id: issue.id,
      type: issue.type,
      severity: issue.type,
      toolName: issue.toolName,
      location: {
        file: issue.filePath,
        line: issue.lineNumber,
        column: issue.columnNumber,
      },
      message: issue.message,
      rule: {
        id: issue.ruleId,
        url: issue.ruleUrl,
      },
      score: issue.score,
      fixable: issue.fixable,
      suggestion: issue.suggestion,
      context: issue.context,
      source: issue.source,
    };
  }

  /**
   * Include only enabled metric sections
   */
  private includeEnabledSections(metrics: Metrics, template: ReportTemplate): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (this.sectionEnabled(template, 'metrics')) {
      result.coverage = metrics.coverage;
      result.performance = metrics.performance;
      result.complexity = metrics.complexity;
      result.maintainability = metrics.maintainability;
      result.reliability = metrics.reliability;
      result.security = metrics.security;
    }

    return result;
  }

  /**
   * Check if a section is enabled in the template
   */
  private sectionEnabled(template: ReportTemplate, sectionType: string): boolean {
    return template.sections.some(section =>
      section.type === sectionType && section.enabled
    );
  }
}