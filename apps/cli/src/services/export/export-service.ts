/**
 * Export service for generating reports in different formats
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { AnalysisResult, Issue } from '../../types/analysis';
import type { ExportFormat, ExportRequest, ExportResult, ExportProgress } from '../../types/export';
import type { DashboardMetrics } from '../../types/dashboard';
import type {
  ExportOptions,
  JSONExportOptions,
  TextExportOptions,
  CSVExportOptions,
  MarkdownExportOptions,
  JUnitExportOptions,
} from './report-formats';
import { transformCoreIssueToCLI } from '../../utils/type-transformers';

// Proper type definitions instead of any
type _any = unknown;

// Type definitions for export data structures
interface ExportMetadata {
  exportedAt: string;
  version: string;
  tool: string;
}

interface ExportSummary {
  projectId: string;
  timestamp: string;
  duration: number;
  overallScore: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
  toolsAnalyzed: number;
  coverage: import('../../types/analysis').CoverageData | null;
}

interface JSONExportData {
  metadata: ExportMetadata;
  summary?: ExportSummary;
  issues?: Issue[];
  metrics?: DashboardMetrics;
}

export class ExportService {
  private supportedFormats: ExportFormat[] = [
    {
      id: 'json',
      name: 'JSON',
      description: 'Machine-readable JSON format',
      extension: 'json',
      mimeType: 'application/json',
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true,
    },
    {
      id: 'txt',
      name: 'Plain Text',
      description: 'Human-readable text format',
      extension: 'txt',
      mimeType: 'text/plain',
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true,
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Comma-separated values for spreadsheet analysis',
      extension: 'csv',
      mimeType: 'text/csv',
      supportsSummary: false,
      supportsIssues: true,
      supportsMetrics: false,
    },
    {
      id: 'md',
      name: 'Markdown',
      description: 'Markdown format for documentation',
      extension: 'md',
      mimeType: 'text/markdown',
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true,
    },
    {
      id: 'junit',
      name: 'JUnit XML',
      description: 'JUnit XML format for CI/CD integration',
      extension: 'xml',
      mimeType: 'application/xml',
      supportsSummary: false,
      supportsIssues: true,
      supportsMetrics: false,
    },
  ];

  /**
   * Get all supported export formats
   */
  getSupportedFormats(): ExportFormat[] {
    return [...this.supportedFormats];
  }

  /**
   * Export analysis results to specified format
   */
  async exportResults(
    request: ExportRequest,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const { format, data, options } = request;
    const { analysisResult, filteredIssues: coreFilteredIssues, metrics } = data;

    // Transform core issues to CLI issues
    const filteredIssues: Issue[] = coreFilteredIssues.map(issue => transformCoreIssueToCLI(issue));

    try {
      onProgress?.({
        currentStep: 'Preparing data',
        percentage: 10,
      });

      // Validate format
      const supportedFormat = this.supportedFormats.find(f => f.id === format.id);
      if (!supportedFormat) {
        throw new Error(`Unsupported export format: ${format.id}`);
      }

      onProgress?.({
        currentStep: 'Generating content',
        percentage: 30,
      });

      // Generate content based on format
      let content: string;
      switch (format.id) {
        case 'json':
          content = this.generateJSON(
            analysisResult,
            filteredIssues,
            metrics,
            options as JSONExportOptions
          );
          break;
        case 'txt':
          content = this.generateText(
            analysisResult,
            filteredIssues,
            metrics,
            options as TextExportOptions
          );
          break;
        case 'csv':
          content = this.generateCSV(filteredIssues, options as CSVExportOptions);
          break;
        case 'md':
          content = this.generateMarkdown(
            analysisResult,
            filteredIssues,
            metrics,
            options as MarkdownExportOptions
          );
          break;
        case 'junit':
          content = this.generateJUnitXML(
            analysisResult,
            filteredIssues,
            options as JUnitExportOptions
          );
          break;
        default:
          throw new Error(`Export format ${format.id} not implemented`);
      }

      onProgress?.({
        currentStep: 'Writing file',
        percentage: 70,
      });

      // Determine output path
      const outputPath = this.getOutputPath(analysisResult, format, options.outputPath);

      onProgress?.({
        currentStep: 'Finalizing',
        percentage: 90,
        bytesWritten: content.length,
      });

      // Ensure directory exists
      const outputDir = dirname(outputPath);
      mkdirSync(outputDir, { recursive: true });

      // Write file
      writeFileSync(outputPath, content, 'utf-8');

      onProgress?.({
        currentStep: 'Complete',
        percentage: 100,
        bytesWritten: content.length,
      });

      return {
        success: true,
        outputPath,
        size: Buffer.byteLength(content, 'utf-8'),
        format,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        outputPath: '',
        size: 0,
        format,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate JSON export
   */
  private generateJSON(
    analysisResult: AnalysisResult,
    filteredIssues: Issue[],
    metrics: DashboardMetrics,
    _options: ExportOptions
  ): string {
    const exportData: JSONExportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        tool: 'DevQuality CLI',
      },
    };

    if (_options.includeSummary) {
      exportData.summary = {
        projectId: analysisResult.projectId,
        timestamp: analysisResult.timestamp,
        duration: analysisResult.duration,
        overallScore: analysisResult.overallScore,
        totalIssues: metrics.totalIssues,
        errorCount: metrics.errorCount,
        warningCount: metrics.warningCount,
        infoCount: metrics.infoCount,
        fixableCount: metrics.fixableCount,
        toolsAnalyzed: metrics.toolsAnalyzed,
        coverage: metrics.coverage,
      };
    }

    if (_options.includeMetrics) {
      exportData.metrics = metrics;
    }

    if (_options.includeIssues) {
      const issuesToExport = _options.includeFixed
        ? filteredIssues
        : filteredIssues.filter(issue => !issue.fixable);

      exportData.issues = issuesToExport;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate plain text export
   */
  private generateText(
    analysisResult: AnalysisResult,
    filteredIssues: Issue[],
    metrics: DashboardMetrics,
    _options: ExportOptions
  ): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('DevQuality CLI Analysis Report');
    lines.push('='.repeat(80));
    lines.push('');

    if (_options.includeSummary) {
      lines.push('ANALYSIS SUMMARY');
      lines.push('-'.repeat(40));
      lines.push(`Project ID: ${analysisResult.projectId}`);
      lines.push(`Timestamp: ${analysisResult.timestamp}`);
      lines.push(`Duration: ${(analysisResult.duration / 1000).toFixed(2)}s`);
      lines.push(`Overall Score: ${analysisResult.overallScore}/100`);
      lines.push('');

      lines.push('ISSUES SUMMARY');
      lines.push('-'.repeat(40));
      lines.push(`Total Issues: ${metrics.totalIssues}`);
      lines.push(`Errors: ${metrics.errorCount}`);
      lines.push(`Warnings: ${metrics.warningCount}`);
      lines.push(`Info: ${metrics.infoCount}`);
      lines.push(`Fixable: ${metrics.fixableCount}`);
      lines.push('');
    }

    if (_options.includeIssues) {
      const issuesToExport = _options.includeFixed
        ? filteredIssues
        : filteredIssues.filter(issue => !issue.fixable);

      lines.push(`ISSUES (${issuesToExport.length})`);
      lines.push('-'.repeat(40));
      lines.push('');

      issuesToExport.forEach((issue, index) => {
        lines.push(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
        lines.push(`   File: ${issue.filePath}:${issue.lineNumber}`);
        lines.push(`   Tool: ${issue.toolName}`);
        lines.push(`   Score: ${issue.score}`);
        if (issue.ruleId) {
          lines.push(`   Rule: ${issue.ruleId}`);
        }
        if (issue.suggestion) {
          lines.push(`   Suggestion: ${issue.suggestion}`);
        }
        lines.push(`   Fixable: ${issue.fixable ? 'Yes' : 'No'}`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate CSV export
   */
  private generateCSV(filteredIssues: Issue[], _options: ExportOptions): string {
    const issuesToExport = _options.includeFixed
      ? filteredIssues
      : filteredIssues.filter(issue => !issue.fixable);

    const headers = [
      'Type',
      'Severity',
      'Tool',
      'File',
      'Line',
      'Message',
      'Rule ID',
      'Score',
      'Fixable',
      'Suggestion',
    ];

    const rows = issuesToExport.map(issue => [
      issue.type,
      issue.type,
      issue.toolName,
      issue.filePath,
      issue.lineNumber.toString(),
      `"${issue.message.replace(/"/g, '""')}"`,
      issue.ruleId ?? '',
      issue.score.toString(),
      issue.fixable.toString(),
      `"${(issue.suggestion ?? '').replace(/"/g, '""')}"`,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Generate Markdown export
   */
  private generateMarkdown(
    analysisResult: AnalysisResult,
    filteredIssues: Issue[],
    metrics: DashboardMetrics,
    _options: ExportOptions
  ): string {
    const lines: string[] = [];

    lines.push('# DevQuality CLI Analysis Report');
    lines.push('');

    if (_options.includeSummary) {
      lines.push('## Analysis Summary');
      lines.push('');
      lines.push(`- **Project ID**: ${analysisResult.projectId}`);
      lines.push(`- **Timestamp**: ${analysisResult.timestamp}`);
      lines.push(`- **Duration**: ${(analysisResult.duration / 1000).toFixed(2)}s`);
      lines.push(`- **Overall Score**: ${analysisResult.overallScore}/100`);
      lines.push('');

      lines.push('### Issues Summary');
      lines.push('');
      lines.push('| Metric | Count |');
      lines.push('|--------|-------|');
      lines.push(`| Total Issues | ${metrics.totalIssues} |`);
      lines.push(`| Errors | ${metrics.errorCount} |`);
      lines.push(`| Warnings | ${metrics.warningCount} |`);
      lines.push(`| Info | ${metrics.infoCount} |`);
      lines.push(`| Fixable | ${metrics.fixableCount} |`);
      lines.push('');
    }

    if (_options.includeIssues) {
      const issuesToExport = _options.includeFixed
        ? filteredIssues
        : filteredIssues.filter(issue => !issue.fixable);

      lines.push(`## Issues (${issuesToExport.length})`);
      lines.push('');

      issuesToExport.forEach((issue, index) => {
        const severityEmoji =
          issue.type === 'error' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵';
        lines.push(`### ${index + 1}. ${severityEmoji} ${issue.type.toUpperCase()}`);
        lines.push('');
        lines.push(`**Message**: ${issue.message}`);
        lines.push(`**File**: \`${issue.filePath}:${issue.lineNumber}\``);
        lines.push(`**Tool**: ${issue.toolName}`);
        lines.push(`**Score**: ${issue.score}`);
        if (issue.ruleId) {
          lines.push(`**Rule**: \`${issue.ruleId}\``);
        }
        if (issue.suggestion) {
          lines.push(`**Suggestion**: ${issue.suggestion}`);
        }
        lines.push(`**Fixable**: ${issue.fixable ? '✅ Yes' : '❌ No'}`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate JUnit XML export
   */
  private generateJUnitXML(
    analysisResult: AnalysisResult,
    filteredIssues: Issue[],
    _options: ExportOptions
  ): string {
    const issuesToExport = _options.includeFixed
      ? filteredIssues
      : filteredIssues.filter(issue => !issue.fixable);

    const errorCount = issuesToExport.filter(issue => issue.type === 'error').length;
    const failureCount = issuesToExport.filter(issue => issue.type === 'warning').length;

    const xmlLines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<testsuites name="DevQuality Analysis" tests="${issuesToExport.length}" failures="${failureCount}" errors="${errorCount}" time="${(analysisResult.duration / 1000).toFixed(2)}">`,
      `  <testsuite name="Code Quality" tests="${issuesToExport.length}" failures="${failureCount}" errors="${errorCount}" time="${(analysisResult.duration / 1000).toFixed(2)}">`,
    ];

    issuesToExport.forEach((issue, index) => {
      const testCaseName = `testCase${index + 1}`;
      const className = issue.filePath.replace(/[^a-zA-Z0-9]/g, '_');

      if (issue.type === 'error') {
        xmlLines.push(`    <testcase name="${testCaseName}" classname="${className}" time="0">`);
        xmlLines.push(`      <error message="${this.escapeXml(issue['message'])}">`);
        xmlLines.push(
          `        ${this.escapeXml(`Tool: ${issue['toolName']}, Line: ${issue['lineNumber']}, Rule: ${issue['ruleId'] ?? 'N/A'}`)}`
        );
        xmlLines.push(`      </error>`);
        xmlLines.push(`    </testcase>`);
      } else if (issue.type === 'warning') {
        xmlLines.push(`    <testcase name="${testCaseName}" classname="${className}" time="0">`);
        xmlLines.push(`      <failure message="${this.escapeXml(issue['message'])}">`);
        xmlLines.push(
          `        ${this.escapeXml(`Tool: ${issue['toolName']}, Line: ${issue['lineNumber']}, Rule: ${issue['ruleId'] ?? 'N/A'}`)}`
        );
        xmlLines.push(`      </failure>`);
        xmlLines.push(`    </testcase>`);
      } else {
        xmlLines.push(`    <testcase name="${testCaseName}" classname="${className}" time="0"/>`);
      }
    });

    xmlLines.push('  </testsuite>');
    xmlLines.push('</testsuites>');

    return xmlLines.join('\n');
  }

  /**
   * Escape XML special characters
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
   * Generate output path for export
   */
  private getOutputPath(
    analysisResult: AnalysisResult,
    format: ExportFormat,
    customPath?: string
  ): string {
    if (customPath) {
      return resolve(customPath);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dev-quality-report-${analysisResult.projectId}-${timestamp}.${format.extension}`;
    return resolve(process.cwd(), filename);
  }
}
