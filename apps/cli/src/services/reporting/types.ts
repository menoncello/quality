/**
 * Shared types for reporting system
 * Consistent type definitions used across all formatters and services
 */

import type { AnalysisResult, Issue } from '../../types/analysis';

export type ReportFormat = 'json' | 'html' | 'markdown' | 'pdf';

export interface ReportData {
  metadata: {
    title: string;
    description?: string;
    version: string;
    generatedAt: string;
    reportId: string;
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

export interface Metrics {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
  coverage?: {
    lines: { percentage: number; covered: number; total: number };
    functions: { percentage: number; covered: number; total: number };
    branches: { percentage: number; covered: number; total: number };
    statements: { percentage: number; covered: number; total: number };
  };
  toolResults?: Array<{
    toolName: string;
    status: string;
    executionTime: number;
    metrics: { score: number; issuesCount: number };
    issues: Issue[];
    coverage?: unknown;
  }>;
  performance?: unknown;
  complexity?: unknown;
  maintainability?: unknown;
  reliability?: unknown;
  security?: unknown;
}