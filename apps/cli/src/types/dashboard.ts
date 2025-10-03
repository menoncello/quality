/**
 * Dashboard-specific type definitions
 */

export type IssueSeverity = 'error' | 'warning' | 'info';

export type SortField = 'score' | 'severity' | 'filePath' | 'toolName' | 'lineNumber';

export type SortOrder = 'asc' | 'desc';

export type DashboardView = 'dashboard' | 'issue-list' | 'issue-details';

export interface FilterState {
  severity: IssueSeverity[];
  tools: string[];
  filePaths: string[];
  fixable: boolean | null;
  minScore: number | null;
  maxScore: number | null;
  searchQuery: string;
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
