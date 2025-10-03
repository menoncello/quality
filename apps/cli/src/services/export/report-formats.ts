/**
 * Report format definitions and configurations
 */

import type { ExportFormat } from '../../types/export';

// Base export options that all formats share
export interface BaseExportOptions {
  includeSummary: boolean;
  includeIssues: boolean;
  includeMetrics: boolean;
  includeFixed: boolean;
}

// Format-specific options
export interface JSONExportOptions extends BaseExportOptions {
  prettyPrint: boolean;
  includeRawData: boolean;
}

export interface TextExportOptions extends BaseExportOptions {
  maxMessageLength: number;
  includeTimestamps: boolean;
}

export interface CSVExportOptions extends BaseExportOptions {
  includeHeaders: boolean;
  delimiter: string;
  quoteFields: boolean;
}

export interface MarkdownExportOptions extends BaseExportOptions {
  includeTableOfContents: boolean;
  includeSeverityIcons: boolean;
  maxMessageLength: number;
}

export interface JUnitExportOptions {
  includeSummary: false;
  includeIssues: true;
  includeMetrics: false;
  includeFixed: false;
  package: string;
  classname: string;
}

interface HTMLExportOptions extends BaseExportOptions {
  includeStyles: boolean;
  includeScripts: boolean;
  theme: string;
}

interface SARIFExportOptions {
  includeSummary: false;
  includeIssues: true;
  includeMetrics: false;
  includeFixed: false;
  version: string;
  includeLevel: boolean;
  includeLocation: boolean;
}

// Union type for all export options
export type ExportOptions =
  | JSONExportOptions
  | TextExportOptions
  | CSVExportOptions
  | MarkdownExportOptions
  | JUnitExportOptions
  | HTMLExportOptions
  | SARIFExportOptions;

export const REPORT_FORMATS: ExportFormat[] = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Machine-readable JSON format with complete analysis data',
    extension: 'json',
    mimeType: 'application/json',
    supportsSummary: true,
    supportsIssues: true,
    supportsMetrics: true,
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Human-readable text format suitable for terminal output',
    extension: 'txt',
    mimeType: 'text/plain',
    supportsSummary: true,
    supportsIssues: true,
    supportsMetrics: true,
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Comma-separated values for spreadsheet analysis and data processing',
    extension: 'csv',
    mimeType: 'text/csv',
    supportsSummary: false,
    supportsIssues: true,
    supportsMetrics: false,
  },
  {
    id: 'md',
    name: 'Markdown',
    description: 'Markdown format for documentation and README files',
    extension: 'md',
    mimeType: 'text/markdown',
    supportsSummary: true,
    supportsIssues: true,
    supportsMetrics: true,
  },
  {
    id: 'junit',
    name: 'JUnit XML',
    description: 'JUnit XML format for CI/CD integration and test reporting',
    extension: 'xml',
    mimeType: 'application/xml',
    supportsSummary: false,
    supportsIssues: true,
    supportsMetrics: false,
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'HTML format for web-based reporting with interactive features',
    extension: 'html',
    mimeType: 'text/html',
    supportsSummary: true,
    supportsIssues: true,
    supportsMetrics: true,
  },
  {
    id: 'sarif',
    name: 'SARIF',
    description: 'Static Analysis Results Interchange Format for tool integration',
    extension: 'sarif',
    mimeType: 'application/sarif+json',
    supportsSummary: false,
    supportsIssues: true,
    supportsMetrics: false,
  },
];

export const DEFAULT_EXPORT_OPTIONS = {
  includeSummary: true,
  includeIssues: true,
  includeMetrics: true,
  includeFixed: false,
};

export const FORMAT_SPECIFIC_OPTIONS = {
  json: {
    ...DEFAULT_EXPORT_OPTIONS,
    prettyPrint: true,
    includeRawData: false,
  },
  txt: {
    ...DEFAULT_EXPORT_OPTIONS,
    maxMessageLength: 120,
    includeTimestamps: true,
  },
  csv: {
    ...DEFAULT_EXPORT_OPTIONS,
    includeHeaders: true,
    delimiter: ',',
    quoteFields: true,
  },
  md: {
    ...DEFAULT_EXPORT_OPTIONS,
    includeTableOfContents: true,
    includeSeverityIcons: true,
    maxMessageLength: 100,
  },
  junit: {
    includeSummary: false,
    includeIssues: true,
    includeMetrics: false,
    includeFixed: false,
    package: 'dev-quality.analysis',
    classname: 'CodeQualityTest',
  },
  html: {
    ...DEFAULT_EXPORT_OPTIONS,
    includeStyles: true,
    includeScripts: false,
    theme: 'light',
  },
  sarif: {
    includeSummary: false,
    includeIssues: true,
    includeMetrics: false,
    includeFixed: false,
    version: '2.1.0',
    includeLevel: true,
    includeLocation: true,
  },
};

export function getFormatById(formatId: string): ExportFormat | undefined {
  return REPORT_FORMATS.find(format => format.id === formatId);
}

export function getOptionsForFormat(formatId: string): ExportOptions {
  const options = FORMAT_SPECIFIC_OPTIONS[formatId as keyof typeof FORMAT_SPECIFIC_OPTIONS];
  return (options ?? DEFAULT_EXPORT_OPTIONS) as ExportOptions;
}

export function validateExportOptions(
  formatId: string,
  _options: Partial<ExportOptions>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const format = getFormatById(formatId);

  if (!format) {
    errors.push(`Unknown format: ${formatId}`);
    return { valid: false, errors };
  }

  // Validate summary inclusion
  if (_options.includeSummary && !format.supportsSummary) {
    errors.push(`${format.name} does not support summary export`);
  }

  // Validate metrics inclusion
  if (_options.includeMetrics && !format.supportsMetrics) {
    errors.push(`${format.name} does not support metrics export`);
  }

  // Validate issues inclusion
  if (_options.includeIssues && !format.supportsIssues) {
    errors.push(`${format.name} does not support issues export`);
  }

  return { valid: errors.length === 0, errors };
}
