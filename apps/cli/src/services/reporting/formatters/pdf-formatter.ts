/**
 * PDF Report Formatter
 * Generates professional PDF reports using HTML to PDF conversion
 */

import type {
  ReportTemplate,
  ReportConfiguration,
  ExecutiveSummary,
  TrendAnalysis,
  HistoricalData
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
  type: string;
  toolName: string;
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  message: string;
  ruleId?: string;
  score: number;
  fixable: boolean;
  suggestion?: string;
}

interface AnalysisResult {
  projectId: string;
  timestamp: string;
  duration: number;
  overallScore: number;
  toolResults?: ToolResult[];
}

interface Metrics {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  fixableCount: number;
  coverage?: {
    lines: { percentage: number };
    functions: { percentage: number };
    branches: { percentage: number };
    statements: { percentage: number };
  };
  toolResults?: Array<{
    toolName: string;
    issues: Issue[];
  }>;
}

interface ReportSection {
  type: string;
  name?: string;
  config?: unknown;
}

interface ReportData {
  metadata: {
    title?: string;
    description?: string;
    version: string;
    generatedAt?: string;
    reportId?: string;
  };
  analysisResult: AnalysisResult;
  issues: Issue[];
  metrics: Metrics;
  executiveSummary?: ExecutiveSummary;
  trendAnalysis?: TrendAnalysis;
  historicalData?: HistoricalData[];
  template: ReportTemplate;
  configuration: ReportConfiguration;
}

export class PDFFormatter {
  /**
   * Format report data as PDF
   * Note: This is a simplified implementation. In production, you would use
   * a library like Puppeteer, jsPDF, or a headless Chrome service
   */
  async format(data: ReportData, template: ReportTemplate): Promise<string> {
    try {
      // For now, we'll generate HTML that can be converted to PDF
      // In a real implementation, you would:
      // 1. Use Puppeteer to launch a headless browser
      // 2. Load the HTML content
      // 3. Generate PDF with proper page breaks and formatting
      // 4. Return the PDF buffer or save to file

      const htmlContent = this.generateHTMLForPDF(data, template);

      // This is a placeholder for actual PDF generation
      // In production, you would implement something like:
      /*
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });
      await browser.close();
      return pdf.toString('base64');
      */

      // For now, return the HTML with a note that this would be converted to PDF
      const notice = [
        '<!-- PDF Generation Notice -->',
        '<!-- This HTML would be converted to PDF using Puppeteer or similar -->',
        '<!-- In production, implement actual PDF generation -->',
        ''
      ].join('\n');

      return notice + htmlContent;
    } catch (error) {
      throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate HTML optimized for PDF conversion
   */
  private generateHTMLForPDF(data: ReportData, template: ReportTemplate): string {
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

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }

        .page-break {
            page-break-before: always;
        }

        .avoid-page-break {
            page-break-inside: avoid;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }

        .header h1 {
            font-size: 24px;
            color: #2563eb;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .header .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .meta-table td {
            padding: 5px 10px;
            border: 1px solid #ddd;
        }

        .meta-table td:first-child {
            font-weight: bold;
            background-color: #f5f5f5;
            width: 30%;
        }

        .section {
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 18px;
            color: #2563eb;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
            font-weight: bold;
        }

        .subsection-title {
            font-size: 14px;
            color: #333;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }

        .metric-box {
            border: 1px solid #ddd;
            padding: 15px;
            text-align: center;
            background-color: #f9f9f9;
        }

        .metric-value {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
        }

        .metric-label {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
        }

        .issues-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }

        .issues-table th,
        .issues-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        .issues-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }

        .severity-error {
            color: #dc2626;
            font-weight: bold;
        }

        .severity-warning {
            color: #d97706;
            font-weight: bold;
        }

        .severity-info {
            color: #2563eb;
            font-weight: bold;
        }

        .priority-item {
            border: 1px solid #ddd;
            padding: 12px;
            margin-bottom: 10px;
            background-color: #f9f9f9;
        }

        .priority-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .priority-meta {
            font-size: 10px;
            color: #666;
            margin-bottom: 8px;
        }

        .chart-placeholder {
            border: 1px dashed #ddd;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-style: italic;
            margin: 15px 0;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
        }

        .summary-box {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }

        .recommendation-list {
            padding-left: 20px;
        }

        .recommendation-list li {
            margin-bottom: 5px;
        }

        .tool-results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .tool-results-table th,
        .tool-results-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        .tool-results-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }

        .status-success {
            color: #059669;
            font-weight: bold;
        }

        .status-error {
            color: #dc2626;
            font-weight: bold;
        }

        .status-warning {
            color: #d97706;
            font-weight: bold;
        }

        @media print {
            .no-print {
                display: none;
            }

            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header">
        <h1>${this.escapeHtml(title)}</h1>
        ${metadata?.description ? `<p class="subtitle">${this.escapeHtml(metadata.description)}</p>` : ''}
        <table class="meta-table">
            <tr>
                <td>Project ID</td>
                <td>${this.escapeHtml(analysisResult.projectId)}</td>
                <td>Overall Score</td>
                <td>${analysisResult.overallScore}/100</td>
            </tr>
            <tr>
                <td>Analysis Date</td>
                <td>${new Date(analysisResult.timestamp).toLocaleDateString()}</td>
                <td>Analysis Duration</td>
                <td>${analysisResult.duration}ms</td>
            </tr>
            <tr>
                <td>Report Generated</td>
                <td>${metadata?.generatedAt ? new Date(metadata.generatedAt).toLocaleString() : new Date().toLocaleString()}</td>
                <td>Report ID</td>
                <td>${metadata?.reportId ?? 'unknown'}</td>
            </tr>
        </table>
    </div>

    ${sections.map(section => this.renderPDFSection(section, data)).join('')}

    <!-- Footer -->
    <div class="footer">
        <p>Generated by DevQuality CLI on ${metadata?.generatedAt ? new Date(metadata.generatedAt).toLocaleString() : new Date().toLocaleString()}</p>
        <p>Report ID: ${metadata?.reportId ?? 'unknown'}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Render section optimized for PDF
   */
  private renderPDFSection(section: ReportSection, data: ReportData): string {
    const { analysisResult, issues, metrics, executiveSummary, trendAnalysis, historicalData } = data;

    switch (section.type) {
      case 'summary':
        return this.renderPDFSummarySection(analysisResult, metrics, executiveSummary);
      case 'metrics':
        return this.renderPDFMetricsSection(analysisResult, metrics);
      case 'issues':
        return this.renderPDFIssuesSection(issues);
      case 'trends':
        return this.renderPDFTrendsSection(trendAnalysis, historicalData);
      case 'charts':
        return this.renderPDFChartsSection(metrics, historicalData);
      case 'custom':
        return this.renderPDFCustomSection(section, data);
      default:
        return '';
    }
  }

  /**
   * Render executive summary section for PDF
   */
  private renderPDFSummarySection(analysisResult: AnalysisResult, metrics: Metrics, executiveSummary?: ExecutiveSummary): string {
    if (!executiveSummary) return '';

    return `
    <div class="section avoid-page-break">
        <h2 class="section-title">Executive Summary</h2>

        <div class="summary-box">
            <p>${this.escapeHtml(executiveSummary.overview)}</p>
        </div>

        <h3 class="subsection-title">Key Metrics</h3>
        <div class="metrics-grid">
            ${executiveSummary.keyMetrics.map(metric => `
            <div class="metric-box">
                <div class="metric-value">${metric.value}</div>
                <div class="metric-label">${this.escapeHtml(metric.label)}</div>
            </div>`).join('')}
        </div>

        ${executiveSummary.priorities.length > 0 ? `
        <h3 class="subsection-title">Priorities</h3>
        ${executiveSummary.priorities.map(priority => `
        <div class="priority-item">
            <div class="priority-title">${this.escapeHtml(priority.title)}</div>
            <div class="priority-meta">Impact: ${priority.impact} | Effort: ${priority.effort}</div>
            <div>${this.escapeHtml(priority.description)}</div>
        </div>`).join('')}
        ` : ''}

        ${executiveSummary.recommendations.length > 0 ? `
        <h3 class="subsection-title">Recommendations</h3>
        <ul class="recommendation-list">
            ${executiveSummary.recommendations.map(rec => `<li>${this.escapeHtml(rec)}</li>`).join('')}
        </ul>
        ` : ''}
    </div>`;
  }

  /**
   * Render metrics section for PDF
   */
  private renderPDFMetricsSection(analysisResult: AnalysisResult, metrics: Metrics): string {
    return `
    <div class="section">
        <h2 class="section-title">Analysis Metrics</h2>

        <div class="metrics-grid">
            <div class="metric-box">
                <div class="metric-value">${analysisResult.overallScore}</div>
                <div class="metric-label">Overall Score</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.totalIssues}</div>
                <div class="metric-label">Total Issues</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.errorCount}</div>
                <div class="metric-label">Errors</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.warningCount}</div>
                <div class="metric-label">Warnings</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.fixableCount}</div>
                <div class="metric-label">Fixable Issues</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${analysisResult.duration}ms</div>
                <div class="metric-label">Analysis Time</div>
            </div>
        </div>

        <h3 class="subsection-title">Tool Results</h3>
        <table class="tool-results-table">
            <thead>
                <tr>
                    <th>Tool</th>
                    <th>Status</th>
                    <th>Issues</th>
                    <th>Score</th>
                    <th>Time (ms)</th>
                </tr>
            </thead>
            <tbody>
                ${analysisResult.toolResults?.map(tool => `
                <tr>
                    <td>${this.escapeHtml(tool.toolName)}</td>
                    <td class="status-${tool.status}">${tool.status}</td>
                    <td>${tool.issues.length}</td>
                    <td>${tool.metrics.score}</td>
                    <td>${tool.executionTime}</td>
                </tr>`).join('')}
            </tbody>
        </table>

        ${metrics.coverage ? `
        <h3 class="subsection-title">Code Coverage</h3>
        <div class="metrics-grid">
            <div class="metric-box">
                <div class="metric-value">${metrics.coverage.lines.percentage}%</div>
                <div class="metric-label">Lines</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.coverage.functions.percentage}%</div>
                <div class="metric-label">Functions</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.coverage.branches.percentage}%</div>
                <div class="metric-label">Branches</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${metrics.coverage.statements.percentage}%</div>
                <div class="metric-label">Statements</div>
            </div>
        </div>
        ` : ''}
    </div>`;
  }

  /**
   * Render issues section for PDF
   */
  private renderPDFIssuesSection(issues: Issue[]): string {
    if (issues.length === 0) {
      return `
      <div class="section">
        <h2 class="section-title">Issues</h2>
        <p><strong>No issues found!</strong> Great job maintaining code quality.</p>
      </div>`;
    }

    // Limit issues for PDF to keep it manageable
    const limitedIssues = issues.slice(0, 100);

    return `
    <div class="section page-break">
        <h2 class="section-title">Issues (${limitedIssues.length} of ${issues.length})</h2>

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
                ${limitedIssues.map(issue => `
                <tr>
                    <td class="severity-${issue.type}">${issue.type.toUpperCase()}</td>
                    <td>${this.escapeHtml(issue.toolName)}</td>
                    <td>${this.escapeHtml(issue.filePath)}</td>
                    <td>${issue.lineNumber}</td>
                    <td>${this.escapeHtml(issue.message)}</td>
                    <td>${issue.score}</td>
                    <td>${issue.fixable ? 'Yes' : 'No'}</td>
                </tr>`).join('')}
            </tbody>
        </table>

        ${issues.length > 100 ? `
        <p><em>Note: Showing first 100 issues. Total issues: ${issues.length}</em></p>
        ` : ''}
    </div>`;
  }

  /**
   * Render trends section for PDF
   */
  private renderPDFTrendsSection(trendAnalysis?: TrendAnalysis, historicalData?: HistoricalData[]): string {
    if (!trendAnalysis || !historicalData) return '';

    return `
    <div class="section page-break">
        <h2 class="section-title">Trend Analysis</h2>

        <div class="metrics-grid">
            <div class="metric-box">
                <div class="metric-value">${trendAnalysis.changePercentage.toFixed(1)}%</div>
                <div class="metric-label">Change</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${trendAnalysis.direction}</div>
                <div class="metric-label">Direction</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${trendAnalysis.confidence.toFixed(0)}%</div>
                <div class="metric-label">Confidence</div>
            </div>
        </div>

        <h3 class="subsection-title">Insights</h3>
        <ul class="recommendation-list">
            ${trendAnalysis.insights.map(insight => `<li>${this.escapeHtml(insight)}</li>`).join('')}
        </ul>

        <h3 class="subsection-title">Historical Data</h3>
        <div class="chart-placeholder">
            Trend chart would be rendered here
        </div>

        <table class="issues-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Issues</th>
                    <th>Errors</th>
                    <th>Warnings</th>
                    <th>Fixable</th>
                </tr>
            </thead>
            <tbody>
                ${historicalData.map(data => `
                <tr>
                    <td>${new Date(data.timestamp).toLocaleDateString()}</td>
                    <td>${data.overallScore}</td>
                    <td>${data.totalIssues}</td>
                    <td>${data.errorCount}</td>
                    <td>${data.warningCount}</td>
                    <td>${data.fixableCount}</td>
                </tr>`).join('')}
            </tbody>
        </table>
    </div>`;
  }

  /**
   * Render charts section for PDF
   */
  private renderPDFChartsSection(metrics: Metrics, _historicalData?: HistoricalData[]): string {
    return `
    <div class="section page-break">
        <h2 class="section-title">Visual Analytics</h2>

        <h3 class="subsection-title">Issue Distribution</h3>
        <div class="chart-placeholder">
            Pie chart showing issue distribution would be rendered here
        </div>

        <h3 class="subsection-title">Tool Performance</h3>
        <div class="chart-placeholder">
            Bar chart showing tool performance would be rendered here
        </div>

        ${metrics.coverage ? `
        <h3 class="subsection-title">Coverage Overview</h3>
        <div class="chart-placeholder">
            Coverage chart would be rendered here
        </div>
        ` : ''}
    </div>`;
  }

  /**
   * Render custom section for PDF
   */
  private renderPDFCustomSection(section: ReportSection, _data: ReportData): string {
    return `
    <div class="section">
        <h2 class="section-title">${this.escapeHtml(section.name ?? 'Custom Section')}</h2>
        <p>Custom section content would be rendered here based on configuration.</p>
    </div>`;
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