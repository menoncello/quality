/**
 * Filter and sort type definitions
 */

import type { IssueSeverity, SortField, SortOrder } from './dashboard';

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
  count?: number;
  enabled: boolean;
}

export interface FilterCategory {
  id: string;
  label: string;
  type: 'checkbox' | 'range' | 'search';
  options: FilterOption[];
  isExpanded: boolean;
}

export interface SortOption {
  field: SortField;
  label: string;
  order: SortOrder;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    severity: IssueSeverity[];
    tools: string[];
    fixable: boolean | null;
    minScore: number | null;
    maxScore: number | null;
  };
}

export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FilterStatistics {
  totalIssues: number;
  filteredIssues: number;
  activeFilters: number;
  filterBreakdown: Record<string, number>;
}
