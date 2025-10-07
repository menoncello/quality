/**
 * Dashboard-specific type definitions
 */

import type { Issue } from './analysis';

export type IssueSeverity = 'error' | 'warning' | 'info';

export type SortField =
  | 'score'
  | 'severity'
  | 'filePath'
  | 'toolName'
  | 'lineNumber'
  | 'priority'
  | 'impact'
  | 'effort'
  | 'businessValue';

export type SortOrder = 'asc' | 'desc';

export type DashboardView =
  | 'dashboard'
  | 'issue-list'
  | 'issue-details'
  | 'comparison'
  | 'trends'
  | 'layout-customization';

export interface FilterState {
  severity: IssueSeverity[];
  tools: string[];
  filePaths: string[];
  fixable: boolean | null;
  minScore: number | null;
  maxScore: number | null;
  searchQuery: string;
  // Priority-based filtering
  priorityLevels: string[]; // 'critical', 'high', 'medium', 'low'
  minPriorityScore: number | null;
  maxPriorityScore: number | null;
  triageActions: string[]; // 'fix-now', 'schedule', 'delegate', 'monitor', 'ignore'
  classificationCategories: string[]; // 'bug', 'performance', 'security', 'maintainability', 'documentation', 'feature'
}

export interface NavigationState {
  selectedIndex: number;
  navigationHistory: Array<{
    view: DashboardView;
    selectedIndex: number;
    timestamp: Date;
  }>;
}

export interface DashboardUIState {
  currentView: DashboardView;
  currentPage: number;
  itemsPerPage: number;
  sortBy: SortField;
  sortOrder: SortOrder;
  isFilterMenuOpen: boolean;
  isExportMenuOpen: boolean;
}

export interface DashboardResultsState {
  currentResult: import('./analysis').AnalysisResult | null;
  filteredIssues: import('./analysis').Issue[];
  selectedIssue: import('./analysis').Issue | null;
  filters: FilterState;
  isAnalyzing: boolean;
  analysisProgress: import('./analysis').AnalysisProgress | null;
}

export interface CLIDashboardState {
  results: DashboardResultsState;
  ui: DashboardUIState;
  navigation: NavigationState;
}

export interface VirtualizationConfig {
  windowSize: number;
  bufferItems: number;
  totalItems: number;
  scrollTop: number;
}

export interface DashboardExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
}

export interface DashboardData {
  analysisResult: import('./analysis').AnalysisResult;
  filteredIssues: import('./analysis').Issue[];
  metrics: DashboardMetrics;
  summary: DashboardSummary;
}

export interface DashboardMetrics {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
  overallScore: number;
  coverage: import('./analysis').CoverageData | null;
  toolsAnalyzed: number;
  duration: number;
}

export interface DashboardSummary {
  topIssues: import('./analysis').Issue[];
  mostAffectedFiles: Array<{
    filePath: string;
    issueCount: number;
    severity: IssueSeverity;
  }>;
  toolSummary: Array<{
    toolName: string;
    issueCount: number;
    score: number;
  }>;
}

// Prioritization integration types
export interface DashboardPrioritizationState {
  prioritizedIssues: import('@dev-quality/types').IssuePrioritization[];
  isProcessingPrioritization: boolean;
  prioritizationProgress: number;
  prioritizationError: string | null;
  lastPrioritizedAt: Date | null;
}

// Extended Issue interface with priority data
export interface IssueWithPriority extends Issue {
  priority?: import('@dev-quality/types').IssuePrioritization;
  priorityScore?: number;
  priorityLevel?: 'critical' | 'high' | 'medium' | 'low';
  triageSuggestion?: import('@dev-quality/types').TriageSuggestion;
}

// Real-time update types
export interface RealTimeUpdateEvent {
  type: 'analysis-progress' | 'analysis-complete' | 'issue-found' | 'priority-updated';
  timestamp: Date;
  data: unknown;
}

// Layout customization types
export interface WidgetConfig {
  id: string;
  type: 'summary' | 'issues' | 'coverage' | 'trends' | 'comparison' | 'custom';
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, unknown>;
  visible: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  isPreset: boolean;
  widgets: WidgetConfig[];
  createdAt: Date;
  updatedAt: Date;
}

// IDE integration types
export interface IDELink {
  protocol: 'vscode' | 'idea' | 'file';
  path: string;
  line?: number;
  column?: number;
}

export interface NavigationBreadcrumb {
  id: string;
  label: string;
  view: DashboardView;
  data?: Record<string, unknown>;
}

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number; // milliseconds
  memoryUsage: number; // MB
  filterTime: number; // milliseconds
  searchTime: number; // milliseconds
  updateFrequency: number; // updates per second
  datasetSize: number; // number of issues
}
