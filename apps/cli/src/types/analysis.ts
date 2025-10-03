/**
 * Unified type definitions for CLI dashboard
 * All types re-exported from core package to ensure consistency
 */

import type {
  AnalysisResult as _CoreAnalysisResult,
  Issue as CoreIssue,
  ToolResult as CoreToolResult,
} from '@dev-quality/core';

// Re-export core types as needed
export type { AnalysisProgress } from '@dev-quality/core';

// ResultSummary interface (defined locally since not exported from core)
export interface ResultSummary {
  totalIssues: number;
  totalErrors: number;
  totalWarnings: number;
  totalFixable: number;
  overallScore: number;
  toolCount: number;
  executionTime: number;
}

// AIPrompt interface (defined locally since not exported from core)
export interface AIPrompt {
  id: string;
  type: string;
  title: string;
  description: string;
  issues: Issue[];
  priority: 'low' | 'medium' | 'high';
}

// Extended Issue interface with strict type constraints for CLI usage
export interface Issue extends Omit<CoreIssue, 'type'> {
  type: 'error' | 'warning' | 'info';
}

// Extended ToolMetrics to match core's index signature
export interface ToolMetrics {
  issuesCount: number;
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
  fixableCount: number;
  score: number;
  coverage?: CoverageData;
  [key: string]: unknown;
}

// CoverageData interface
export interface CoverageData {
  lines: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  statements: { total: number; covered: number; percentage: number };
}

// Extended ToolResult interface for CLI with specific Issue type
export interface ExtendedToolResult {
  toolName: string;
  executionTime: number;
  status: 'success' | 'error' | 'warning';
  issues: Issue[];
  metrics: ToolMetrics;
  coverage?: CoverageData;
  [key: string]: unknown;
}

// Main AnalysisResult interface for CLI with timestamp as string
export interface AnalysisResult {
  id: string;
  projectId: string;
  timestamp: string; // ISO string instead of Date
  duration: number;
  overallScore: number;
  toolResults: ExtendedToolResult[];
  summary: ResultSummary;
  aiPrompts: AIPrompt[];
}

// Re-export CoreToolResult as ToolResult for compatibility
export { CoreToolResult as ToolResult };
