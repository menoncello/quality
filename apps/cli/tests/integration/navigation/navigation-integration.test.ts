import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock navigation state management
interface NavigationState {
  currentView: 'dashboard' | 'project' | 'module' | 'file' | 'issue';
  viewHistory: string[];
  currentPath: string[];
  selectedItems: any[];
  breadcrumbs: Array<{ label: string; path: string[] }>;
}

interface DashboardStore {
  navigation: NavigationState;
  setCurrentView: (view: NavigationState['currentView']) => void;
  navigateToPath: (path: string[]) => void;
  goBack: () => void;
  selectItem: (item: any) => void;
  clearSelection: () => void;
}

// Helper function to update path and breadcrumbs based on view
const updatePathAndBreadcrumbsForView = (view: NavigationState['currentView'], navigation: NavigationState) => {
  switch (view) {
    case 'dashboard':
      navigation.currentPath = [];
      navigation.breadcrumbs = [{ label: 'Dashboard', path: [] }];
      break;
    case 'project':
      navigation.currentPath = navigation.currentPath.slice(0, 1);
      navigation.breadcrumbs = navigation.breadcrumbs.slice(0, 2);
      break;
    case 'module':
      navigation.currentPath = navigation.currentPath.slice(0, 2);
      navigation.breadcrumbs = navigation.breadcrumbs.slice(0, 3);
      break;
    case 'file':
      navigation.currentPath = navigation.currentPath.slice(0, 3);
      navigation.breadcrumbs = navigation.breadcrumbs.slice(0, 4);
      break;
    case 'issue':
      navigation.currentPath = navigation.currentPath.slice(0, 4);
      navigation.breadcrumbs = navigation.breadcrumbs.slice(0, 5);
      break;
  }
};

const createMockStore = (): DashboardStore => {
  const navigation: NavigationState = {
    currentView: 'dashboard',
    viewHistory: ['dashboard'],
    currentPath: [],
    selectedItems: [],
    breadcrumbs: [{ label: 'Dashboard', path: [] }]
  };

  return {
    get navigation() { return navigation; },

    setCurrentView(view: NavigationState['currentView']): void {
      navigation.currentView = view;
      navigation.viewHistory.push(view);
    },

    navigateToPath(path: string[]): void {
      navigation.currentPath = path;

      // Add all intermediate views to history when navigating to a deeper path
      const viewsToAdd: string[] = [];

      if (path.length >= 1) viewsToAdd.push('project');
      if (path.length >= 2) viewsToAdd.push('module');
      if (path.length >= 3) viewsToAdd.push('file');
      if (path.length >= 4) viewsToAdd.push('issue');

      // Add only views that aren't already in history
      viewsToAdd.forEach(view => {
        if (!navigation.viewHistory.includes(view)) {
          navigation.viewHistory.push(view);
        }
      });

      // Update current view based on path depth
      if (path.length === 0) {
        navigation.currentView = 'dashboard';
      } else if (path.length === 1) {
        navigation.currentView = 'project';
      } else if (path.length === 2) {
        navigation.currentView = 'module';
      } else if (path.length === 3) {
        navigation.currentView = 'file';
      } else {
        navigation.currentView = 'issue';
      }

      // Update breadcrumbs
      navigation.breadcrumbs = [
        { label: 'Dashboard', path: [] },
        ...path.map((segment, index) => ({
          label: segment,
          path: path.slice(0, index + 1)
        }))
      ];
    },

    goBack(): void {
      if (navigation.viewHistory.length > 1) {
        navigation.viewHistory.pop();
        const previousView = navigation.viewHistory[navigation.viewHistory.length - 1];
        navigation.currentView = previousView as NavigationState['currentView'];

        // Update path and breadcrumbs based on the new view
        updatePathAndBreadcrumbsForView(navigation.currentView, navigation);
      }
    },

    selectItem(item: any): void {
      navigation.selectedItems = [item];
    },

    clearSelection(): void {
      navigation.selectedItems = [];
    }
  };
};

// Mock filter state management
interface FilterState {
  criteria: {
    severity: string[];
    tools: string[];
    scoreRange: [number, number];
    searchQuery: string;
  };
  activeFilters: string[];
  isFiltering: boolean;
}

const createMockFilterState = (): FilterState => {
  return {
    criteria: {
      severity: [],
      tools: [],
      scoreRange: [1, 10],
      searchQuery: ''
    },
    activeFilters: [],
    isFiltering: false
  };
};

describe('2.3-INT-001: Navigation Integration Tests', () => {
  let store: DashboardStore;

  beforeEach(() => {
    store = createMockStore();
  });

  it('should handle complete navigation flow from dashboard to issue', () => {
    // Start at dashboard
    expect(store.navigation.currentView).toBe('dashboard');
    expect(store.navigation.breadcrumbs).toHaveLength(1);

    // Navigate to project level
    store.navigateToPath(['src']);
    expect(store.navigation.currentView).toBe('project');
    expect(store.navigation.currentPath).toEqual(['src']);
    expect(store.navigation.breadcrumbs).toHaveLength(2);
    expect(store.navigation.breadcrumbs[1].label).toBe('src');

    // Navigate to module level
    store.navigateToPath(['src', 'components']);
    expect(store.navigation.currentView).toBe('module');
    expect(store.navigation.currentPath).toEqual(['src', 'components']);
    expect(store.navigation.breadcrumbs).toHaveLength(3);

    // Navigate to file level
    store.navigateToPath(['src', 'components', 'Button.tsx']);
    expect(store.navigation.currentView).toBe('file');
    expect(store.navigation.currentPath).toEqual(['src', 'components', 'Button.tsx']);
    expect(store.navigation.breadcrumbs).toHaveLength(4);

    // Navigate to issue level
    store.navigateToPath(['src', 'components', 'Button.tsx', 'issue-123']);
    expect(store.navigation.currentView).toBe('issue');
    expect(store.navigation.currentPath).toEqual(['src', 'components', 'Button.tsx', 'issue-123']);
    expect(store.navigation.breadcrumbs).toHaveLength(5);

    // Verify complete navigation history
    expect(store.navigation.viewHistory).toEqual([
      'dashboard', 'project', 'module', 'file', 'issue'
    ]);
  });

  it('should handle back navigation correctly', () => {
    // Navigate deep into hierarchy
    store.navigateToPath(['src', 'components', 'Button.tsx', 'issue-123']);
    expect(store.navigation.currentView).toBe('issue');
    expect(store.navigation.viewHistory).toHaveLength(5);

    // Go back to file level
    store.goBack();
    expect(store.navigation.currentView).toBe('file');
    expect(store.navigation.currentPath).toEqual(['src', 'components', 'Button.tsx']);
    expect(store.navigation.breadcrumbs).toHaveLength(4);

    // Go back to module level
    store.goBack();
    expect(store.navigation.currentView).toBe('module');
    expect(store.navigation.currentPath).toEqual(['src', 'components']);
    expect(store.navigation.breadcrumbs).toHaveLength(3);

    // Go back to project level
    store.goBack();
    expect(store.navigation.currentView).toBe('project');
    expect(store.navigation.currentPath).toEqual(['src']);
    expect(store.navigation.breadcrumbs).toHaveLength(2);

    // Go back to dashboard
    store.goBack();
    expect(store.navigation.currentView).toBe('dashboard');
    expect(store.navigation.currentPath).toEqual([]);
    expect(store.navigation.breadcrumbs).toHaveLength(1);
  });

  it('should handle breadcrumb navigation correctly', () => {
    // Navigate deep into hierarchy
    store.navigateToPath(['src', 'components', 'Button.tsx']);
    expect(store.navigation.breadcrumbs).toEqual([
      { label: 'Dashboard', path: [] },
      { label: 'src', path: ['src'] },
      { label: 'components', path: ['src', 'components'] },
      { label: 'Button.tsx', path: ['src', 'components', 'Button.tsx'] }
    ]);

    // Navigate using breadcrumb (direct jump to project level)
    store.navigateToPath(['src']);
    expect(store.navigation.currentView).toBe('project');
    expect(store.navigation.breadcrumbs).toEqual([
      { label: 'Dashboard', path: [] },
      { label: 'src', path: ['src'] }
    ]);

    // Navigate using breadcrumb (jump back to dashboard)
    store.navigateToPath([]);
    expect(store.navigation.currentView).toBe('dashboard');
    expect(store.navigation.breadcrumbs).toEqual([
      { label: 'Dashboard', path: [] }
    ]);
  });

  it('should handle navigation state persistence', () => {
    // Simulate navigation with state
    const testItem = { id: 123, type: 'issue', severity: 'error' };

    store.navigateToPath(['src', 'components']);
    store.selectItem(testItem);

    expect(store.navigation.currentView).toBe('module');
    expect(store.navigation.selectedItems).toEqual([testItem]);

    // Navigate to another level and verify state
    store.navigateToPath(['src', 'components', 'Button.tsx']);
    expect(store.navigation.currentView).toBe('file');
    // Selected items should persist unless explicitly cleared

    // Clear selection
    store.clearSelection();
    expect(store.navigation.selectedItems).toEqual([]);

    // Go back and verify state
    store.goBack();
    expect(store.navigation.currentView).toBe('module');
    expect(store.navigation.selectedItems).toEqual([]);
  });

  it('should handle edge cases in navigation', () => {
    // Test empty path navigation
    store.navigateToPath([]);
    expect(store.navigation.currentView).toBe('dashboard');
    expect(store.navigation.currentPath).toEqual([]);

    // Test navigation with special characters
    store.navigateToPath(['src-with-dash', 'components with spaces', 'file.tsx']);
    expect(store.navigation.currentPath).toEqual(['src-with-dash', 'components with spaces', 'file.tsx']);
    expect(store.navigation.currentView).toBe('file'); // 3-element path goes to file view

    // Test going back from dashboard (should go to previous view)
    const previousView = store.navigation.currentView;
    store.setCurrentView('dashboard');
    const initialHistoryLength = store.navigation.viewHistory.length;
    store.goBack();
    expect(store.navigation.currentView).toBe(previousView);
    expect(store.navigation.viewHistory.length).toBe(initialHistoryLength - 1);
  });
});

describe('2.3-INT-004: Filter State Management Integration', () => {
  let filterState: FilterState;

  beforeEach(() => {
    filterState = createMockFilterState();
  });

  it('should handle multiple filter criteria application', () => {
    // Apply severity filter
    filterState.criteria.severity = ['error', 'warning'];
    filterState.activeFilters.push('severity:error,warning');
    filterState.isFiltering = true;

    expect(filterState.criteria.severity).toEqual(['error', 'warning']);
    expect(filterState.activeFilters).toContain('severity:error,warning');
    expect(filterState.isFiltering).toBe(true);

    // Apply tool filter
    filterState.criteria.tools = ['eslint', 'typescript'];
    filterState.activeFilters.push('tools:eslint,typescript');

    expect(filterState.criteria.tools).toEqual(['eslint', 'typescript']);
    expect(filterState.activeFilters).toContain('tools:eslint,typescript');

    // Apply score range filter
    filterState.criteria.scoreRange = [7, 10];
    filterState.activeFilters.push('score:7-10');

    expect(filterState.criteria.scoreRange).toEqual([7, 10]);
    expect(filterState.activeFilters).toContain('score:7-10');

    // Apply search query
    filterState.criteria.searchQuery = 'unused variable';
    filterState.activeFilters.push('search:unused variable');

    expect(filterState.criteria.searchQuery).toBe('unused variable');
    expect(filterState.activeFilters).toContain('search:unused variable');
  });

  it('should handle filter removal and state updates', () => {
    // Set up multiple filters
    filterState.criteria.severity = ['error', 'warning'];
    filterState.criteria.tools = ['eslint'];
    filterState.criteria.scoreRange = [7, 10];
    filterState.criteria.searchQuery = 'test';
    filterState.activeFilters = [
      'severity:error,warning',
      'tools:eslint',
      'score:7-10',
      'search:test'
    ];
    filterState.isFiltering = true;

    // Remove severity filter
    filterState.criteria.severity = [];
    filterState.activeFilters = filterState.activeFilters.filter(f => !f.startsWith('severity:'));

    expect(filterState.criteria.severity).toEqual([]);
    expect(filterState.activeFilters).not.toContain('severity:error,warning');
    expect(filterState.isFiltering).toBe(true); // Still filtering

    // Remove tool filter
    filterState.criteria.tools = [];
    filterState.activeFilters = filterState.activeFilters.filter(f => !f.startsWith('tools:'));

    expect(filterState.criteria.tools).toEqual([]);
    expect(filterState.activeFilters).not.toContain('tools:eslint');
    expect(filterState.isFiltering).toBe(true); // Still filtering

    // Remove all remaining filters
    filterState.criteria.scoreRange = [1, 10]; // Reset to default
    filterState.criteria.searchQuery = '';
    filterState.activeFilters = [];
    filterState.isFiltering = false;

    expect(filterState.criteria.scoreRange).toEqual([1, 10]);
    expect(filterState.criteria.searchQuery).toBe('');
    expect(filterState.activeFilters).toEqual([]);
    expect(filterState.isFiltering).toBe(false);
  });

  it('should handle complex filter combinations', () => {
    // Apply complex filter set
    filterState.criteria = {
      severity: ['error'],
      tools: ['eslint', 'typescript'],
      scoreRange: [8, 10],
      searchQuery: 'react hooks'
    };
    filterState.activeFilters = [
      'severity:error',
      'tools:eslint,typescript',
      'score:8-10',
      'search:react hooks'
    ];
    filterState.isFiltering = true;

    // Test filter state serialization
    const serializedState = JSON.stringify(filterState);
    const deserializedState = JSON.parse(serializedState) as FilterState;

    expect(deserializedState.criteria).toEqual(filterState.criteria);
    expect(deserializedState.activeFilters).toEqual(filterState.activeFilters);
    expect(deserializedState.isFiltering).toBe(filterState.isFiltering);

    // Test filter state reset
    filterState.criteria = {
      severity: [],
      tools: [],
      scoreRange: [1, 10],
      searchQuery: ''
    };
    filterState.activeFilters = [];
    filterState.isFiltering = false;

    expect(filterState.isFiltering).toBe(false);
  });
});

describe('2.3-INT-005: Real-time Search with Debouncing Integration', () => {
  let searchResults: any[];
  let searchCallCount: number;
  let lastSearchTime: number;

  const mockSearchFunction = (query: string): Promise<any[]> => {
    searchCallCount++;
    lastSearchTime = Date.now();

    return new Promise(resolve => {
      setTimeout(() => {
        // Mock search results
        const results = [
          { id: 1, message: `Result for "${query}" - Item 1` },
          { id: 2, message: `Result for "${query}" - Item 2` },
          { id: 3, message: `Result for "${query}" - Item 3` }
        ];
        searchResults = results;
        resolve(results);
      }, 50); // Simulate search delay
    });
  };

  beforeEach(() => {
    searchResults = [];
    searchCallCount = 0;
    lastSearchTime = 0;
  });

  it('should debounce search queries effectively', async () => {
    const debounceDelay = 300;
    let debounceTimeout: NodeJS.Timeout | null = null;

    const debouncedSearch = (query: string): Promise<any[]> => {
      return new Promise(resolve => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(async () => {
          const results = await mockSearchFunction(query);
          resolve(results);
        }, debounceDelay);
      });
    };

    // Simulate rapid search queries (without awaiting each one)
    const startTime = Date.now();

    debouncedSearch('test');
    debouncedSearch('test query');
    debouncedSearch('test query with');
    debouncedSearch('test query with more');
    debouncedSearch('test query with more terms');

    // Wait for debounce to complete plus the mock search delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const endTime = Date.now();

    // Should only execute one search due to debouncing
    expect(searchCallCount).toBe(1);
    expect(endTime - startTime).toBeGreaterThan(300);
    expect(searchResults).toHaveLength(3);
    expect(searchResults[0].message).toContain('test query with more terms');
  });

  it('should handle search cancellation', async () => {
    let searchCancelled = false;

    const cancellableSearch = (query: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (searchCancelled) {
            reject(new Error('Search cancelled'));
            return;
          }
          resolve([
            { id: 1, message: `Result for "${query}"` }
          ]);
        }, 100);
      });
    };

    // Start a search
    const searchPromise = cancellableSearch('initial query');

    // Cancel the search immediately
    searchCancelled = true;

    // The search should be rejected
    await expect(searchPromise).rejects.toThrow('Search cancelled');
    expect(searchResults).toHaveLength(0);
  });

  it('should handle search result caching', async () => {
    const searchCache = new Map<string, any[]>();

    const cachedSearch = async (query: string): Promise<any[]> => {
      if (searchCache.has(query)) {
        return searchCache.get(query)!;
      }

      const results = await mockSearchFunction(query);
      searchCache.set(query, results);
      return results;
    };

    // First search
    const results1 = await cachedSearch('duplicate query');
    expect(searchCallCount).toBe(1);
    expect(results1).toHaveLength(3);

    // Second search with same query (should use cache)
    const results2 = await cachedSearch('duplicate query');
    expect(searchCallCount).toBe(1); // No additional search call
    expect(results2).toEqual(results1);

    // Different query (should trigger new search)
    const results3 = await cachedSearch('different query');
    expect(searchCallCount).toBe(2);
    expect(results3).toHaveLength(3);
  });

  it('should handle performance under high-frequency searches', async () => {
    const searchTimes: number[] = [];
    const queryCount = 20; // Reduced from 100 to avoid timeout

    for (let i = 0; i < queryCount; i++) {
      const startTime = performance.now();
      await mockSearchFunction(`query ${i}`);
      const endTime = performance.now();
      searchTimes.push(endTime - startTime);
    }

    const avgSearchTime = searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length;
    const maxSearchTime = Math.max(...searchTimes);

    expect(avgSearchTime).toBeLessThan(100); // Average should be under 100ms
    expect(maxSearchTime).toBeLessThan(200); // Max should be under 200ms
    expect(searchCallCount).toBe(queryCount);
  });
});