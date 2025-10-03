/**
 * Export format type definitions
 */

export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  mimeType: string;
  supportsSummary: boolean;
  supportsIssues: boolean;
  supportsMetrics: boolean;
}

// Define base export options interface
export interface BaseExportOptions {
  includeSummary: boolean;
  includeIssues: boolean;
  includeMetrics: boolean;
  includeFixed: boolean;
  outputPath?: string;
}

// Create a unified ExportOptions type that works for all formats
export type ExportOptions = BaseExportOptions & {
  // SARIF specific properties
  version?: string;
  includeLevel?: boolean;
  includeLocation?: boolean;
};

export interface ExportRequest {
  format: ExportFormat;
  data: {
    analysisResult: import('./analysis').AnalysisResult;
    filteredIssues: import('@dev-quality/core').Issue[];
    metrics: import('./dashboard').DashboardMetrics;
  };
  options: {
    includeSummary: boolean;
    includeIssues: boolean;
    includeMetrics: boolean;
    includeFixed: boolean;
    outputPath?: string;
  };
}

export interface ExportResult {
  success: boolean;
  outputPath: string;
  size: number;
  format: ExportFormat;
  timestamp: Date;
  error?: string;
}

export interface ExportProgress {
  currentStep: string;
  percentage: number;
  estimatedTimeRemaining?: number;
  bytesWritten?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  format: ExportFormat;
  template: string;
  variables: Record<string, string>;
}
