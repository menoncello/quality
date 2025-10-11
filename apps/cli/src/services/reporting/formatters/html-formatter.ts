/**
 * HTML Report Formatter
 * Generates interactive HTML reports with CSS styling and JavaScript components
 */

import type {
  ReportTemplate,
  ReportConfiguration,
  ExecutiveSummary,
  TrendAnalysis,
  HistoricalData
} from '../report-generator';

interface ReportMetadata {
  title?: string;
  description?: string;
  generatedAt?: string;
  reportId?: string;
}

interface AnalysisResult {
  projectId?: string;
  overallScore?: number;
  duration?: number;
  toolResults?: Array<{
    toolName: string;
    status: string;
    issues: unknown[];
    metrics: { score: number };
    executionTime: number;
  }>;
}

interface Metrics {
  totalIssues?: number;
  errorCount?: number;
  warningCount?: number;
  fixableCount?: number;
  infoCount?: number;
  coverage?: {
    lines: { percentage: number };
    functions: { percentage: number };
    branches: { percentage: number };
    statements: { percentage: number };
  };
  toolResults?: Array<{
    toolName: string;
    issues: unknown[];
  }>;
}

interface Issue {
  type: string;
  toolName: string;
  filePath: string;
  lineNumber: number;
  message: string;
  score: number;
  fixable: boolean;
}

interface ReportSection {
  type: string;
  name?: string;
}

interface ReportData {
  metadata: ReportMetadata;
  analysisResult: AnalysisResult;
  issues: Issue[];
  metrics: Metrics;
  executiveSummary?: ExecutiveSummary;
  trendAnalysis?: TrendAnalysis;
  historicalData?: HistoricalData[];
  template: ReportTemplate;
  configuration: ReportConfiguration;
}

export class HTMLFormatter {
  /**
   * Format report data as HTML
   */
  async format(data: ReportData, template: ReportTemplate): Promise<string> {
    try {
      const html = this.buildHTMLReport(data, template);
      return html;
    } catch (error) {
      throw new Error(`Failed to generate HTML report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build complete HTML report
   */
  private buildHTMLReport(data: ReportData, template: ReportTemplate): string {
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

    const title = metadata?.title ?? 'Untitled Report';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    ${this.getStyles(template)}
    ${this.getScripts()}
</head>
<body>
    <div class="report-container">
        ${this.getHeader(metadata, analysisResult)}
        <main class="report-content">
            ${sections.map(section => this.renderSection(section, data)).join('')}
        </main>
        ${this.getFooter(metadata)}
    </div>
    ${this.getInlineScripts(data)}
</body>
</html>`;
  }

  /**
   * Get CSS styles for the report
   */
  private getStyles(template: ReportTemplate): string {
    const theme = template.styles?.theme ?? 'light';
    const primaryColor = template.styles?.primaryColor ?? '#2563eb';
    const secondaryColor = template.styles?.secondaryColor ?? '#64748b';

    return `
    <style>
        :root {
            --primary-color: ${primaryColor};
            --secondary-color: ${secondaryColor};
            --success-color: #22c55e;
            --warning-color: #f59e0b;
            --error-color: #ef4444;
            --info-color: #3b82f6;
            --background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
            --surface: ${theme === 'dark' ? '#374151' : '#f9fafb'};
            --text: ${theme === 'dark' ? '#f9fafb' : '#111827'};
            --text-secondary: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
            --border: ${theme === 'dark' ? '#4b5563' : '#e5e7eb'};
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${template.styles?.fontFamily ?? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
            font-size: ${template.styles?.fontSize ?? '14px'};
            line-height: 1.6;
            color: var(--text);
            background-color: var(--background);
        }

        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            color: var(--primary-color);
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .header .subtitle {
            color: var(--text-secondary);
            font-size: 16px;
            margin-bottom: 16px;
        }

        .header .meta {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
        }

        .meta-label {
            font-size: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .meta-value {
            font-size: 16px;
            font-weight: 600;
            color: var(--text);
        }

        .section {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--primary-color);
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .metric-card {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px;
            text-align: center;
        }

        .metric-value {
            font-size: 32px;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 4px;
        }

        .metric-label {
            font-size: 14px;
            color: var(--text-secondary);
        }

        .metric-trend {
            font-size: 12px;
            margin-top: 4px;
        }

        .trend-up { color: var(--success-color); }
        .trend-down { color: var(--error-color); }
        .trend-stable { color: var(--text-secondary); }

        .issues-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        .issues-table th,
        .issues-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        .issues-table th {
            background: var(--background);
            font-weight: 600;
            color: var(--text);
        }

        .issues-table tr:hover {
            background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
        }

        .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .severity-error {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error-color);
        }

        .severity-warning {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning-color);
        }

        .severity-info {
            background: rgba(59, 130, 246, 0.1);
            color: var(--info-color);
        }

        .fixable-badge {
            background: rgba(34, 197, 94, 0.1);
            color: var(--success-color);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
        }

        .priority-list {
            list-style: none;
        }

        .priority-item {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
        }

        .priority-title {
            font-weight: 600;
            color: var(--text);
            margin-bottom: 4px;
        }

        .priority-meta {
            display: flex;
            gap: 12px;
            margin-bottom: 8px;
        }

        .impact-badge, .effort-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .impact-high { background: rgba(239, 68, 68, 0.1); color: var(--error-color); }
        .impact-medium { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
        .impact-low { background: rgba(34, 197, 94, 0.1); color: var(--success-color); }

        .effort-high { background: rgba(239, 68, 68, 0.1); color: var(--error-color); }
        .effort-medium { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
        .effort-low { background: rgba(34, 197, 94, 0.1); color: var(--success-color); }

        .chart-container {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
        }

        .footer {
            text-align: center;
            padding: 24px;
            border-top: 1px solid var(--border);
            margin-top: 40px;
            color: var(--text-secondary);
            font-size: 12px;
        }

        @media (max-width: 768px) {
            .report-container {
                padding: 12px;
            }

            .header .meta {
                flex-direction: column;
                gap: 12px;
            }

            .metrics-grid {
                grid-template-columns: 1fr;
            }

            .issues-table {
                font-size: 12px;
            }

            .issues-table th,
            .issues-table td {
                padding: 8px;
            }
        }

        .collapsible {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 6px;
            margin: 8px 0;
        }

        .collapsible-header {
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            justify-content: between;
            align-items: center;
            font-weight: 600;
        }

        .collapsible-header:hover {
            background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
        }

        .collapsible-content {
            padding: 16px;
            border-top: 1px solid var(--border);
        }

        .hidden {
            display: none;
        }
    </style>`;
  }

  /**
   * Get JavaScript for interactive features
   */
  private getScripts(): string {
    return `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`;
  }

  /**
   * Render report header
   */
  private getHeader(metadata: ReportMetadata, analysisResult: AnalysisResult): string {
    const title = metadata?.title ?? 'Untitled Report';
    const description = metadata?.description ? `<p class="subtitle">${this.escapeHtml(metadata.description)}</p>` : '';
    const generatedAt = metadata?.generatedAt ? new Date(metadata.generatedAt).toLocaleDateString() : new Date().toLocaleDateString();
    const reportId = metadata?.reportId?.substring(0, 8) ?? 'unknown';

    return `
    <header class="header">
        <h1>${this.escapeHtml(title)}</h1>
        ${description}
        <div class="meta">
            <div class="meta-item">
                <span class="meta-label">Project</span>
                <span class="meta-value">${this.escapeHtml(analysisResult.projectId ?? 'Unknown')}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Overall Score</span>
                <span class="meta-value">${analysisResult.overallScore ?? 0}/100</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Generated</span>
                <span class="meta-value">${generatedAt}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Report ID</span>
                <span class="meta-value">${reportId}</span>
            </div>
        </div>
    </header>`;
  }

  /**
   * Render section based on type
   */
  private renderSection(section: ReportSection, data: ReportData): string {
    const { analysisResult, issues, metrics, executiveSummary, trendAnalysis, historicalData } = data;

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
  private renderSummarySection(analysisResult: AnalysisResult, metrics: Metrics, executiveSummary?: ExecutiveSummary): string {
    if (!executiveSummary) return '';

    return `
    <section class="section">
        <h2 class="section-title">Executive Summary</h2>
        <p>${this.escapeHtml(executiveSummary.overview)}</p>

        <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600;">Key Metrics</h3>
        <div class="metrics-grid">
            ${executiveSummary.keyMetrics.map(metric => `
            <div class="metric-card">
                <div class="metric-value">${metric.value}</div>
                <div class="metric-label">${this.escapeHtml(metric.label)}</div>
                <div class="metric-trend trend-${metric.trend}">
                    ${metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    ${metric.significance}
                </div>
            </div>`).join('')}
        </div>

        <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600;">Priorities</h3>
        <ul class="priority-list">
            ${executiveSummary.priorities.map(priority => `
            <li class="priority-item">
                <div class="priority-title">${this.escapeHtml(priority.title)}</div>
                <div class="priority-meta">
                    <span class="impact-badge impact-${priority.impact}">Impact: ${priority.impact}</span>
                    <span class="effort-badge effort-${priority.effort}">Effort: ${priority.effort}</span>
                </div>
                <div>${this.escapeHtml(priority.description)}</div>
            </li>`).join('')}
        </ul>

        <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600;">Recommendations</h3>
        <ul style="padding-left: 20px;">
            ${executiveSummary.recommendations.map(rec => `
            <li style="margin-bottom: 8px;">${this.escapeHtml(rec)}</li>`).join('')}
        </ul>
    </section>`;
  }

  /**
   * Render metrics section
   */
  private renderMetricsSection(analysisResult: AnalysisResult, metrics: Metrics): string {
    return `
    <section class="section">
        <h2 class="section-title">Analysis Metrics</h2>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${analysisResult.overallScore ?? 0}</div>
                <div class="metric-label">Overall Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.totalIssues ?? 0}</div>
                <div class="metric-label">Total Issues</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.errorCount ?? 0}</div>
                <div class="metric-label">Errors</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.warningCount ?? 0}</div>
                <div class="metric-label">Warnings</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.fixableCount ?? 0}</div>
                <div class="metric-label">Fixable Issues</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysisResult.duration ?? 0}ms</div>
                <div class="metric-label">Analysis Time</div>
            </div>
        </div>

        ${metrics.coverage ? `
        <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600;">Code Coverage</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${metrics.coverage.lines.percentage}%</div>
                <div class="metric-label">Lines</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.coverage.functions.percentage}%</div>
                <div class="metric-label">Functions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.coverage.branches.percentage}%</div>
                <div class="metric-label">Branches</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.coverage.statements.percentage}%</div>
                <div class="metric-label">Statements</div>
            </div>
        </div>` : ''}

        <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600;">Tool Results</h3>
        <table class="issues-table">
            <thead>
                <tr>
                    <th>Tool</th>
                    <th>Status</th>
                    <th>Issues</th>
                    <th>Score</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody>
                ${analysisResult.toolResults?.map((tool) => `
                <tr>
                    <td>${this.escapeHtml(tool.toolName)}</td>
                    <td><span class="severity-badge severity-${tool.status === 'success' ? 'info' : tool.status}">${tool.status}</span></td>
                    <td>${tool.issues.length}</td>
                    <td>${tool.metrics.score}</td>
                    <td>${tool.executionTime}ms</td>
                </tr>`).join('')}
            </tbody>
        </table>
    </section>`;
  }

  /**
   * Render issues section
   */
  private renderIssuesSection(issues: Issue[]): string {
    return `
    <section class="section">
        <h2 class="section-title">Issues (${issues.length})</h2>

        <table class="issues-table">
            <thead>
                <tr>
                    <th>Severity</th>
                    <th>Tool</th>
                    <th>File</th>
                    <th>Line</th>
                    <th>Message</th>
                    <th>Score</th>
                    <th>Fixable</th>
                </tr>
            </thead>
            <tbody>
                ${issues.map((issue) => `
                <tr>
                    <td><span class="severity-badge severity-${issue.type}">${issue.type}</span></td>
                    <td>${this.escapeHtml(issue.toolName)}</td>
                    <td><code>${this.escapeHtml(issue.filePath)}</code></td>
                    <td>${issue.lineNumber}</td>
                    <td>${this.escapeHtml(issue.message)}</td>
                    <td>${issue.score}</td>
                    <td>${issue.fixable ? '<span class="fixable-badge">Yes</span>' : 'No'}</td>
                </tr>`).join('')}
            </tbody>
        </table>
    </section>`;
  }

  /**
   * Render trends section
   */
  private renderTrendsSection(trendAnalysis?: TrendAnalysis, historicalData?: HistoricalData[]): string {
    if (!trendAnalysis || !historicalData) return '';

    return `
    <section class="section">
        <h2 class="section-title">Trend Analysis</h2>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${trendAnalysis.changePercentage.toFixed(1)}%</div>
                <div class="metric-label">Change</div>
                <div class="metric-trend trend-${trendAnalysis.direction === 'improving' ? 'up' : trendAnalysis.direction === 'declining' ? 'down' : 'stable'}">
                    ${trendAnalysis.direction}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${trendAnalysis.confidence.toFixed(0)}%</div>
                <div class="metric-label">Confidence</div>
            </div>
        </div>

        <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600;">Insights</h3>
        <ul style="padding-left: 20px;">
            ${trendAnalysis.insights.map(insight => `
            <li style="margin-bottom: 8px;">${this.escapeHtml(insight)}</li>`).join('')}
        </ul>

        <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600;">Historical Data</h3>
        <div class="chart-container">
            <canvas id="trendChart"></canvas>
        </div>
    </section>`;
  }

  /**
   * Render charts section
   */
  private renderChartsSection(_metrics: unknown, _historicalData?: HistoricalData[]): string {
    return `
    <section class="section">
        <h2 class="section-title">Visual Analytics</h2>

        <div class="metrics-grid">
            <div style="grid-column: span 2;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Issue Distribution</h3>
                <div class="chart-container">
                    <canvas id="issueChart"></canvas>
                </div>
            </div>
            <div>
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Tool Performance</h3>
                <div class="chart-container">
                    <canvas id="toolChart"></canvas>
                </div>
            </div>
        </div>
    </section>`;
  }

  /**
   * Render custom section
   */
  private renderCustomSection(section: ReportSection, _data: ReportData): string {
    return `
    <section class="section">
        <h2 class="section-title">${this.escapeHtml(section.name ?? 'Custom Section')}</h2>
        <div class="custom-content">
            <p>Custom section content would be rendered here based on configuration.</p>
        </div>
    </section>`;
  }

  /**
   * Get report footer
   */
  private getFooter(metadata: ReportMetadata): string {
    const generatedAt = metadata?.generatedAt ? new Date(metadata.generatedAt).toLocaleString() : new Date().toLocaleString();
    const reportId = metadata?.reportId ?? 'unknown';

    return `
    <footer class="footer">
        <p>Generated by DevQuality CLI on ${generatedAt}</p>
        <p>Report ID: ${reportId}</p>
    </footer>`;
  }

  /**
   * Get inline JavaScript for charts and interactions
   */
  private getInlineScripts(data: ReportData): string {
    const { issues: _issues, metrics, historicalData, trendAnalysis: _trendAnalysis } = data;

    return `
    <script>
        // Issue distribution chart
        const issueCtx = document.getElementById('issueChart');
        if (issueCtx) {
            new Chart(issueCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Errors', 'Warnings', 'Info'],
                    datasets: [{
                        data: [${metrics.errorCount ?? 0}, ${metrics.warningCount ?? 0}, ${metrics.infoCount ?? 0}],
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Tool performance chart
        const toolCtx = document.getElementById('toolChart');
        if (toolCtx) {
            new Chart(toolCtx, {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(metrics.toolResults?.map((t) => t.toolName) ?? [])},
                    datasets: [{
                        label: 'Issues Found',
                        data: ${JSON.stringify(metrics.toolResults?.map((t) => t.issues.length) ?? [])},
                        backgroundColor: '#2563eb'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Trend chart
        const trendCtx = document.getElementById('trendChart');
        if (trendCtx && ${historicalData ? 'true' : 'false'}) {
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: ${JSON.stringify(historicalData?.map(d => new Date(d.timestamp).toLocaleDateString()) ?? [])},
                    datasets: [{
                        label: 'Overall Score',
                        data: ${JSON.stringify(historicalData?.map(d => d.overallScore) ?? [])},
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }

        // Collapsible sections
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.classList.toggle('hidden');
            });
        });
    </script>`;
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
}