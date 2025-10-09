/**
 * Dashboard state management using Zustand
 */

import { create } from 'zustand';
import type {
  CLIDashboardState,
  DashboardView,
  FilterState,
  RealTimeUpdateEvent,
  DashboardLayout,
  PerformanceMetrics,
  NavigationBreadcrumb,
  // NavigationState,
  // DashboardUIState,
  // DashboardResultsState,
  SortField,
  SortOrder,
} from '../types/dashboard';
import type { AnalysisResult, Issue, AnalysisProgress } from '../types/analysis';
import { transformCoreIssuesToCLI as _transformCoreIssuesToCLI } from '../utils/type-transformers';

interface DashboardStore extends CLIDashboardState {
  // Direct access properties for backward compatibility
  currentView: DashboardView;
  filteredIssues: Issue[];
  selectedIssue: Issue | null;
  isAnalyzing: boolean;
  analysisProgress: AnalysisProgress | null;
  filters: FilterState;
  currentPage: number;
  itemsPerPage: number;
  sortBy: SortField;
  sortOrder: SortOrder;
  selectedIndex: number;
  currentResult: AnalysisResult | null;

  // Prioritization state
  prioritizedIssues: import('@dev-quality/types').IssuePrioritization[];
  isProcessingPrioritization: boolean;
  prioritizationProgress: number;
  prioritizationError: string | null;
  lastPrioritizedAt: Date | null;

  // Enhanced features state
  realTimeUpdates: RealTimeUpdateEvent[];
  currentLayout: DashboardLayout | null;
  availableLayouts: DashboardLayout[];
  navigationBreadcrumbs: NavigationBreadcrumb[];
  performanceMetrics: PerformanceMetrics | null;

  // Results actions
  setAnalysisResult: (result: AnalysisResult | null) => void;
  updateFilteredIssues: (issues: Issue[]) => void;
  setSelectedIssue: (issue: Issue | null) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  setAnalysisProgress: (progress: AnalysisProgress | null) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;

  // UI actions
  setCurrentView: (view: DashboardView) => void;
  setCurrentPage: (page: number) => void;
  setSortOrder: (field: SortField, order: SortOrder) => void;
  setItemsPerPage: (count: number) => void;
  toggleFilterMenu: () => void;
  toggleExportMenu: () => void;

  // Navigation actions
  setSelectedIndex: (index: number) => void;
  addToNavigationHistory: (view: DashboardView, selectedIndex: number) => void;
  goBack: () => void;

  // Prioritization actions
  setPrioritizationData: (
    prioritizations: import('@dev-quality/types').IssuePrioritization[]
  ) => void;
  setProcessingPrioritization: (isProcessing: boolean) => void;
  setPrioritizationProgress: (progress: number) => void;
  setPrioritizationError: (error: string | null) => void;
  filterByPriority: (priorityLevels: string[]) => void;
  sortByPriority: (order: SortOrder) => void;

  // Real-time update actions
  addRealTimeUpdate: (update: RealTimeUpdateEvent) => void;
  clearRealTimeUpdates: () => void;

  // Layout management actions
  setCurrentLayout: (layout: DashboardLayout) => void;
  addAvailableLayout: (layout: DashboardLayout) => void;
  updateLayoutWidget: (
    widgetId: string,
    updates: Partial<import('../types/dashboard').WidgetConfig>
  ) => void;

  // Navigation actions
  addNavigationBreadcrumb: (breadcrumb: NavigationBreadcrumb) => void;
  removeNavigationBreadcrumb: (breadcrumbId: string) => void;
  clearNavigationBreadcrumbs: () => void;

  // Performance monitoring actions
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;

  // Utility actions
  resetDashboard: () => void;
  clearFilters: () => void;
}

const initialState: CLIDashboardState = {
  results: {
    currentResult: null,
    filteredIssues: [],
    selectedIssue: null,
    filters: {
      severity: ['error', 'warning', 'info'],
      tools: [],
      filePaths: [],
      fixable: null,
      minScore: null,
      maxScore: null,
      searchQuery: '',
      // Priority-based filtering defaults
      priorityLevels: ['critical', 'high', 'medium', 'low'],
      minPriorityScore: null,
      maxPriorityScore: null,
      triageActions: [],
      classificationCategories: [],
    },
    isAnalyzing: false,
    analysisProgress: null,
  },
  ui: {
    currentView: 'dashboard',
    currentPage: 1,
    itemsPerPage: 10,
    sortBy: 'score',
    sortOrder: 'desc',
    isFilterMenuOpen: false,
    isExportMenuOpen: false,
  },
  navigation: {
    selectedIndex: 0,
    navigationHistory: [],
  },
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initialize with direct access properties from nested state
  currentView: initialState.ui.currentView,
  filteredIssues: initialState.results.filteredIssues,
  selectedIssue: initialState.results.selectedIssue,
  isAnalyzing: initialState.results.isAnalyzing,
  analysisProgress: initialState.results.analysisProgress,
  filters: initialState.results.filters,
  currentPage: initialState.ui.currentPage,
  itemsPerPage: initialState.ui.itemsPerPage,
  sortBy: initialState.ui.sortBy,
  sortOrder: initialState.ui.sortOrder,
  selectedIndex: initialState.navigation.selectedIndex,
  currentResult: initialState.results.currentResult,

  // Initialize prioritization state
  prioritizedIssues: [],
  isProcessingPrioritization: false,
  prioritizationProgress: 0,
  prioritizationError: null,
  lastPrioritizedAt: null,

  // Initialize enhanced features state
  realTimeUpdates: [],
  currentLayout: null,
  availableLayouts: [],
  navigationBreadcrumbs: [],
  performanceMetrics: null,

  ...initialState,

  // Results actions
  setAnalysisResult: (result: AnalysisResult | null) =>
    set(state => {
      if (!result) {
        return {
          results: {
            ...state.results,
            currentResult: null,
            filteredIssues: [],
          },
          currentResult: null,
          filteredIssues: [],
        };
      }
      const transformedIssues = result.toolResults.flatMap(toolResult => toolResult.issues);
      return {
        results: {
          ...state.results,
          currentResult: result,
          filteredIssues: transformedIssues,
        },
        currentResult: result,
        filteredIssues: transformedIssues,
      };
    }),

  updateFilteredIssues: (issues: Issue[]) =>
    set(state => ({
      results: {
        ...state.results,
        filteredIssues: issues,
      },
      filteredIssues: issues,
    })),

  setSelectedIssue: (issue: Issue | null) =>
    set(state => ({
      results: {
        ...state.results,
        selectedIssue: issue,
      },
      selectedIssue: issue,
    })),

  updateFilters: (filters: Partial<FilterState>) =>
    set(state => ({
      results: {
        ...state.results,
        filters: {
          ...state.results.filters,
          ...filters,
        },
      },
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  setAnalysisProgress: (progress: AnalysisProgress | null) =>
    set(state => ({
      results: {
        ...state.results,
        analysisProgress: progress,
      },
      analysisProgress: progress,
    })),

  setAnalyzing: (isAnalyzing: boolean) =>
    set(state => ({
      results: {
        ...state.results,
        isAnalyzing,
      },
      isAnalyzing,
    })),

  // UI actions
  setCurrentView: (view: DashboardView) =>
    set(state => ({
      ui: {
        ...state.ui,
        currentView: view,
      },
      currentView: view,
    })),

  setCurrentPage: (page: number) =>
    set(state => ({
      ui: {
        ...state.ui,
        currentPage: page,
      },
      currentPage: page,
    })),

  setSortOrder: (field: SortField, order: SortOrder) =>
    set(state => ({
      ui: {
        ...state.ui,
        sortBy: field,
        sortOrder: order,
      },
      sortBy: field,
      sortOrder: order,
    })),

  setItemsPerPage: (count: number) =>
    set(state => ({
      ui: {
        ...state.ui,
        itemsPerPage: count,
      },
      itemsPerPage: count,
    })),

  toggleFilterMenu: () =>
    set(state => ({
      ui: {
        ...state.ui,
        isFilterMenuOpen: !state.ui.isFilterMenuOpen,
      },
    })),

  toggleExportMenu: () =>
    set(state => ({
      ui: {
        ...state.ui,
        isExportMenuOpen: !state.ui.isExportMenuOpen,
      },
    })),

  // Navigation actions
  setSelectedIndex: (index: number) =>
    set(state => ({
      navigation: {
        ...state.navigation,
        selectedIndex: index,
      },
      selectedIndex: index,
    })),

  addToNavigationHistory: (view: DashboardView, selectedIndex: number) =>
    set(state => ({
      navigation: {
        ...state.navigation,
        navigationHistory: [
          ...state.navigation.navigationHistory,
          {
            view,
            selectedIndex,
            timestamp: new Date(),
          },
        ],
      },
    })),

  goBack: () => {
    const { navigationHistory } = get().navigation;
    if (navigationHistory.length > 0) {
      const previousState = navigationHistory[navigationHistory.length - 1];
      if (previousState) {
        set(state => ({
          ui: {
            ...state.ui,
            currentView: previousState.view,
          },
          navigation: {
            selectedIndex: previousState.selectedIndex,
            navigationHistory: navigationHistory.slice(0, -1),
          },
          currentView: previousState.view,
          selectedIndex: previousState.selectedIndex,
        }));
      }
    }
  },

  // Utility actions
  resetDashboard: () => set(initialState),

  clearFilters: () =>
    set(state => ({
      results: {
        ...state.results,
        filters: initialState.results.filters,
      },
    })),

  // Prioritization actions
  setPrioritizationData: (prioritizations: import('@dev-quality/types').IssuePrioritization[]) =>
    set(_state => ({
      prioritizedIssues: prioritizations,
      lastPrioritizedAt: new Date(),
      prioritizationError: null,
    })),

  setProcessingPrioritization: (isProcessing: boolean) =>
    set(state => ({
      isProcessingPrioritization: isProcessing,
      prioritizationProgress: isProcessing ? 0 : state.prioritizationProgress,
    })),

  setPrioritizationProgress: (progress: number) =>
    set(_state => ({
      prioritizationProgress: Math.min(100, Math.max(0, progress)),
    })),

  setPrioritizationError: (error: string | null) =>
    set(_state => ({
      prioritizationError: error,
      isProcessingPrioritization: false,
    })),

  filterByPriority: (priorityLevels: string[]) =>
    set(_state => {
      const updatedFilters = {
        ...get().results.filters,
        priorityLevels,
      };
      return {
        results: {
          ...get().results,
          filters: updatedFilters,
        },
        filters: updatedFilters,
      };
    }),

  sortByPriority: (order: SortOrder) =>
    set(_state => ({
      ui: {
        ...get().ui,
        sortBy: 'priority',
        sortOrder: order,
      },
      sortBy: 'priority',
      sortOrder: order,
    })),

  // Real-time update actions
  addRealTimeUpdate: (update: RealTimeUpdateEvent) =>
    set(_state => ({
      realTimeUpdates: [update, ...get().realTimeUpdates.slice(0, 99)], // Keep last 100 updates
    })),

  clearRealTimeUpdates: () =>
    set(_state => ({
      realTimeUpdates: [],
    })),

  // Layout management actions
  setCurrentLayout: (layout: DashboardLayout) =>
    set(_state => ({
      currentLayout: layout,
    })),

  addAvailableLayout: (layout: DashboardLayout) =>
    set(_state => ({
      availableLayouts: [...get().availableLayouts.filter(l => l.id !== layout.id), layout],
    })),

  updateLayoutWidget: (
    widgetId: string,
    updates: Partial<import('../types/dashboard').WidgetConfig>
  ) =>
    set(state => {
      if (!state.currentLayout) return state;

      const updatedLayout = {
        ...state.currentLayout,
        widgets: state.currentLayout.widgets.map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        ),
        updatedAt: new Date(),
      };

      return {
        currentLayout: updatedLayout,
        availableLayouts: state.availableLayouts.map(layout =>
          layout.id === updatedLayout.id ? updatedLayout : layout
        ),
      };
    }),

  // Navigation actions
  addNavigationBreadcrumb: (breadcrumb: NavigationBreadcrumb) =>
    set(state => ({
      navigationBreadcrumbs: [...state.navigationBreadcrumbs, breadcrumb],
    })),

  removeNavigationBreadcrumb: (breadcrumbId: string) =>
    set(state => ({
      navigationBreadcrumbs: state.navigationBreadcrumbs.filter(b => b.id !== breadcrumbId),
    })),

  clearNavigationBreadcrumbs: () =>
    set(_state => ({
      navigationBreadcrumbs: [],
    })),

  // Performance monitoring actions
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) =>
    set(state => ({
      performanceMetrics: {
        ...state.performanceMetrics,
        ...metrics,
        timestamp: new Date(),
      } as PerformanceMetrics,
    })),
}));
