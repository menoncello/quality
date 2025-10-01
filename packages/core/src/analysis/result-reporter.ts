import type {
  AnalysisResult,
  ToolResult,
  Issue,
  ResultSummary,
  AIPrompt,
  Logger
} from '../plugins/analysis-plugin.js';
import type { NormalizedResult } from './result-normalizer.js';
import type { AggregatedSummary } from './result-aggregator.js';

/**
 * Report format
 */
export enum ReportFormat {
  JSON = 'json',
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
  JUNIT = 'junit',
  CSV = 'csv',
  SARIF = 'sarif'
}

/**
 * Report configuration
 */
export interface ReportConfig {
  format: ReportFormat;
  outputPath?: string;
  template?: string;
  includeDetails: boolean;
  includeMetrics: boolean;
  includeRecommendations: boolean;
  includeCharts: boolean;
  groupBy: 'tool' | 'severity' | 'file' | 'category';
  sortBy: 'severity' | 'tool' | 'file' | 'score';
  filter?: {
    minSeverity: 'error' | 'warning' | 'info';
    tools?: string[];
    files?: string[];
    categories?: string[];
  };
  customFields?: Record<string, any>;
}

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  title?: string;
  description?: string;
  author?: string;
  version?: string;
  timestamp?: Date;
  projectInfo?: {
    name: string;
    version?: string;
    repository?: string;
    branch?: string;
    commit?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Generated report
 */
export interface GeneratedReport {
  format: ReportFormat;
  content: string;
  filename: string;
  size: number;
  generatedAt: Date;
  metadata: {
    issuesCount: number;
    toolsCount: number;
    executionTime: number;
    overallScore: number;
  };
}

/**
 * Result reporter for analysis results
 */
export class ResultReporter {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generate report from analysis result
   */
  async generateReport(
    result: AnalysisResult,
    config: ReportConfig,
    options: ReportGenerationOptions = {}
  ): Promise<GeneratedReport> {
    const startTime = Date.now();

    this.logger.info(`Generating ${config.format} report`);

    try {
      let content: string;
      let filename: string;

      switch (config.format) {
        case ReportFormat.JSON:
          content = this.generateJSONReport(result, config, options);
          filename = this.generateFilename('json', options);
          break;

        case ReportFormat.TEXT:
          content = this.generateTextReport(result, config, options);
          filename = this.generateFilename('txt', options);
          break;

        case ReportFormat.HTML:
          content = this.generateHTMLReport(result, config, options);
          filename = this.generateFilename('html', options);
          break;

        case ReportFormat.MARKDOWN:
          content = this.generateMarkdownReport(result, config, options);
          filename = this.generateFilename('md', options);
          break;

        case ReportFormat.JUNIT:
          content = this.generateJUnitReport(result, config, options);
          filename = this.generateFilename('xml', options);
          break;

        case ReportFormat.CSV:
          content = this.generateCSVReport(result, config, options);
          filename = this.generateFilename('csv', options);
          break;

        case ReportFormat.SARIF:
          content = this.generateSARIFReport(result, config, options);
          filename = this.generateFilename('sarif', options);
          break;

        default:
          throw new Error(`Unsupported report format: ${config.format}`);
      }

      // Write to file if output path specified
      if (config.outputPath) {
        await this.writeReportToFile(content, config.outputPath, filename);
      }

      const report: GeneratedReport = {
        format: config.format,
        content,
        filename,
        size: content.length,
        generatedAt: new Date(),
        metadata: {
          issuesCount: result.summary.totalIssues,
          toolsCount: result.toolResults.length,
          executionTime: result.duration,
          overallScore: result.overallScore
        }
      };

      this.logger.info(`Report generated: ${filename} (${content.length} bytes)`);
      return report;

    } catch (error) {
      this.logger.error('Failed to generate report:', error);
      throw new Error(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.logger.debug(`Report generation completed in ${Date.now() - startTime}ms`);
    }
  }

  /**
   * Generate multiple reports in different formats
   */
  async generateMultipleReports(
    result: AnalysisResult,
    configs: ReportConfig[],
    options: ReportGenerationOptions = {}
  ): Promise<GeneratedReport[]> {
    const reports: GeneratedReport[] = [];

    for (const config of configs) {
      try {
        const report = await this.generateReport(result, config, options);
        reports.push(report);
      } catch (error) {
        if (this.logger?.error) {
          this.logger.error(`Failed to generate ${config.format} report:`, error);
        }
      }
    }

    return reports;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(result: AnalysisResult): {
    title: string;
    overallScore: string;
    grade: string;
    keyMetrics: Record<string, string>;
    criticalIssues: number;
    recommendations: string[];
    status: 'excellent' | 'good' | 'needs-improvement' | 'critical';
  } {
    const score = result.overallScore;
    let grade: string;
    let status: 'excellent' | 'good' | 'needs-improvement' | 'critical';

    if (score >= 90) {
      grade = 'A';
      status = 'excellent';
    } else if (score >= 80) {
      grade = 'B';
      status = 'good';
    } else if (score >= 60) {
      grade = 'C';
      status = 'needs-improvement';
    } else {
      grade = 'D';
      status = 'critical';
    }

    const criticalIssues = result.toolResults.reduce((sum, tool) =>
      sum + tool.issues.filter(issue => issue.type === 'error').length, 0
    );

    return {
      title: options.title || 'Code Quality Analysis Report',
      overallScore: `${score}%`,
      grade,
      keyMetrics: {
        'Total Issues': result.summary.totalIssues.toString(),
        'Errors': result.summary.totalErrors.toString(),
        'Warnings': result.summary.totalWarnings.toString(),
        'Fixable Issues': result.summary.totalFixable.toString(),
        'Tools Executed': result.toolResults.length.toString(),
        'Execution Time': `${result.duration}ms`
      },
      criticalIssues,
      recommendations: this.generateTopRecommendations(result),
      status
    };
  }

  // Private methods

  /**
   * Generate JSON report
   */
  private generateJSONReport(
    result: AnalysisResult,
    config: ReportConfig,
    options: ReportGenerationOptions
  ): string {
    const report = {
      metadata: {
        title: options.title || 'Code Quality Analysis Report',
        description: options.description,
        author: options.author,
        version: options.version,
        timestamp: options.timestamp || new Date(),
        generatedAt: new Date(),
        format: 'json',
        version: '1.0'
      },
      project: options.projectInfo || {},
      summary: result.summary,
      overallScore: result.overallScore,
      aiPrompts: config.includeRecommendations ? result.aiPrompts : [],
      tools: result.toolResults.map(tool => this.sanitizeToolResult(tool, config)),
      executiveSummary: this.generateExecutiveSummary(result),
      recommendations: config.includeRecommendations ? this.generateTopRecommendations(result) : []
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate text report
   */
  private generateTextReport(
    result: AnalysisResult,
    config: ReportConfig,
    options: ReportGenerationOptions
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(80));
    lines.push(`  ${options.title || 'Code Quality Analysis Report'}`);
    lines.push('='.repeat(80));
    lines.push('');

    // Executive summary
    const execSummary = this.generateExecutiveSummary(result);
    lines.push('EXECUTIVE SUMMARY');
    lines.push('-'.repeat(80));
    lines.push(`Overall Score: ${execSummary.overallScore} (${execSummary.grade})`);
    lines.push(`Status: ${execSummary.status.toUpperCase()}`);
    lines.push(`Critical Issues: ${execSummary.criticalIssues}`);
    lines.push('');

    // Key metrics
    lines.push('KEY METRICS');
    lines.push('-'.repeat(80));
    for (const [key, value] of Object.entries(execSummary.keyMetrics)) {
      lines.push(`${key.padEnd(20)}: ${value}`);
    }
    lines.push('');

    // Tool results
    lines.push('TOOL RESULTS');
    lines.push('-'.repeat(80));
    for (const tool of result.toolResults) {
      lines.push(`\n${tool.toolName}`);
      lines.push('  '.padEnd(4) + `Status: ${tool.status}`);
      lines.push('  '.padEnd(4) + `Issues: ${tool.issues.length}`);
      lines.push('  '.padEnd(4) + `Execution Time: ${tool.executionTime}ms`);

      if (config.includeDetails && tool.issues.length > 0) {
        lines.push('  Issues:');
        for (const issue of tool.issues.slice(0, 10)) { // Limit to 10 issues
          lines.push(`    [${issue.type.toUpperCase()}] ${issue.filePath}:${issue.lineNumber} - ${issue.message}`);
        }
        if (tool.issues.length > 10) {
          lines.push(`    ... and ${tool.issues.length - 10} more issues`);
        }
      }
    }

    // Recommendations
    if (config.includeRecommendations && execSummary.recommendations.length > 0) {
      lines.push('\nRECOMMENDATIONS');
      lines.push('-'.repeat(80));
      for (const recommendation of execSummary.recommendations) {
        lines.push(`• ${recommendation}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(
    result: AnalysisResult,
    config: ReportConfig,
    options: ReportGenerationOptions
  ): string {
    const execSummary = this.generateExecutiveSummary(result);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || 'Code Quality Analysis Report'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2em; }
        .header .score { font-size: 3em; font-weight: bold; margin: 10px 0; }
        .content { padding: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric .value { font-size: 2em; font-weight: bold; color: #333; }
        .metric .label { color: #666; margin-top: 5px; }
        .tool-result { margin-bottom: 30px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .tool-header { background: #f8f9fa; padding: 15px 20px; border-bottom: 1px solid #e9ecef; }
        .tool-header h3 { margin: 0; color: #333; }
        .tool-issues { padding: 20px; }
        .issue { padding: 10px; border-left: 4px solid #ddd; margin-bottom: 10px; background: #fafafa; }
        .issue.error { border-left-color: #dc3545; }
        .issue.warning { border-left-color: #ffc107; }
        .issue.info { border-left-color: #17a2b8; }
        .recommendations { background: #e7f5ff; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .grade-${execSummary.status} { color: ${execSummary.status === 'excellent' ? '#28a745' : execSummary.status === 'good' ? '#007bff' : execSummary.status === 'needs-improvement' ? '#ffc107' : '#dc3545'}; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${options.title || 'Code Quality Analysis Report'}</h1>
            <div class="score grade-${execSummary.status}">${execSummary.overallScore} (${execSummary.grade})</div>
            <div>Status: ${execSummary.status.toUpperCase()}</div>
        </div>
        <div class="content">
            <div class="metrics">
                <div class="metric">
                    <div class="value">${execSummary.keyMetrics['Total Issues']}</div>
                    <div class="label">Total Issues</div>
                </div>
                <div class="metric">
                    <div class="value">${execSummary.keyMetrics['Errors']}</div>
                    <div class="label">Errors</div>
                </div>
                <div class="metric">
                    <div class="value">${execSummary.keyMetrics['Warnings']}</div>
                    <div class="label">Warnings</div>
                </div>
                <div class="metric">
                    <div class="value">${execSummary.keyMetrics['Fixable Issues']}</div>
                    <div class="label">Fixable Issues</div>
                </div>
                <div class="metric">
                    <div class="value">${execSummary.keyMetrics['Tools Executed']}</div>
                    <div class="label">Tools Executed</div>
                </div>
                <div class="metric">
                    <div class="value">${execSummary.keyMetrics['Execution Time']}</div>
                    <div class="label">Execution Time</div>
                </div>
            </div>

            ${result.toolResults.map(tool => `
                <div class="tool-result">
                    <div class="tool-header">
                        <h3>${tool.toolName}</h3>
                        <span>Status: ${tool.status} | Issues: ${tool.issues.length} | Time: ${tool.executionTime}ms</span>
                    </div>
                    ${config.includeDetails ? `
                        <div class="tool-issues">
                            ${tool.issues.slice(0, 20).map(issue => `
                                <div class="issue ${issue.type}">
                                    <strong>[${issue.type.toUpperCase()}]</strong> ${issue.filePath}:${issue.lineNumber}<br>
                                    ${issue.message}
                                </div>
                            `).join('')}
                            ${tool.issues.length > 20 ? `<div class="issue">... and ${tool.issues.length - 20} more issues</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}

            ${config.includeRecommendations && execSummary.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h3>Recommendations</h3>
                    <ul>
                        ${execSummary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(
    result: AnalysisResult,
    config: ReportConfig,
    options: ReportGenerationOptions
  ): string {
    const execSummary = this.generateExecutiveSummary(result);
    const lines: string[] = [];

    // Header
    lines.push(`# ${options.title || 'Code Quality Analysis Report'}`);
    lines.push('');
    lines.push(`**Overall Score:** ${execSummary.overallScore} (${execSummary.grade})`);
    lines.push(`**Status:** ${execSummary.status.toUpperCase()}`);
    lines.push(`**Date:** ${new Date().toLocaleDateString()}`);
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    for (const [key, value] of Object.entries(execSummary.keyMetrics)) {
      lines.push(`| ${key} | ${value} |`);
    }
    lines.push('');

    // Tool results
    lines.push('## Tool Results');
    lines.push('');
    for (const tool of result.toolResults) {
      lines.push(`### ${tool.toolName}`);
      lines.push('');
      lines.push(`- **Status:** ${tool.status}`);
      lines.push(`- **Issues:** ${tool.issues.length}`);
      lines.push(`- **Execution Time:** ${tool.executionTime}ms`);
      lines.push('');

      if (config.includeDetails && tool.issues.length > 0) {
        lines.push('#### Issues');
        lines.push('');
        for (const issue of tool.issues.slice(0, 10)) {
          lines.push(`- **[${issue.type.toUpperCase()}]** ${issue.filePath}:${issue.lineNumber} - ${issue.message}`);
        }
        if (tool.issues.length > 10) {
          lines.push(`- ... and ${tool.issues.length - 10} more issues`);
        }
        lines.push('');
      }
    }

    // Recommendations
    if (config.includeRecommendations && execSummary.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const recommendation of execSummary.recommendations) {
        lines.push(`- ${recommendation}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate JUnit XML report
   */
  private generateJUnitReport(
    result: AnalysisResult,
    config: ReportConfig,
    options: ReportGenerationOptions
  ): string {
    const testSuiteName = options.title || 'Code Quality Analysis';
    const timestamp = new Date().toISOString();
    const totalIssues = result.summary.totalIssues;
    const totalErrors = result.summary.totalErrors;
    const totalFailures = totalIssues - totalErrors;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuite name="${testSuiteName}" tests="${result.toolResults.length}" failures="${totalFailures}" errors="${totalErrors}" time="${result.duration / 1000}" timestamp="${timestamp}">\n`;

    for (const tool of result.toolResults) {
      const toolErrors = tool.issues.filter(i => i.type === 'error').length;
      const toolFailures = tool.issues.filter(i => i.type !== 'error').length;
      const toolTime = tool.executionTime / 1000;

      xml += `  <testcase name="${tool.toolName}" time="${toolTime}">\n`;

      if (toolErrors > 0) {
        xml += `    <error message="${toolErrors} error(s) found">\n`;
        for (const error of tool.issues.filter(i => i.type === 'error').slice(0, 5)) {
          xml += `      ${error.filePath}:${error.lineNumber} - ${this.escapeXml(error.message)}\n`;
        }
        xml += '    </error>\n';
      }

      if (toolFailures > 0) {
        xml += `    <failure message="${toolFailures} warning(s) found">\n`;
        for (const failure of tool.issues.filter(i => i.type !== 'error').slice(0, 5)) {
          xml += `      ${failure.filePath}:${failure.lineNumber} - ${this.escapeXml(failure.message)}\n`;
        }
        xml += '    </failure>\n';
      }

      xml += '  </testcase>\n';
    }

    xml += '</testsuite>';

    return xml;
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(
    result: AnalysisResult,
    config: ReportConfig,
    options: ReportGenerationOptions
  ): string {
    const headers = ['Tool Name', 'File Path', 'Line Number', 'Severity', 'Message', 'Rule ID', 'Fixable'];
    const rows: string[][] = [headers];

    for (const tool of result.toolResults) {
      for (const issue of tool.issues) {
        rows.push([
          tool.toolName,
          issue.filePath,
          issue.lineNumber.toString(),
          issue.type,
          `"${this.escapeCsv(issue.message)}"`,
          issue.ruleId || '',
          issue.fixable.toString()
        ]);
      }
    }

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Generate SARIF report
   */
  private generateSARIFReport(
    result: AnalysisResult,
    config: ReportConfig,
    options: ReportGenerationOptions
  ): string {
    const sarif = {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [{
        tool: {
          driver: {
            name: options.title || 'Code Quality Analysis',
            version: options.version || '1.0.0',
            informationUri: 'https://github.com/dev-quality/cli'
          }
        },
        results: result.toolResults.flatMap(tool =>
          tool.issues.map(issue => ({
            level: issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'note',
            message: { text: issue.message },
            locations: [{
              physicalLocation: {
                artifactLocation: { uri: issue.filePath },
                region: {
                  startLine: issue.lineNumber,
                  startColumn: 1,
                  endLine: issue.lineNumber,
                  endColumn: 1
                }
              }
            }],
            ruleId: issue.ruleId,
            properties: {
              toolName: tool.toolName,
              fixable: issue.fixable
            }
          }))
        )
      }]
    };

    return JSON.stringify(sarif, null, 2);
  }

  /**
   * Generate filename for report
   */
  private generateFilename(extension: string, options: ReportGenerationOptions): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const projectName = options.projectInfo?.name || 'analysis';
    return `${projectName}-quality-report-${timestamp}.${extension}`;
  }

  /**
   * Write report to file
   */
  private async writeReportToFile(content: string, outputPath: string, filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const fullPath = path.join(outputPath, filename);

    try {
      await fs.writeFile(fullPath, content, 'utf8');
      this.logger.info(`Report saved to: ${fullPath}`);
    } catch (error) {
      this.logger.error(`Failed to write report to ${fullPath}:`, error);
      throw error;
    }
  }

  /**
   * Sanitize tool result for reporting
   */
  private sanitizeToolResult(tool: ToolResult, config: ReportConfig): any {
    const sanitized: any = {
      toolName: tool.toolName,
      executionTime: tool.executionTime,
      status: tool.status,
      issuesCount: tool.issues.length,
      metrics: tool.metrics
    };

    if (config.includeDetails) {
      sanitized.issues = tool.issues.map(issue => ({
        type: issue.type,
        filePath: issue.filePath,
        lineNumber: issue.lineNumber,
        message: issue.message,
        ruleId: issue.ruleId,
        fixable: issue.fixable,
        score: issue.score
      }));
    }

    return sanitized;
  }

  /**
   * Generate top recommendations
   */
  private generateTopRecommendations(result: AnalysisResult): string[] {
    const recommendations: string[] = [];

    const totalErrors = result.summary.totalErrors;
    const totalWarnings = result.summary.totalWarnings;
    const fixableIssues = result.summary.totalFixable;

    if (totalErrors > 0) {
      recommendations.push(`Fix ${totalErrors} critical error(s) to improve code reliability`);
    }

    if (totalWarnings > 10) {
      recommendations.push(`Address ${totalWarnings} warning(s) to improve code quality`);
    }

    if (fixableIssues > 0) {
      recommendations.push(`${fixableIssues} issue(s) can be automatically fixed`);
    }

    if (result.overallScore < 80) {
      recommendations.push('Focus on improving overall code quality score');
    }

    // Add tool-specific recommendations
    for (const tool of result.toolResults) {
      if (tool.status === 'error') {
        recommendations.push(`Fix configuration or setup issues for ${tool.toolName}`);
      }
    }

    return recommendations.slice(0, 10); // Limit to top 10
  }

  /**
   * Escape XML characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Escape CSV characters
   */
  private escapeCsv(text: string): string {
    return text
      .replace(/"/g, '""')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }
}