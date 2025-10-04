import { create } from 'zustand';
import type { CoverageReport, EnhancedCoverageData } from '@dev-quality/core';

interface CoverageState {
  // Current data
  currentReport: CoverageReport | null;
  currentCoverage: EnhancedCoverageData | null;
  isLoading: boolean;
  error: string | null;

  // View state
  currentView: 'summary' | 'files' | 'critical-paths' | 'recommendations';
  sortBy: 'coverage' | 'risk' | 'path';
  filterOptions: {
    minCoverage: number;
    maxRisk: number;
    showUncoveredOnly: boolean;
  };

  // Historical data
  historicalReports: CoverageReport[];
  trends: Array<{
    date: string;
    totalCoverage: number;
    qualityScore: number;
    riskScore: number;
  }>;

  // Actions
  setReport: (report: CoverageReport) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentView: (view: CoverageState['currentView']) => void;
  setSortBy: (sortBy: CoverageState['sortBy']) => void;
  setFilterOptions: (options: Partial<CoverageState['filterOptions']>) => void;
  addHistoricalReport: (report: CoverageReport) => void;
  clearHistoricalData: () => void;
  refreshData: () => Promise<void>;
  exportReport: (
    format: 'json' | 'html' | 'markdown' | 'csv',
    outputPath?: string
  ) => Promise<string>;
}

export const useCoverageStore = create<CoverageState>((set, get) => ({
  // Initial state
  currentReport: null,
  currentCoverage: null,
  isLoading: false,
  error: null,

  currentView: 'summary',
  sortBy: 'coverage',
  filterOptions: {
    minCoverage: 0,
    maxRisk: 10,
    showUncoveredOnly: false,
  },

  historicalReports: [],
  trends: [],

  // Actions
  setReport: report => {
    set({
      currentReport: report,
      currentCoverage: report.coverage,
      error: null,
    });
  },

  setLoading: loading => {
    set({ isLoading: loading });
  },

  setError: error => {
    set({ error, isLoading: false });
  },

  setCurrentView: view => {
    set({ currentView: view });
  },

  setSortBy: sortBy => {
    set({ sortBy });
  },

  setFilterOptions: options => {
    set(state => ({
      filterOptions: { ...state.filterOptions, ...options },
    }));
  },

  addHistoricalReport: report => {
    set(state => ({
      historicalReports: [...state.historicalReports.slice(-29), report], // Keep last 30
    }));
  },

  clearHistoricalData: () => {
    set({
      historicalReports: [],
      trends: [],
    });
  },

  refreshData: async () => {
    const state = get();
    if (!state.currentReport) return;

    try {
      state.setLoading(true);

      // Re-run analysis with current configuration
      const { CoverageAnalysisEngine } = await import('@dev-quality/core');
      const _engine = new CoverageAnalysisEngine();

      // This would need to be implemented to get the current context
      // For now, we'll just simulate a refresh
      setTimeout(() => {
        state.setLoading(false);
      }, 1000);
    } catch (error) {
      state.setError(error instanceof Error ? error.message : 'Failed to refresh data');
    }
  },

  exportReport: async (format, outputPath) => {
    const state = get();
    if (!state.currentReport) {
      throw new Error('No report data available to export');
    }

    try {
      const { CoverageAnalysisEngine } = await import('@dev-quality/core');
      const engine = new CoverageAnalysisEngine();

      return await engine.exportReport(state.currentReport, format, outputPath);
    } catch (error) {
      throw new Error(`Failed to export report: ${error}`);
    }
  },
}));
