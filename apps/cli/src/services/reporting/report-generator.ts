/**
 * Comprehensive Report Generator Service
 * Extends existing export functionality with advanced reporting capabilities
 */

import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

import type { AnalysisResult, Issue, CoverageData } from '../../types/analysis';
import type { DashboardMetrics } from '../../types/dashboard';
// import type { ExportFormat, ExportOptions } from '../../types/export'; // Not used

import { ExportService } from '../export/export-service';
import { JSONFormatter } from './formatters/json-formatter';
import { HTMLFormatter } from './formatters/html-formatter';
import { MarkdownFormatter } from './formatters/markdown-formatter';
import { PDFFormatter } from './formatters/pdf-formatter';
import { TemplateService, type TemplateDefinition } from './template-service';
import type { Metrics, ReportData } from './types';

// Enhanced interfaces for comprehensive reporting
export interface ReportConfiguration {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  format: ReportFormat;
  schedule?: ReportSchedule;
  recipients: ReportRecipient[];
  filters: ReportFilters;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  sections: ReportSection[];
  styles?: TemplateStyles;
  customFields?: Record<string, unknown>;
  templateType: 'builtin' | 'custom';
  format: ReportFormat;
  content?: string;
  version?: string;
  author?: string;
  tags?: string[];
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'summary' | 'metrics' | 'issues' | 'trends' | 'charts' | 'custom';
  enabled: boolean;
  order: number;
  config?: Record<string, unknown>;
}

export interface TemplateStyles {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: string;
  logo?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface ReportSchedule {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  timezone?: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface ReportRecipient {
  id: string;
  type: 'email' | 'slack' | 'teams' | 'webhook';
  address: string;
  isActive: boolean;
  config?: Record<string, unknown>;
}

export interface ReportFilters {
  severity?: ('error' | 'warning' | 'info')[];
  tools?: string[];
  scoreRange?: { min: number; max: number };
  fixableOnly?: boolean;
  dateRange?: { start: Date; end: Date };
  customFilters?: Record<string, unknown>;
}

export type ReportFormat = 'json' | 'html' | 'markdown' | 'pdf';

export interface ReportRequest {
  configuration: ReportConfiguration;
  analysisResult: AnalysisResult;
  issues: Issue[];
  metrics: DashboardMetrics;
  historicalData?: HistoricalData[];
  onProgress?: (progress: ReportProgress) => void;
}

export interface ReportResult {
  success: boolean;
  reportId: string;
  configurationId: string;
  outputPath: string;
  format: ReportFormat;
  size: number;
  generatedAt: Date;
  duration: number;
  error?: string;
  metadata: ReportMetadata;
}

export interface ReportProgress {
  reportId: string;
  currentStep: string;
  percentage: number;
  estimatedTimeRemaining?: number;
  bytesWritten?: number;
  currentOperation?: string;
}

export interface ReportMetadata {
  title: string;
  description?: string;
  author?: string;
  version: string;
  tags?: string[];
  category?: string;
  sensitivity?: 'public' | 'internal' | 'confidential';
}

export interface HistoricalData {
  timestamp: Date;
  overallScore: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
  toolResults: Array<{
    toolName: string;
    score: number;
    issuesCount: number;
  }>;
}

export interface TrendAnalysis {
  period: string;
  direction: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  confidence: number;
  insights: string[];
}

export interface ExecutiveSummary {
  overview: string;
  keyMetrics: Array<{
    label: string;
    value: string | number;
    trend: 'up' | 'down' | 'stable';
    significance: 'high' | 'medium' | 'low';
  }>;
  priorities: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Main Report Generator Service
 * Orchestrates comprehensive report generation with multiple formats and templates
 */
export class ReportGenerator {
  private exportService: ExportService;
  private formatters: Map<
    ReportFormat,
    { format(data: ReportData, template: TemplateDefinition | ReportTemplate): Promise<string> }
  >;
  private templateService: TemplateService;
  private activeReports: Map<string, ReportProgress>;

  constructor() {
    this.exportService = new ExportService();
    this.formatters = new Map();
    this.templateService = new TemplateService();
    this.activeReports = new Map();

    this.initializeFormatters();
  }

  /**
   * Initialize format-specific formatters
   */
  private initializeFormatters(): void {
    this.formatters.set('json', new JSONFormatter());
    this.formatters.set('html', new HTMLFormatter());
    this.formatters.set('markdown', new MarkdownFormatter());
    this.formatters.set('pdf', new PDFFormatter());
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(request: ReportRequest): Promise<ReportResult> {
    const reportId = randomUUID();
    const startTime = performance.now();

    const { configuration, analysisResult, issues, metrics, historicalData, onProgress } = request;

    try {
      // Initialize progress tracking
      this.updateProgress(reportId, {
        reportId,
        currentStep: 'Initializing report generation',
        percentage: 0,
        currentOperation: 'setup',
      });

      onProgress?.(
        this.activeReports.get(reportId) ?? { reportId, currentStep: '', percentage: 0 }
      );

      // Validate configuration
      this.validateConfiguration(configuration);

      this.updateProgress(reportId, {
        reportId,
        currentStep: 'Preparing data',
        percentage: 10,
        currentOperation: 'data-preparation',
      });
      onProgress?.(
        this.activeReports.get(reportId) ?? { reportId, currentStep: '', percentage: 0 }
      );

      // Get template
      const template = this.templateService.getTemplate(configuration.templateId);
      if (!template) {
        throw new Error(`Template not found: ${configuration.templateId}`);
      }

      // Apply filters to issues
      const filteredIssues = this.applyFilters(issues, configuration.filters);

      // Generate executive summary if needed
      let executiveSummary: ExecutiveSummary | undefined;
      if (this.sectionEnabled(template, 'summary')) {
        executiveSummary = await this.generateExecutiveSummary(
          analysisResult,
          filteredIssues,
          metrics,
          historicalData
        );

        this.updateProgress(reportId, {
          reportId,
          currentStep: 'Generating executive summary',
          percentage: 30,
          currentOperation: 'summary-generation',
        });
        onProgress?.(
          this.activeReports.get(reportId) ?? { reportId, currentStep: '', percentage: 0 }
        );
      }

      // Generate trend analysis if historical data available
      let trendAnalysis: TrendAnalysis | undefined;
      if (historicalData && historicalData.length > 0 && this.sectionEnabled(template, 'trends')) {
        trendAnalysis = this.generateTrendAnalysis(historicalData);

        this.updateProgress(reportId, {
          reportId,
          currentStep: 'Analyzing trends',
          percentage: 50,
          currentOperation: 'trend-analysis',
        });
        onProgress?.(
          this.activeReports.get(reportId) ?? { reportId, currentStep: '', percentage: 0 }
        );
      }

      // Get formatter for the requested format
      const formatter = this.formatters.get(configuration.format);
      if (!formatter) {
        throw new Error(`Unsupported format: ${configuration.format}`);
      }

      this.updateProgress(reportId, {
        reportId,
        currentStep: 'Formatting report',
        percentage: 70,
        currentOperation: 'formatting',
      });
      onProgress?.(
        this.activeReports.get(reportId) ?? { reportId, currentStep: '', percentage: 0 }
      );

      // Prepare report data - convert DashboardMetrics to Metrics interface
      const reportData: ReportData = {
        metadata: {
          title: configuration.name,
          description: configuration.description,
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          reportId,
        },
        analysisResult,
        issues: filteredIssues,
        metrics: this.convertToMetrics(metrics),
        executiveSummary,
        trendAnalysis,
        historicalData,
        template: this.convertToReportTemplate(template),
        configuration,
      };

      // Determine output path and write file
      const outputPath = this.getOutputPath(configuration, analysisResult, reportId);

      // Ensure directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Generate content based on template type
      let content: string;

      // If a custom template is provided in the template content, use it directly
      if (template.content && template.content.trim().length > 0) {
        // Use custom template rendering with security
        const renderResult = await this.templateService.renderTemplate(template.content, {
          metadata: reportData.metadata,
          analysisResult: reportData.analysisResult,
          issues: reportData.issues,
          metrics: reportData.metrics,
          executiveSummary: reportData.executiveSummary,
          trendAnalysis: reportData.trendAnalysis,
          historicalData: reportData.historicalData,
          reportTitle: (analysisResult as { reportTitle?: string }).reportTitle ?? reportData.metadata?.title ?? 'Test Report',
          timestamp: reportData.metadata?.generatedAt ?? new Date().toISOString(),
          summary: {
            ...reportData.analysisResult?.summary,
            totalIssues: reportData.metrics?.totalIssues ?? 0,
            topIssues: reportData.issues.slice(0, 10), // Use actual issues from analysis result
          },
          // Pass through any custom fields from the original analysis result
          ...((analysisResult as { customFields?: Record<string, unknown> }).customFields
            ? { customFields: (analysisResult as { customFields: Record<string, unknown> }).customFields }
            : {}),
        });

        if (!renderResult.success) {
          throw new Error(`Template rendering failed: ${renderResult.error}`);
        }

        // For custom templates, wrap them in basic HTML structure with CSP
        content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none';">
    <title>${this.escapeHtml(reportData.metadata?.title ?? 'Test Report')}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .issue { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .issue.error { border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.1); }
        .issue.warning { border-left: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .issue.info { border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .fixable-badge { background: #22c55e; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
        h3 { margin: 0 0 8px 0; }
        p { margin: 4px 0; }
    </style>
</head>
<body>
    ${renderResult.content}
</body>
</html>`;
      } else {
        // Use built-in template formatter
        content = await formatter.format(reportData, template);
      }

      // Write report file
      writeFileSync(outputPath, content, 'utf-8');

      this.updateProgress(reportId, {
        reportId,
        currentStep: 'Complete',
        percentage: 100,
        currentOperation: 'complete',
        bytesWritten: Buffer.byteLength(content, 'utf-8'),
      });
      onProgress?.(
        this.activeReports.get(reportId) ?? { reportId, currentStep: '', percentage: 0 }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Clean up progress tracking
      this.activeReports.delete(reportId);

      return {
        success: true,
        reportId,
        configurationId: configuration.id,
        outputPath,
        format: configuration.format,
        size: Buffer.byteLength(content, 'utf-8'),
        generatedAt: new Date(),
        duration,
        metadata: {
          title: configuration.name,
          description: configuration.description,
          version: '1.0.0',
        },
      };
    } catch (error) {
      this.activeReports.delete(reportId);

      return {
        success: false,
        reportId,
        configurationId: configuration.id,
        outputPath: '',
        format: configuration.format,
        size: 0,
        generatedAt: new Date(),
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          title: configuration.name,
          description: configuration.description,
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Validate report configuration
   */
  private validateConfiguration(configuration: ReportConfiguration): void {
    if (!configuration.name || configuration.name.trim() === '') {
      throw new Error('Report name is required');
    }

    if (!configuration.templateId) {
      throw new Error('Template ID is required');
    }

    const validFormats: ReportFormat[] = ['json', 'html', 'markdown', 'pdf'];
    if (!validFormats.includes(configuration.format)) {
      throw new Error(`Invalid format: ${configuration.format}`);
    }

    if (!this.templateService.hasTemplate(configuration.templateId)) {
      throw new Error(`Template not found: ${configuration.templateId}`);
    }
  }

  /**
   * Apply filters to issues
   */
  private applyFilters(issues: Issue[], filters: ReportFilters): Issue[] {
    return issues.filter(issue => {
      // Severity filter
      if (filters.severity && !filters.severity.includes(issue.type)) {
        return false;
      }

      // Tool filter
      if (filters.tools && !filters.tools.includes(issue.toolName)) {
        return false;
      }

      // Score range filter
      if (filters.scoreRange) {
        const { min, max } = filters.scoreRange;
        if (issue.score < min || issue.score > max) {
          return false;
        }
      }

      // Fixable only filter
      if (filters.fixableOnly && !issue.fixable) {
        return false;
      }

      return true;
    });
  }

  /**
   * Check if a section is enabled in the template
   */
  private sectionEnabled(
    template: TemplateDefinition | ReportTemplate,
    sectionType: string
  ): boolean {
    return template.sections.some(section => section.type === sectionType && section.enabled);
  }

  /**
   * Generate executive summary using AI-like analysis
   */
  private async generateExecutiveSummary(
    analysisResult: AnalysisResult,
    issues: Issue[],
    metrics: DashboardMetrics,
    historicalData?: HistoricalData[]
  ): Promise<ExecutiveSummary> {
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const fixableCount = issues.filter(i => i.fixable).length;

    // Calculate trend if historical data available
    const trend =
      historicalData && historicalData.length > 1
        ? this.calculateTrend(historicalData)
        : { direction: 'stable' as const, changePercentage: 0 };

    // Generate overview
    const overview = `The codebase has achieved an overall quality score of ${analysisResult.overallScore}/100 with ${metrics.totalIssues} total issues identified. ${errorCount} errors require immediate attention, while ${warningCount} warnings suggest areas for improvement. ${fixableCount} issues can be automatically resolved.`;

    // Generate key metrics
    const keyMetrics: Array<{
      label: string;
      value: string | number;
      trend: 'up' | 'down' | 'stable';
      significance: 'high' | 'medium' | 'low';
    }> = [
      {
        label: 'Overall Score',
        value: `${analysisResult.overallScore}/100`,
        trend:
          trend.direction === 'improving'
            ? 'up'
            : trend.direction === 'declining'
              ? 'down'
              : 'stable',
        significance:
          analysisResult.overallScore >= 80
            ? 'low'
            : analysisResult.overallScore >= 60
              ? 'medium'
              : 'high',
      },
      {
        label: 'Total Issues',
        value: metrics.totalIssues,
        trend:
          trend.direction === 'declining'
            ? 'up'
            : trend.direction === 'improving'
              ? 'down'
              : 'stable',
        significance:
          metrics.totalIssues <= 10 ? 'low' : metrics.totalIssues <= 50 ? 'medium' : 'high',
      },
      {
        label: 'Fixable Issues',
        value: `${fixableCount} (${Math.round((fixableCount / metrics.totalIssues) * 100)}%)`,
        trend: 'stable',
        significance: fixableCount / metrics.totalIssues >= 0.7 ? 'low' : 'medium',
      },
    ];

    // Generate priorities based on issue analysis
    const priorities = this.generatePriorities(issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, metrics);

    // Generate next steps
    const nextSteps = [
      'Address high-priority security vulnerabilities',
      'Fix critical build-breaking errors',
      'Implement automated testing for uncovered areas',
      'Set up code review processes for quality gates',
    ];

    return {
      overview,
      keyMetrics,
      priorities,
      recommendations,
      nextSteps,
    };
  }

  /**
   * Calculate trend from historical data
   */
  private calculateTrend(historicalData: HistoricalData[]): {
    direction: 'improving' | 'declining' | 'stable';
    changePercentage: number;
  } {
    if (historicalData.length < 2) {
      return { direction: 'stable', changePercentage: 0 };
    }

    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];

    if (!latest || !previous) {
      return { direction: 'stable', changePercentage: 0 };
    }

    const scoreChange = latest.overallScore - previous.overallScore;
    const changePercentage =
      previous.overallScore > 0 ? (scoreChange / previous.overallScore) * 100 : 0;

    if (Math.abs(changePercentage) < 5) {
      return { direction: 'stable', changePercentage };
    }

    return {
      direction: changePercentage > 0 ? 'improving' : 'declining',
      changePercentage: Math.abs(changePercentage),
    };
  }

  /**
   * Generate priorities from issues
   */
  private generatePriorities(
    issues: Issue[]
  ): Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
  }> {
    const errorIssues = issues.filter(i => i.type === 'error');
    const fixableErrors = errorIssues.filter(i => i.fixable);

    const priorities: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
    }> = [];

    if (fixableErrors.length > 0) {
      priorities.push({
        title: 'Fix Auto-correctable Errors',
        description: `Resolve ${fixableErrors.length} errors that can be automatically fixed`,
        impact: 'high',
        effort: 'low',
      });
    }

    if (errorIssues.length > fixableErrors.length) {
      priorities.push({
        title: 'Address Manual Error Resolution',
        description: `Manually fix ${errorIssues.length - fixableErrors.length} remaining errors`,
        impact: 'high',
        effort: 'medium',
      });
    }

    const securityIssues = issues.filter(
      i => i.toolName === 'eslint' && i.ruleId?.startsWith('security/')
    );

    if (securityIssues.length > 0) {
      priorities.push({
        title: 'Security Vulnerabilities',
        description: `Address ${securityIssues.length} security-related issues`,
        impact: 'high',
        effort: 'medium',
      });
    }

    return priorities.slice(0, 5); // Limit to top 5 priorities
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(issues: Issue[], metrics: DashboardMetrics): string[] {
    const recommendations = [];

    // Coverage recommendations
    if (metrics.coverage) {
      const { coverage } = metrics;
      if (coverage.lines.percentage < 80) {
        recommendations.push(
          `Increase test coverage to at least 80%. Current: ${coverage.lines.percentage}%`
        );
      }
    }

    // Tool-specific recommendations
    const toolStats = new Map<string, number>();
    issues.forEach(issue => {
      toolStats.set(issue.toolName, (toolStats.get(issue.toolName) ?? 0) + 1);
    });

    for (const [tool, count] of toolStats.entries()) {
      if (count > 10) {
        recommendations.push(`Focus on ${tool} improvements to reduce ${count} issues`);
      }
    }

    // Fixability recommendations
    const fixableCount = issues.filter(i => i.fixable).length;
    if (fixableCount > 0) {
      recommendations.push(`Enable auto-fix for ${fixableCount} resolveable issues`);
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Generate trend analysis
   */
  private generateTrendAnalysis(historicalData: HistoricalData[]): TrendAnalysis {
    const recent = historicalData.slice(-4); // Last 4 data points
    const older = historicalData.slice(-8, -4); // Previous 4 data points

    if (recent.length < 2 || older.length < 2) {
      return {
        period: 'insufficient-data',
        direction: 'stable',
        changePercentage: 0,
        confidence: 0,
        insights: ['Insufficient historical data for trend analysis'],
      };
    }

    const recentAvg = recent.reduce((sum, d) => sum + d.overallScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.overallScore, 0) / older.length;

    const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
    const direction =
      changePercentage > 5 ? 'improving' : changePercentage < -5 ? 'declining' : 'stable';

    const insights = [];
    if (direction === 'improving') {
      insights.push(`Quality score improved by ${Math.abs(changePercentage).toFixed(1)}%`);
    } else if (direction === 'declining') {
      insights.push(`Quality score declined by ${Math.abs(changePercentage).toFixed(1)}%`);
    } else {
      insights.push('Quality score remains stable');
    }

    return {
      period: 'last-4-periods',
      direction,
      changePercentage: Math.abs(changePercentage),
      confidence: Math.min(recent.length / 4, 1) * 100,
      insights,
    };
  }

  /**
   * Get output path for report
   */
  private getOutputPath(
    configuration: ReportConfiguration,
    analysisResult: AnalysisResult,
    _reportId: string
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${configuration.name.toLowerCase().replace(/\s+/g, '-')}-${analysisResult.projectId}-${timestamp}.${configuration.format}`;

    return resolve(process.cwd(), 'reports', filename);
  }

  /**
   * Update progress tracking
   */
  private updateProgress(reportId: string, progress: Partial<ReportProgress>): void {
    const existing = this.activeReports.get(reportId) ?? {
      reportId,
      currentStep: '',
      percentage: 0,
    };

    this.activeReports.set(reportId, { ...existing, ...progress });
  }

  /**
   * Convert DashboardMetrics to Metrics interface for formatters
   */
  private convertToMetrics(dashboardMetrics: DashboardMetrics): Metrics {
    return {
      totalIssues: dashboardMetrics.totalIssues,
      errorCount: dashboardMetrics.errorCount,
      warningCount: dashboardMetrics.warningCount,
      infoCount: dashboardMetrics.infoCount,
      fixableCount: dashboardMetrics.fixableCount,
      coverage: dashboardMetrics.coverage ?? undefined,
      toolResults: dashboardMetrics.toolResults?.map((tool: { toolName: string; status: string; executionTime: number; metrics: { score: number; issuesCount: number }; issues: Issue[]; coverage?: CoverageData }) => ({
        toolName: tool.toolName,
        status: tool.status,
        executionTime: tool.executionTime,
        metrics: {
          score: tool.metrics.score,
          issuesCount: tool.metrics.issuesCount,
        },
        issues: tool.issues,
        coverage: tool.coverage,
      })),
    };
  }

  /**
   * Convert TemplateDefinition to ReportTemplate interface for formatters
   */
  private convertToReportTemplate(templateDef: TemplateDefinition): ReportTemplate {
    return {
      id: templateDef.id,
      name: templateDef.name,
      description: templateDef.description,
      sections: templateDef.sections,
      styles: templateDef.styles,
      templateType: templateDef.templateType,
      format: templateDef.format,
      content: templateDef.content,
      version: templateDef.version,
      author: templateDef.author,
      tags: templateDef.tags,
      category: templateDef.category,
      metadata: templateDef.metadata,
    };
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): TemplateDefinition[] {
    return this.templateService.getTemplates();
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): TemplateDefinition | undefined {
    return this.templateService.getTemplate(id);
  }

  /**
   * Get template service for advanced operations
   */
  getTemplateService(): TemplateService {
    return this.templateService;
  }

  /**
   * Add custom template (backward compatibility)
   */
  addTemplate(template: ReportTemplate): void {
    // If template has an ID and exists, update it; otherwise create new
    if (template.id && this.templateService.hasTemplate(template.id)) {
      this.templateService.updateTemplate(template.id, template);
    } else {
      // Convert ReportTemplate to TemplateDefinition for createTemplate
      const templateDef: Omit<TemplateDefinition, 'id' | 'createdAt' | 'updatedAt'> = {
        name: template.name,
        description: template.description,
        format: template.format,
        templateType: template.templateType,
        content: template.content,
        sections: template.sections,
        styles: template.styles,
        version: template.version ?? '1.0.0',
        author: template.author ?? 'Custom',
        tags: template.tags ?? [],
        category: template.category ?? 'custom',
        variables: [],
        metadata: template.metadata ?? {},
      };

      const createdTemplate = this.templateService.createTemplate(templateDef);
      // Update the original template with the generated ID if needed
      if (createdTemplate.id !== template.id) {
        // If ID was generated, update the template in the registry
        this.templateService.updateTemplate(createdTemplate.id, template);
      }
    }
  }

  /**
   * Create custom template
   */
  createTemplate(
    templateData: Omit<TemplateDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ): TemplateDefinition {
    return this.templateService.createTemplate(templateData);
  }

  /**
   * Update template
   */
  updateTemplate(id: string, updates: Partial<TemplateDefinition>): TemplateDefinition {
    return this.templateService.updateTemplate(id, updates);
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    return this.templateService.deleteTemplate(id);
  }

  /**
   * Clone template
   */
  cloneTemplate(id: string, newName?: string): TemplateDefinition {
    return this.templateService.cloneTemplate(id, newName);
  }

  /**
   * Get templates by format
   */
  getTemplatesByFormat(format: ReportFormat): TemplateDefinition[] {
    return this.templateService.getTemplatesByFormat(format);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): TemplateDefinition[] {
    return this.templateService.getTemplatesByCategory(category);
  }

  /**
   * Get available categories
   */
  getTemplateCategories(): string[] {
    return this.templateService.getCategories();
  }

  /**
   * Get template statistics
   */
  getTemplateStatistics() {
    return this.templateService.getStatistics();
  }

  /**
   * Validate a template (for performance testing)
   */
  validateTemplate(templateContent: string): { valid: boolean; errors?: string[] } {
    try {
      const errors: string[] = [];

      // Check for basic template structure
      const hasHtmlTags = /<[^>]+>/.test(templateContent);
      const hasTemplateVars = /\{\{[^}]+\}\}/.test(templateContent);

      if (!hasHtmlTags && !hasTemplateVars) {
        errors.push('Template must contain HTML structure or template variables');
      }

      // Check for required template variables
      const requiredVars = ['reportTitle', 'timestamp'];
      for (const varName of requiredVars) {
        if (!templateContent.includes(`{{${varName}}}`)) {
          errors.push(`Missing required template variable: ${varName}`);
        }
      }

      // Basic HTML structure check if it contains HTML
      if (hasHtmlTags) {
        const hasOpenTags = (templateContent.match(/</g) ?? []).length;
        const hasCloseTags = (templateContent.match(/>/g) ?? []).length;

        if (hasOpenTags !== hasCloseTags) {
          errors.push('Template has mismatched HTML tags');
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): ReportFormat[] {
    return ['json', 'html', 'markdown', 'pdf'];
  }
}
