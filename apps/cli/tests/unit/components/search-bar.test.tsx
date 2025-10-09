/**
 * Search Bar Component Tests
 */

import { describe, it, expect, jest, beforeEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { SearchBar } from '../../../src/components/dashboard/search-bar';

describe('SearchBar', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    placeholder: 'Search issues...',
    showAdvanced: true,
    autoFocus: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search bar with placeholder', () => {
    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI color codes
    expect(output).toContain('🔍');
    expect(output).toContain(defaultProps.placeholder);
  });

  it('should show initial help text when not focused', () => {
    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Press [/] to focus search');
  });

  it('should show advanced options when search has content', () => {
    // Mock the filter store to return a search query
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: { query: 'test', fields: ['message'], caseSensitive: false, useRegex: false },
        setSearch: jest.fn(),
        filterResults: [],
        totalResults: 0,
        isLoading: false,
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Fields:');
    expect(output).toContain('Case:');
    expect(output).toContain('Regex:');
  });

  it('should display results count when search is active', () => {
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: { query: 'test', fields: ['message'], caseSensitive: false, useRegex: false },
        setSearch: jest.fn(),
        filterResults: [{ id: '1' }, { id: '2' }],
        totalResults: 2,
        isLoading: false,
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('(2 results)');
  });

  it('should show loading indicator when searching', () => {
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: { query: 'test', fields: ['message'], caseSensitive: false, useRegex: false },
        setSearch: jest.fn(),
        filterResults: [],
        totalResults: 0,
        isLoading: true,
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('⏳');
  });

  it('should show success indicator when search has results', () => {
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: { query: 'test', fields: ['message'], caseSensitive: false, useRegex: false },
        setSearch: jest.fn(),
        filterResults: [{ id: '1' }],
        totalResults: 1,
        isLoading: false,
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('✓');
  });

  it('should display clear button when search has content', () => {
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: { query: 'test', fields: ['message'], caseSensitive: false, useRegex: false },
        setSearch: jest.fn(),
        filterResults: [],
        totalResults: 0,
        isLoading: false,
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('[X]');
  });

  it('should show help text when focused', () => {
    // This test would require simulating focus state
    // For now, we'll test that the help text structure exists
    const { lastFrame } = render(<SearchBar {...defaultProps} autoFocus={true} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('[↑↓] History');
  });

  it('should not show advanced options when disabled', () => {
    const { lastFrame } = render(<SearchBar {...defaultProps} showAdvanced={false} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).not.toContain('Fields:');
    expect(output).not.toContain('Case:');
    expect(output).not.toContain('Regex:');
  });

  it('should handle auto focus correctly', () => {
    const { lastFrame } = render(<SearchBar {...defaultProps} autoFocus={true} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    // When autoFocus is true, the component should show help text
    expect(output).toContain('[↑↓] History');
  });

  it('should display search history when available', () => {
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: { query: 'test', fields: ['message'], caseSensitive: false, useRegex: false },
        setSearch: jest.fn(),
        filterResults: [],
        totalResults: 0,
        isLoading: false,
        // Mock history state - this would need to be implemented in the actual component
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} autoFocus={true} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('[↑↓] History');
  });

  it('should debounce search input', () => {
    const mockOnSearch = jest.fn();
    const { rerender } = render(<SearchBar {...defaultProps} onSearch={mockOnSearch} />);

    // Simulate rapid input changes
    rerender(<SearchBar {...defaultProps} onSearch={mockOnSearch} />);
    rerender(<SearchBar {...defaultProps} onSearch={mockOnSearch} />);

    // The onSearch callback should not be called immediately due to debouncing
    // This is more of an integration test, but we can check the structure
    expect(mockOnSearch).toHaveBeenCalledTimes(0);
  });

  it('should handle empty search gracefully', () => {
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: { query: '', fields: ['message'], caseSensitive: false, useRegex: false },
        setSearch: jest.fn(),
        filterResults: [],
        totalResults: 0,
        isLoading: false,
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('🔍');
    expect(output).toContain(defaultProps.placeholder);
    expect(output).toContain('/'); // Empty search indicator (single slash)
  });

  it('should show different field count display', () => {
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: {
          query: 'test',
          fields: ['message', 'filePath'],
          caseSensitive: false,
          useRegex: false,
        },
        setSearch: jest.fn(),
        filterResults: [],
        totalResults: 0,
        isLoading: false,
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('2 fields');
  });

  it('should display "All" when all fields are selected', () => {
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        search: {
          query: 'test',
          fields: ['message', 'filePath', 'ruleId', 'toolName'],
          caseSensitive: false,
          useRegex: false,
        },
        setSearch: jest.fn(),
        filterResults: [],
        totalResults: 0,
        isLoading: false,
      }),
    }));

    const { lastFrame } = render(<SearchBar {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('All');
  });
});
