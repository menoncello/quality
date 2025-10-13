/**
 * Markdown Report Formatter
 * Generates GitHub-compatible Markdown reports with proper formatting
 */

import type { AnalysisResult, Issue } from '../../../types/analysis';
import type {
  ReportData,
  ReportTemplate,
  ExecutiveSummary,
  TrendAnalysis,
  HistoricalData,
  Metrics,
  ReportSection,
} from '../types';

export class MarkdownFormatter {
  /**
   * Format report data as Markdown
   */
  async format(data: ReportData, template: ReportTemplate): Promise<string> {
    try {
      const markdown = this.buildMarkdownReport(data, template);
      return markdown;
    } catch (error) {
      throw new Error(
        `Failed to generate Markdown report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Build complete Markdown report
   */
  private buildMarkdownReport(data: ReportData, template: ReportTemplate): string {
    const {
      metadata,
      analysisResult,
      issues: _issues,
      metrics: _metrics,
      executiveSummary: _executiveSummary,
      trendAnalysis: _trendAnalysis,
      historicalData: _historicalData,
      configuration: _configuration,
    } = data;

    const sections = template.sections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order);

    const lines = [
      this.getHeader(metadata, analysisResult),
      '',
      ...sections.map(section => this.renderSection(section, data)),
      this.getFooter(metadata),
    ];

    return lines.filter(line => line !== '').join('\n');
  }

  /**
   * Generate Markdown header
   */
  private getHeader(metadata: ReportData['metadata'], analysisResult: AnalysisResult): string {
    const title = metadata?.title ?? 'Untitled Report';
    const description = metadata?.description ? `${metadata.description}\n` : '';
    const generatedAt = metadata?.generatedAt
      ? new Date(metadata.generatedAt).toLocaleString()
      : new Date().toLocaleString();
    const reportId = metadata?.reportId ?? 'unknown';

    const header = [`# ${this.escapeMarkdown(title)}`, ''];

    if (description) {
      header.push(description);
    }

    header.push(
      '## Project Information',
      '',
      '| Property | Value |',
      '|----------|-------|',
      `| **Project ID** | \`${analysisResult.projectId}\` |`,
      `| **Overall Score** | **${analysisResult.overallScore}/100** |`,
      `| **Analysis Date** | ${new Date(analysisResult.timestamp).toLocaleDateString()} |`,
      `| **Analysis Duration** | ${analysisResult.duration}ms |`,
      `| **Report Generated** | ${generatedAt} |`,
      `| **Report ID** | \`${reportId}\` |`,
      ''
    );

    return header.join('\n');
  }

  /**
   * Render section based on type
   */
  private renderSection(section: ReportSection, data: ReportData): string {
    const { analysisResult, issues, metrics, executiveSummary, trendAnalysis, historicalData } =
      data;

    switch (section.type) {
      case 'summary':
        return this.renderSummarySection(analysisResult, metrics, executiveSummary);
      case 'metrics':
        return this.renderMetricsSection(analysisResult, metrics);
      case 'issues':
        return this.renderIssuesSection(issues);
      case 'trends':
        return this.renderTrendsSection(trendAnalysis, historicalData);
      case 'charts':
        return this.renderChartsSection(metrics, historicalData);
      case 'custom':
        return this.renderCustomSection(section, data);
      default:
        return '';
    }
  }

  /**
   * Render executive summary section
   */
  private renderSummarySection(
    analysisResult: AnalysisResult,
    metrics: Metrics,
    executiveSummary?: ExecutiveSummary
  ): string {
    if (!executiveSummary) return '';

    const lines = [
      '## Executive Summary',
      '',
      executiveSummary.overview,
      '',
      '### Key Metrics',
      '',
      ...executiveSummary.keyMetrics.map(metric => {
        const trend = metric.trend === 'up' ? '📈' : metric.trend === 'down' ? '📉' : '➡️';
        const significance =
          metric.significance === 'high' ? '🔴' : metric.significance === 'medium' ? '🟡' : '🟢';
        return `- **${metric.label}**: ${metric.value} ${trend} ${significance}`;
      }),
      '',
    ];

    if (executiveSummary.priorities.length > 0) {
      lines.push(
        '### Priorities',
        '',
        ...executiveSummary.priorities.map((priority, index) => {
          const impact =
            priority.impact === 'high' ? '🔴' : priority.impact === 'medium' ? '🟡' : '🟢';
          const effort =
            priority.effort === 'high' ? '🔴' : priority.effort === 'medium' ? '🟡' : '🟢';
          return [
            `#### ${index + 1}. ${this.escapeMarkdown(priority.title)}`,
            '',
            priority.description,
            '',
            `- **Impact**: ${impact} ${priority.impact}`,
            `- **Effort**: ${effort} ${priority.effort}`,
            '',
          ].join('\n');
        })
      );
    }

    if (executiveSummary.recommendations.length > 0) {
      lines.push(
        '### Recommendations',
        '',
        ...executiveSummary.recommendations.map(rec => `- ${this.escapeMarkdown(rec)}`),
        ''
      );
    }

    if (executiveSummary.nextSteps.length > 0) {
      lines.push(
        '### Next Steps',
        '',
        ...executiveSummary.nextSteps.map(step => `- ${this.escapeMarkdown(step)}`),
        ''
      );
    }

    return lines.join('\n');
  }

  /**
   * Render metrics section
   */
  private renderMetricsSection(analysisResult: AnalysisResult, metrics: Metrics): string {
    const lines = [
      '## Analysis Metrics',
      '',
      '### Overview',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| **Overall Score** | **${analysisResult.overallScore}/100** |`,
      `| **Total Issues** | ${metrics.totalIssues} |`,
      `| **Errors** | ${metrics.errorCount} |`,
      `| **Warnings** | ${metrics.warningCount} |`,
      `| **Info** | ${metrics.infoCount} |`,
      `| **Fixable Issues** | ${metrics.fixableCount} |`,
      `| **Analysis Time** | ${analysisResult.duration}ms |`,
      '',
    ];

    // Add coverage information if available
    if (metrics.coverage) {
      lines.push(
        '### Code Coverage',
        '',
        '| Coverage Type | Percentage | Covered / Total |',
        '|---------------|------------|-----------------|',
        `| **Lines** | ${metrics.coverage.lines.percentage}% | ${metrics.coverage.lines.covered} / ${metrics.coverage.lines.total} |`,
        `| **Functions** | ${metrics.coverage.functions.percentage}% | ${metrics.coverage.functions.covered} / ${metrics.coverage.functions.total} |`,
        `| **Branches** | ${metrics.coverage.branches.percentage}% | ${metrics.coverage.branches.covered} / ${metrics.coverage.branches.total} |`,
        `| **Statements** | ${metrics.coverage.statements.percentage}% | ${metrics.coverage.statements.covered} / ${metrics.coverage.statements.total} |`,
        ''
      );
    }

    // Add tool results
    lines.push(
      '### Tool Results',
      '',
      '| Tool | Status | Issues | Score | Time (ms) |',
      '|------|--------|--------|-------|-----------|'
    );

    analysisResult.toolResults?.forEach((tool: { toolName: string; status: string; issues: unknown[]; metrics: { score: number }; executionTime: number }) => {
      const status = tool.status === 'success' ? '✅' : tool.status === 'warning' ? '⚠️' : '❌';
      lines.push(
        `| ${this.escapeMarkdown(tool.toolName)} | ${status} | ${tool.issues.length} | ${tool.metrics.score} | ${tool.executionTime} |`
      );
    });

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render issues section
   */
  private renderIssuesSection(issues: Issue[]): string {
    if (issues.length === 0) {
      return ['## Issues', '', '🎉 No issues found! Great job maintaining code quality.', ''].join(
        '\n'
      );
    }

    const lines = [
      `## Issues (${issues.length})`,
      '',
      '### Summary',
      '',
      '- **Total Issues**: ' + issues.length,
      '- **Errors**: ' + issues.filter(i => i.type === 'error').length + ' ❌',
      '- **Warnings**: ' + issues.filter(i => i.type === 'warning').length + ' ⚠️',
      '- **Info**: ' + issues.filter(i => i.type === 'info').length + ' ℹ️',
      '- **Fixable**: ' + issues.filter(i => i.fixable).length + ' 🔧',
      '',
      '### Issue Details',
      '',
    ];

    // Group issues by file
    const issuesByFile = new Map<string, Issue[]>();
    issues.forEach(issue => {
      const file = issue.filePath;
      if (!issuesByFile.has(file)) {
        issuesByFile.set(file, []);
      }
      issuesByFile.get(file)?.push(issue);
    });

    // Render issues grouped by file
    let issueIndex = 1;
    for (const [file, fileIssues] of Array.from(issuesByFile.entries())) {
      lines.push(`#### 📁 \`${this.escapeMarkdown(file)}\` (${fileIssues.length} issues)`, '');

      fileIssues.forEach((issue: Issue) => {
        const severity = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        const fixable = issue.fixable ? ' 🔧' : '';

        lines.push(
          `##### ${issueIndex}. ${severity} ${issue.type.toUpperCase()}${fixable}`,
          '',
          `**Message**: ${this.escapeMarkdown(issue.message)}`,
          '',
          `**Location**: Line ${issue.lineNumber}${issue.columnNumber ? `:${issue.columnNumber}` : ''}`,
          '',
          `**Tool**: ${this.escapeMarkdown(issue.toolName)}`,
          '',
          `**Score**: ${issue.score}`,
          ''
        );

        if (issue.ruleId) {
          lines.push(`**Rule**: \`${this.escapeMarkdown(issue.ruleId)}\``);
          lines.push('');
        }

        if (issue.suggestion) {
          lines.push(`**Suggestion**: ${this.escapeMarkdown(issue.suggestion)}`, '');
        }

        lines.push('---');
        issueIndex++;
      });

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Render trends section
   */
  private renderTrendsSection(
    trendAnalysis?: TrendAnalysis,
    historicalData?: HistoricalData[]
  ): string {
    if (!trendAnalysis || !historicalData) return '';

    const lines = [
      '## Trend Analysis',
      '',
      '### Summary',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| **Change** | ${trendAnalysis.changePercentage.toFixed(1)}% |`,
      `| **Direction** | ${trendAnalysis.direction} |`,
      `| **Confidence** | ${trendAnalysis.confidence.toFixed(0)}% |`,
      '',
    ];

    if (trendAnalysis.insights.length > 0) {
      lines.push(
        '### Insights',
        '',
        ...trendAnalysis.insights.map(insight => `- ${this.escapeMarkdown(insight)}`),
        ''
      );
    }

    if (historicalData.length > 0) {
      lines.push(
        '### Historical Data',
        '',
        '| Date | Score | Issues | Errors | Warnings | Fixable |',
        '|------|-------|--------|--------|----------|---------|'
      );

      historicalData.forEach(data => {
        const date = new Date(data.timestamp).toLocaleDateString();
        lines.push(
          `| ${date} | ${data.overallScore} | ${data.totalIssues} | ${data.errorCount} | ${data.warningCount} | ${data.fixableCount} |`
        );
      });

      lines.push('');

      // Simple ASCII trend chart
      lines.push(
        '### Score Trend',
        '',
        '```\n' + this.generateASCIITrendChart(historicalData.map(d => d.overallScore)) + '\n```',
        ''
      );
    }

    return lines.join('\n');
  }

  /**
   * Render charts section (ASCII representation for Markdown)
   */
  private renderChartsSection(metrics: Metrics, _historicalData?: HistoricalData[]): string {
    const lines = [
      '## Visual Analytics',
      '',
      '### Issue Distribution',
      '',
      '```',
      this.generateASCIIBarChart({
        Errors: metrics.errorCount,
        Warnings: metrics.warningCount,
        Info: metrics.infoCount,
      }),
      '```',
      '',
      '### Tool Performance',
      '',
      '```',
      this.generateASCIIBarChart(
        Object.fromEntries(
          metrics.toolResults?.map(tool => [tool.toolName, tool.issues.length]) ?? []
        )
      ),
      '```',
      '',
    ];

    if (metrics.coverage) {
      lines.push(
        '### Coverage Overview',
        '',
        '```',
        this.generateASCIIBarChart({
          Lines: metrics.coverage.lines.percentage,
          Functions: metrics.coverage.functions.percentage,
          Branches: metrics.coverage.branches.percentage,
          Statements: metrics.coverage.statements.percentage,
        }),
        '```',
        ''
      );
    }

    return lines.join('\n');
  }

  /**
   * Render custom section
   */
  private renderCustomSection(section: ReportSection, _data: ReportData): string {
    return [
      `## ${this.escapeMarkdown(section.name ?? 'Custom Section')}`,
      '',
      'Custom section content would be rendered here based on configuration.',
      '',
    ].join('\n');
  }

  /**
   * Generate ASCII bar chart
   */
  private generateASCIIBarChart(data: Record<string, number>): string {
    const entries = Object.entries(data);
    const maxValue = Math.max(...Object.values(data));
    const maxBarLength = 50;

    const lines = entries.map(([label, value]) => {
      const barLength = Math.round((value / maxValue) * maxBarLength);
      const bar = '█'.repeat(barLength);
      return `${label.padEnd(15)} ${bar} ${value}`;
    });

    return lines.join('\n');
  }

  /**
   * Generate ASCII trend chart
   */
  private generateASCIITrendChart(values: number[]): string {
    if (values.length === 0) return '';

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    const height = 10;

    // Create chart grid
    const chart: string[][] = Array(height + 1)
      .fill(null)
      .map(() => Array(values.length).fill(' '));

    // Plot values
    values.forEach((value, index) => {
      const normalizedHeight = Math.round(((value - minValue) / range) * height);
      const row = height - normalizedHeight;
      if (chart[row]) {
        chart[row][index] = '●';
      }
    });

    // Build chart string
    const lines = chart.map((row, index) => {
      const value = minValue + ((height - index) / height) * range;
      return `${value.toFixed(0).padStart(4)} │${row.join('')}`;
    });

    // Add x-axis
    lines.push('     └' + '─'.repeat(values.length));

    // Add value labels
    const valueLabels = values.map(v => v.toString().padStart(1, ' '));
    lines.push('       ' + valueLabels.join(' '));

    return lines.join('\n');
  }

  /**
   * Get report footer
   */
  private getFooter(metadata: ReportData['metadata']): string {
    const generatedAt = metadata?.generatedAt
      ? new Date(metadata.generatedAt).toLocaleString()
      : new Date().toLocaleString();
    const reportId = metadata?.reportId ?? 'unknown';

    return [
      '---',
      '',
      `*Report generated by DevQuality CLI on ${generatedAt}*`,
      '',
      `**Report ID**: \`${reportId}\``,
      '',
    ].join('\n');
  }

  /**
   * Escape Markdown special characters
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&').replace(/\|/g, '\\|');
  }
}
