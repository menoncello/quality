/**
 * Dashboard state management using Zustand
 */

import { create } from 'zustand';
import type {
  CLIDashboardState,
  DashboardView,
  FilterState,
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
}));
