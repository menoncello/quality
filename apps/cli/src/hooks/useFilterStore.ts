/**
 * Filter Store Hook
 * Manages filter state for dashboard issue filtering and search
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Issue } from '../types/analysis';
import {
  sanitizeSearchQuery,
  validateRegexPattern,
  sanitizeFilterValue,
  validateScoreRange,
  sanitizePresetName,
  sanitizePresetDescription,
  sanitizeInput,
  RateLimiter,
} from '../utils/input-validation';

export interface FilterCriteria {
  severity?: string[];
  tools?: string[];
  priority?: string[];
  files?: string[];
  modules?: string[];
  scoreRange?: [number, number];
  hasFix?: boolean;
  isAssigned?: boolean;
}

export interface SearchCriteria {
  query: string;
  fields: ('message' | 'filePath' | 'ruleId' | 'toolName')[];
  caseSensitive: boolean;
  useRegex: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  criteria: FilterCriteria;
  search: SearchCriteria;
  createdAt: Date;
  isDefault: boolean;
}

export interface FilterState {
  // Filter criteria
  filters: FilterCriteria;
  search: SearchCriteria;

  // UI state
  isFilterPanelOpen: boolean;
  activeFilters: string[];
  filterResults: Issue[];
  totalResults: number;
  isLoading: boolean;
  lastError?: string;

  // Presets
  presets: FilterPreset[];
  currentPresetId?: string;

  // Rate limiting
  searchRateLimiter: RateLimiter;
  filterRateLimiter: RateLimiter;

  // Actions
  setFilters: (filters: Partial<FilterCriteria>) => void;
  setSearch: (search: Partial<SearchCriteria>) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  resetAll: () => void;

  // Filter panel UI
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;

  // Preset management
  savePreset: (name: string, description: string) => { success: boolean; error?: string };
  loadPreset: (presetId: string) => { success: boolean; error?: string };
  deletePreset: (presetId: string) => { success: boolean; error?: string };
  setDefaultPreset: (presetId: string) => { success: boolean; error?: string };

  // Filter application
  applyFilters: (issues: Issue[]) => Issue[];
  setActiveFilters: (filters: string[]) => void;
  setFilterResults: (results: Issue[]) => void;
  setIsLoading: (loading: boolean) => void;

  // Performance optimization
  debouncedApplyFilters: (issues: Issue[]) => void;

  // Validation
  validateSearchQuery: (query: string) => { isValid: boolean; error?: string };
  validateFilterValue: (value: string, type: string) => { isValid: boolean; sanitized: string };
}

const defaultFilters: FilterCriteria = {
  severity: [],
  tools: [],
  priority: [],
  files: [],
  modules: [],
  scoreRange: [1, 10],
  hasFix: undefined,
  isAssigned: undefined,
};

const defaultSearch: SearchCriteria = {
  query: '',
  fields: ['message', 'filePath', 'ruleId', 'toolName'],
  caseSensitive: false,
  useRegex: false,
};

const defaultPresets: FilterPreset[] = [
  {
    id: 'critical-security',
    name: 'Critical Security Issues',
    description: 'High-priority security vulnerabilities',
    criteria: {
      severity: ['error'],
      priority: ['critical', 'high'],
      scoreRange: [8, 10],
    },
    search: defaultSearch,
    createdAt: new Date('2025-01-01'),
    isDefault: false,
  },
  {
    id: 'performance-issues',
    name: 'Performance Issues',
    description: 'Performance-related problems',
    criteria: {
      tools: ['eslint', 'typescript'],
      priority: ['high', 'medium'],
      scoreRange: [6, 10],
    },
    search: defaultSearch,
    createdAt: new Date('2025-01-01'),
    isDefault: false,
  },
  {
    id: 'fixable-issues',
    name: 'Fixable Issues',
    description: 'Issues that can be automatically fixed',
    criteria: {
      hasFix: true,
      scoreRange: [5, 10],
    },
    search: defaultSearch,
    createdAt: new Date('2025-01-01'),
    isDefault: true,
  },
];

/**
 * Validate preset data structure
 */
function validatePresetData(preset: FilterPreset): { isValid: boolean; error?: string } {
  if (!preset || typeof preset !== 'object') {
    return { isValid: false, error: 'Invalid preset data' };
  }

  if (!preset.name || typeof preset.name !== 'string') {
    return { isValid: false, error: 'Preset name is required' };
  }

  if (!preset.criteria || typeof preset.criteria !== 'object') {
    return { isValid: false, error: 'Invalid filter criteria' };
  }

  if (!preset.search || typeof preset.search !== 'object') {
    return { isValid: false, error: 'Invalid search criteria' };
  }

  // Validate score range if present
  if (preset.criteria.scoreRange) {
    const validation = validateScoreRange(
      preset.criteria.scoreRange[0],
      preset.criteria.scoreRange[1]
    );
    if (!validation.isValid) {
      return { isValid: false, error: 'Invalid score range in preset' };
    }
  }

  // Validate search query if present
  if (preset.search.query) {
    const sanitized = sanitizeSearchQuery(preset.search.query);
    if (!sanitized) {
      return { isValid: false, error: 'Invalid search query in preset' };
    }
  }

  return { isValid: true };
}

// Create a debounce function
function debounce<T extends unknown[]>(func: (...args: T) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      // Initial state
      filters: defaultFilters,
      search: defaultSearch,
      isFilterPanelOpen: false,
      activeFilters: [],
      filterResults: [],
      totalResults: 0,
      isLoading: false,
      presets: defaultPresets,
      currentPresetId: 'fixable-issues',
      searchRateLimiter: new RateLimiter(100), // 100ms between searches
      filterRateLimiter: new RateLimiter(50), // 50ms between filter changes

      // Filter actions
      setFilters: newFilters => {
        const state = get();

        // Rate limiting check
        if (!state.filterRateLimiter.canMakeRequest()) {
          set({ lastError: 'Filter changes are rate limited. Please wait a moment.' });
          return;
        }

        // Validate and sanitize filter values
        const sanitizedFilters: Partial<FilterCriteria> = {};

        if (newFilters.severity) {
          sanitizedFilters.severity = newFilters.severity
            .map(s => sanitizeFilterValue(s, 'severity'))
            .filter(Boolean);
        }

        if (newFilters.tools) {
          sanitizedFilters.tools = newFilters.tools
            .map(t => sanitizeFilterValue(t, 'tool'))
            .filter(Boolean);
        }

        if (newFilters.priority) {
          sanitizedFilters.priority = newFilters.priority
            .map(p => sanitizeFilterValue(p, 'priority'))
            .filter(Boolean);
        }

        if (newFilters.files) {
          sanitizedFilters.files = newFilters.files
            .map(f => sanitizeFilterValue(f, 'file'))
            .filter(Boolean);
        }

        if (newFilters.modules) {
          sanitizedFilters.modules = newFilters.modules
            .map(m => sanitizeFilterValue(m, 'module'))
            .filter(Boolean);
        }

        if (newFilters.scoreRange) {
          const validation = validateScoreRange(newFilters.scoreRange[0], newFilters.scoreRange[1]);
          if (validation.isValid) {
            sanitizedFilters.scoreRange = validation.sanitized;
          }
        }

        if (newFilters.hasFix !== undefined) {
          sanitizedFilters.hasFix = Boolean(newFilters.hasFix);
        }

        set(prevState => ({
          filters: { ...prevState.filters, ...sanitizedFilters },
          currentPresetId: undefined, // Clear preset when manually changing filters
          lastError: undefined,
        }));
      },

      setSearch: newSearch => {
        const state = get();

        // Rate limiting check for search queries
        if (newSearch.query && !state.searchRateLimiter.canMakeRequest()) {
          set({ lastError: 'Search queries are rate limited. Please wait a moment.' });
          return;
        }

        // Validate and sanitize search criteria
        const sanitizedSearch: Partial<SearchCriteria> = {};

        if (newSearch.query !== undefined) {
          sanitizedSearch.query = sanitizeSearchQuery(newSearch.query);
        }

        if (newSearch.fields) {
          // Ensure fields are valid and remove duplicates
          const validFields = ['message', 'filePath', 'ruleId', 'toolName'];
          sanitizedSearch.fields = [
            ...new Set(newSearch.fields.filter(f => validFields.includes(f))),
          ];
        }

        if (newSearch.caseSensitive !== undefined) {
          sanitizedSearch.caseSensitive = Boolean(newSearch.caseSensitive);
        }

        if (newSearch.useRegex !== undefined) {
          // Validate regex pattern if enabled
          if (newSearch.useRegex && state.search.query) {
            const validation = validateRegexPattern(state.search.query);
            if (!validation.isValid) {
              set({ lastError: `Invalid regex pattern: ${validation.error}` });
              return;
            }
          }
          sanitizedSearch.useRegex = Boolean(newSearch.useRegex);
        }

        set(prevState => ({
          search: { ...prevState.search, ...sanitizedSearch },
          currentPresetId: undefined, // Clear preset when manually changing search
          lastError: undefined,
        }));
      },

      clearFilters: () =>
        set({
          filters: defaultFilters,
          currentPresetId: undefined,
        }),

      clearSearch: () =>
        set({
          search: defaultSearch,
          currentPresetId: undefined,
        }),

      resetAll: () =>
        set({
          filters: defaultFilters,
          search: defaultSearch,
          currentPresetId: 'fixable-issues',
          activeFilters: [],
          filterResults: [],
          totalResults: 0,
        }),

      // UI actions
      toggleFilterPanel: () => set(state => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),

      setFilterPanelOpen: open => set({ isFilterPanelOpen: open }),

      // Preset management
      savePreset: (name, description) => {
        try {
          // Validate and sanitize inputs
          const sanitizedName = sanitizePresetName(name);
          const sanitizedDescription = sanitizePresetDescription(description);

          if (!sanitizedName) {
            return { success: false, error: 'Invalid preset name' };
          }

          const state = get();
          const newPreset: FilterPreset = {
            id: `custom-${Date.now()}`,
            name: sanitizedName,
            description: sanitizedDescription,
            criteria: { ...state.filters },
            search: { ...state.search },
            createdAt: new Date(),
            isDefault: false,
          };

          set(prevState => ({
            presets: [...prevState.presets, newPreset],
            currentPresetId: newPreset.id,
            lastError: undefined,
          }));

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save preset',
          };
        }
      },

      loadPreset: presetId => {
        try {
          const preset = get().presets.find(p => p.id === presetId);
          if (!preset) {
            return { success: false, error: 'Preset not found' };
          }

          // Validate preset data before loading
          const validation = validatePresetData(preset);
          if (!validation.isValid) {
            return { success: false, error: validation.error };
          }

          set({
            filters: { ...preset.criteria },
            search: { ...preset.search },
            currentPresetId: presetId,
            lastError: undefined,
          });

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to load preset',
          };
        }
      },

      deletePreset: presetId => {
        try {
          const state = get();
          const isDefaultPreset = defaultPresets.some(p => p.id === presetId);

          if (isDefaultPreset) {
            return { success: false, error: 'Cannot delete default presets' };
          }

          const newPresets = state.presets.filter(p => p.id !== presetId);
          const newCurrentPreset =
            state.currentPresetId === presetId ? 'fixable-issues' : state.currentPresetId;

          set({
            presets: newPresets,
            currentPresetId: newCurrentPreset,
            lastError: undefined,
          });

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete preset',
          };
        }
      },

      setDefaultPreset: presetId => {
        try {
          const preset = get().presets.find(p => p.id === presetId);
          if (!preset) {
            return { success: false, error: 'Preset not found' };
          }

          set(state => ({
            presets: state.presets.map(p => ({
              ...p,
              isDefault: p.id === presetId,
            })),
            lastError: undefined,
          }));

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to set default preset',
          };
        }
      },

      // Filter application
      applyFilters: issues => {
        const state = get();
        let filteredIssues = [...issues];

        // Apply filter criteria
        const { filters, search } = state;

        // Filter by severity
        if (filters.severity && filters.severity.length > 0) {
          filteredIssues = filteredIssues.filter(
            issue => filters.severity?.includes(issue.type) ?? false
          );
        }

        // Filter by tools
        if (filters.tools && filters.tools.length > 0) {
          filteredIssues = filteredIssues.filter(
            issue => filters.tools?.includes(issue.toolName) ?? false
          );
        }

        // Filter by priority (if we have priority information)
        if (filters.priority && filters.priority.length > 0) {
          filteredIssues = filteredIssues.filter(issue => {
            const priority = getPriorityFromScore(issue.score);
            return filters.priority?.includes(priority) ?? false;
          });
        }

        // Filter by files
        if (filters.files && filters.files.length > 0) {
          filteredIssues = filteredIssues.filter(
            issue => filters.files?.some(file => issue.filePath.includes(file)) ?? false
          );
        }

        // Filter by modules
        if (filters.modules && filters.modules.length > 0) {
          filteredIssues = filteredIssues.filter(
            issue => filters.modules?.some(module => issue.filePath.includes(module)) ?? false
          );
        }

        // Filter by score range
        if (filters.scoreRange) {
          const [minScore, maxScore] = filters.scoreRange;
          filteredIssues = filteredIssues.filter(
            issue => issue.score >= minScore && issue.score <= maxScore
          );
        }

        // Filter by fixable status
        if (filters.hasFix !== undefined) {
          filteredIssues = filteredIssues.filter(issue => issue.fixable === filters.hasFix);
        }

        // Apply search criteria
        if (search.query.trim()) {
          const searchFields = search.fields;
          const query = search.caseSensitive ? search.query : search.query.toLowerCase();

          filteredIssues = filteredIssues.filter(issue => {
            return searchFields.some(field => {
              const value = String(issue[field as keyof Issue] ?? '');
              const searchValue = search.caseSensitive ? value : value.toLowerCase();

              if (search.useRegex) {
                try {
                  const regex = new RegExp(query, search.caseSensitive ? 'g' : 'gi');
                  return regex.test(searchValue);
                } catch {
                  // Invalid regex, fall back to contains search
                  return searchValue.includes(query);
                }
              }

              return searchValue.includes(query);
            });
          });
        }

        set({
          filterResults: filteredIssues,
          totalResults: filteredIssues.length,
          isLoading: false,
        });

        return filteredIssues;
      },

      setActiveFilters: filters => set({ activeFilters: filters }),

      setFilterResults: results => set({ filterResults: results }),

      setIsLoading: loading => set({ isLoading: loading }),

      // Debounced version for performance
      debouncedApplyFilters: debounce((issues: Issue[]) => {
        get().applyFilters(issues);
      }, 300),

      // Validation methods
      validateSearchQuery: (query: string) => {
        const sanitized = sanitizeSearchQuery(query);
        if (!sanitized && query.trim()) {
          return { isValid: false, error: 'Invalid search query' };
        }
        return { isValid: true };
      },

      validateFilterValue: (value: string, type: string) => {
        let sanitized = '';

        switch (type) {
          case 'severity':
            sanitized = sanitizeFilterValue(value, 'severity');
            break;
          case 'tool':
            sanitized = sanitizeFilterValue(value, 'tool');
            break;
          case 'priority':
            sanitized = sanitizeFilterValue(value, 'priority');
            break;
          case 'file':
            sanitized = sanitizeFilterValue(value, 'file');
            break;
          case 'module':
            sanitized = sanitizeFilterValue(value, 'module');
            break;
          default:
            sanitized = sanitizeInput(value, 'filter');
        }

        return {
          isValid: sanitized.length > 0,
          sanitized,
        };
      },
    }),
    {
      name: 'filter-store',
      partialize: state => ({
        filters: state.filters,
        search: state.search,
        presets: state.presets,
        currentPresetId: state.currentPresetId,
        isFilterPanelOpen: state.isFilterPanelOpen,
      }),
    }
  )
);

/**
 * Helper function to get priority level from score
 */
function getPriorityFromScore(score: number): string {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}
