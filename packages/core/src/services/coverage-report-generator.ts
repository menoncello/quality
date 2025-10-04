/**
 * Coverage Report Generator for creating comprehensive coverage reports
 */

import type {
  CoverageReport,
  CoverageSummary,
  EnhancedCoverageData,
  FileCoverage,
  CriticalPath,
  CoverageRecommendation
} from '../types/coverage.js';

/**
 * Coverage Report Generator creates reports in various formats
 */
export class CoverageReportGenerator {
  /**
   * Export coverage report in specified format
   */
  async export(
    report: CoverageReport,
    format: 'json' | 'html' | 'markdown' | 'csv',
    outputPath?: string
  ): Promise<string> {
    switch (format) {
      case 'json':
        return this.exportJson(report, outputPath);
      case 'html':
        return this.exportHtml(report, outputPath);
      case 'markdown':
        return this.exportMarkdown(report, outputPath);
      case 'csv':
        return this.exportCsv(report, outputPath);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export as JSON
   */
  private async exportJson(report: CoverageReport, outputPath?: string): Promise<string> {
    const json = JSON.stringify(report, null, 2);

    if (outputPath) {
      const fs = require('fs/promises');
      await fs.writeFile(outputPath, json, 'utf8');
    }

    return json;
  }

  /**
   * Export as HTML
   */
  private async exportHtml(report: CoverageReport, outputPath?: string): Promise<string> {
    const html = this.generateHtmlReport(report);

    if (outputPath) {
      const fs = require('fs/promises');
      await fs.writeFile(outputPath, html, 'utf8');
    }

    return html;
  }

  /**
   * Export as Markdown
   */
  private async exportMarkdown(report: CoverageReport, outputPath?: string): Promise<string> {
    const markdown = this.generateMarkdownReport(report);

    if (outputPath) {
      const fs = require('fs/promises');
      await fs.writeFile(outputPath, markdown, 'utf8');
    }

    return markdown;
  }

  /**
   * Export as CSV
   */
  private async exportCsv(report: CoverageReport, outputPath?: string): Promise<string> {
    const csv = this.generateCsvReport(report);

    if (outputPath) {
      const fs = require('fs/promises');
      await fs.writeFile(outputPath, csv, 'utf8');
    }

    return csv;
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(report: CoverageReport): string {
    const { coverage, summary, timestamp } = report;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Report - ${report.projectId}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .grade-${summary.grade.toLowerCase()} { border-left-color: ${this.getGradeColor(summary.grade)}; }
        .file-list { margin-top: 20px; }
        .file-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
        .file-path { font-family: monospace; color: #333; }
        .coverage-bar { width: 100px; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
        .coverage-fill { height: 100%; background: ${this.getCoverageColor(summary.overallCoverage)}; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .critical-paths { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Coverage Report</h1>
            <p>Project: ${report.projectId}</p>
            <p>Generated: ${timestamp.toLocaleString()}</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>Overall Summary</h2>
                <div class="metrics-grid">
                    <div class="metric-card grade-${summary.grade.toLowerCase()}">
                        <div class="metric-value">${summary.overallCoverage.toFixed(1)}%</div>
                        <div class="metric-label">Overall Coverage (Grade: ${summary.grade})</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.lineCoverage.toFixed(1)}%</div>
                        <div class="metric-label">Line Coverage</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.branchCoverage.toFixed(1)}%</div>
                        <div class="metric-label">Branch Coverage</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.functionCoverage.toFixed(1)}%</div>
                        <div class="metric-label">Function Coverage</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.qualityScore.toFixed(1)}</div>
                        <div class="metric-label">Quality Score</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.riskLevel.toUpperCase()}</div>
                        <div class="metric-label">Risk Level</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>File Statistics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${summary.totalFiles}</div>
                        <div class="metric-label">Total Files</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.coveredFiles}</div>
                        <div class="metric-label">Covered Files</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.partiallyCoveredFiles}</div>
                        <div class="metric-label">Partially Covered</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.uncoveredFiles}</div>
                        <div class="metric-label">Uncovered Files</div>
                    </div>
                </div>
            </div>

            ${coverage.files && coverage.files.length > 0 ? this.generateFilesHtml(coverage.files) : ''}

            ${coverage.criticalPaths && coverage.criticalPaths.length > 0 ? this.generateCriticalPathsHtml(coverage.criticalPaths) : ''}

            ${coverage.recommendations && coverage.recommendations.length > 0 ? this.generateRecommendationsHtml(coverage.recommendations) : ''}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate files section HTML
   */
  private generateFilesHtml(files: FileCoverage[]): string {
    const sortedFiles = [...files].sort((a, b) => a.overallCoverage - b.overallCoverage);

    const fileRows = sortedFiles.map(file => `
        <div class="file-item">
            <div class="file-path">${file.relativePath}</div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${file.overallCoverage.toFixed(1)}%</span>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${file.overallCoverage}%"></div>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="section">
            <h2>File Coverage Details</h2>
            <div class="file-list">
                ${fileRows}
            </div>
        </div>
    `;
  }

  /**
   * Generate critical paths section HTML
   */
  private generateCriticalPathsHtml(criticalPaths: CriticalPath[]): string {
    const pathRows = criticalPaths.map(path => `
        <div style="margin-bottom: 15px; padding: 15px; background: #fff; border-radius: 6px; border-left: 4px solid ${this.getRiskColor(path.impact)};">
            <h4 style="margin: 0 0 10px 0; color: #333;">${path.name}</h4>
            <p style="margin: 0 0 10px 0; color: #666;">${path.description}</p>
            <div style="display: flex; gap: 20px; margin-bottom: 10px;">
                <span><strong>Coverage:</strong> ${path.currentCoverage.toFixed(1)}% / ${path.requiredCoverage}%</span>
                <span><strong>Risk:</strong> ${path.impact}</span>
                <span><strong>Priority:</strong> ${path.priority}</span>
            </div>
            ${path.recommendations.length > 0 ? `
                <div style="margin-top: 10px;">
                    <strong>Recommendations:</strong>
                    <ul style="margin: 5px 0 0 20px;">
                        ${path.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `).join('');

    return `
        <div class="critical-paths">
            <h2>Critical Paths Analysis</h2>
            ${pathRows}
        </div>
    `;
  }

  /**
   * Generate recommendations section HTML
   */
  private generateRecommendationsHtml(recommendations: CoverageRecommendation[]): string {
    const recRows = recommendations.map(rec => `
        <div style="margin-bottom: 15px; padding: 15px; background: #fff; border-radius: 6px; border-left: 4px solid ${this.getPriorityColor(rec.priority)};">
            <h4 style="margin: 0 0 10px 0; color: #333;">${rec.title}</h4>
            <p style="margin: 0 0 10px 0; color: #666;">${rec.description}</p>
            <div style="display: flex; gap: 20px; margin-bottom: 10px;">
                <span><strong>Priority:</strong> ${rec.priority.toUpperCase()}</span>
                <span><strong>Effort:</strong> ${rec.effort}</span>
                <span><strong>Type:</strong> ${rec.type}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Expected Impact:</strong>
                <ul style="margin: 5px 0 0 20px;">
                    <li>Coverage improvement: +${rec.impact.coverageImprovement}%</li>
                    <li>Risk reduction: -${rec.impact.riskReduction}%</li>
                    <li>Quality score: +${rec.impact.qualityScore}</li>
                </ul>
            </div>
            <div>
                <strong>Action Items:</strong>
                <ul style="margin: 5px 0 0 20px;">
                    ${rec.actionItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');

    return `
        <div class="recommendations">
            <h2>Recommendations</h2>
            ${recRows}
        </div>
    `;
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(report: CoverageReport): string {
    const { coverage, summary, timestamp } = report;

    return `
# Coverage Report - ${report.projectId}

**Generated:** ${timestamp.toLocaleString()}

## Overall Summary

| Metric | Value | Grade |
|--------|-------|-------|
| Overall Coverage | ${summary.overallCoverage.toFixed(1)}% | ${summary.grade} |
| Line Coverage | ${summary.lineCoverage.toFixed(1)}% | - |
| Branch Coverage | ${summary.branchCoverage.toFixed(1)}% | - |
| Function Coverage | ${summary.functionCoverage.toFixed(1)}% | - |
| Quality Score | ${summary.qualityScore.toFixed(1)} | - |
| Risk Level | ${summary.riskLevel.toUpperCase()} | - |

## File Statistics

- **Total Files:** ${summary.totalFiles}
- **Covered Files:** ${summary.coveredFiles}
- **Partially Covered:** ${summary.partiallyCoveredFiles}
- **Uncovered Files:** ${summary.uncoveredFiles}

## Critical Paths

${coverage.criticalPaths && coverage.criticalPaths.length > 0 ?
  coverage.criticalPaths.map(path => `
### ${path.name}

${path.description}

- **Current Coverage:** ${path.currentCoverage.toFixed(1)}%
- **Required Coverage:** ${path.requiredCoverage}%
- **Risk Level:** ${path.impact}
- **Priority:** ${path.priority}

**Recommendations:**
${path.recommendations.map(rec => `- ${rec}`).join('\n')}
`).join('\n') : 'No critical paths identified.'
}

## Recommendations

${coverage.recommendations && coverage.recommendations.length > 0 ?
  coverage.recommendations.map(rec => `
### ${rec.title} (${rec.priority.toUpperCase()})

${rec.description}

**Expected Impact:**
- Coverage improvement: +${rec.impact.coverageImprovement}%
- Risk reduction: -${rec.impact.riskReduction}%
- Quality score: +${rec.impact.qualityScore}

**Action Items:**
${rec.actionItems.map(item => `- ${item}`).join('\n')}
`).join('\n') : 'No recommendations available.'
}

## File Coverage Details

${coverage.files && coverage.files.length > 0 ?
  coverage.files.map(file => `
### ${file.relativePath}

- **Overall Coverage:** ${file.overallCoverage.toFixed(1)}%
- **Lines:** ${file.coveredLines}/${file.totalLines} (${file.lineCoverage.toFixed(1)}%)
- **Functions:** ${file.coveredFunctions}/${file.totalFunctions} (${file.functionCoverage.toFixed(1)}%)
- **Branches:** ${file.coveredBranches}/${file.totalBranches} (${file.branchCoverage.toFixed(1)}%)
- **Risk Score:** ${file.riskScore.toFixed(1)}
`).join('\n') : 'No file coverage data available.'
}
`;
  }

  /**
   * Generate CSV report
   */
  private generateCsvReport(report: CoverageReport): string {
    const { coverage } = report;

    if (!coverage.files || coverage.files.length === 0) {
      return 'No file coverage data available';
    }

    const headers = [
      'File Path',
      'Overall Coverage %',
      'Line Coverage %',
      'Branch Coverage %',
      'Function Coverage %',
      'Statement Coverage %',
      'Total Lines',
      'Covered Lines',
      'Total Functions',
      'Covered Functions',
      'Total Branches',
      'Covered Branches',
      'Risk Score',
      'Complexity'
    ];

    const rows = coverage.files.map(file => [
      file.relativePath,
      file.overallCoverage.toFixed(2),
      file.lineCoverage.toFixed(2),
      file.branchCoverage.toFixed(2),
      file.functionCoverage.toFixed(2),
      file.statementCoverage.toFixed(2),
      file.totalLines.toString(),
      file.coveredLines.toString(),
      file.totalFunctions.toString(),
      file.coveredFunctions.toString(),
      file.totalBranches.toString(),
      file.coveredBranches.toString(),
      file.riskScore.toFixed(2),
      file.complexity.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Get color for coverage percentage
   */
  private getCoverageColor(coverage: number): string {
    if (coverage >= 90) return '#28a745';
    if (coverage >= 80) return '#ffc107';
    if (coverage >= 70) return '#fd7e14';
    return '#dc3545';
  }

  /**
   * Get color for grade
   */
  private getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return '#28a745';
      case 'B': return '#28a745';
      case 'C': return '#ffc107';
      case 'D': return '#fd7e14';
      case 'F': return '#dc3545';
      default: return '#6c757d';
    }
  }

  /**
   * Get color for risk level
   */
  private getRiskColor(risk: string): string {
    switch (risk) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }

  /**
   * Get color for priority
   */
  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }
}