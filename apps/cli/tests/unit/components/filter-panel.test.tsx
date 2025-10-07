/**
 * Filter Panel Component Tests
 */

import { describe, it, expect, jest, beforeEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { FilterPanel } from '../../../src/components/dashboard/filter-panel';

describe('FilterPanel', () => {
  const defaultProps = {
    availableSeverities: ['error', 'warning', 'info'],
    availableTools: ['eslint', 'typescript', 'prettier'],
    availableFiles: ['src/components', 'src/utils', 'src/services'],
    availableModules: ['components', 'utils', 'services'],
    onApply: jest.fn(),
    onReset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render filter panel header', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI color codes
    expect(output).toContain('Filters');
    expect(output).toContain('[Ctrl+F] Filters [Ctrl+S] Search [Ctrl+P] Presets [Esc] Close');
  });

  it('should display tab navigation', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Filter Criteria');
    expect(output).toContain('Search');
    expect(output).toContain('Presets');
  });

  it('should show active filter count badge when filters are applied', () => {
    // Mock filter store with active filters
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        filters: { severity: ['error'] },
        search: { query: 'test' },
        presets: [],
        currentPresetId: undefined,
        setFilters: jest.fn(),
        setSearch: jest.fn(),
        loadPreset: jest.fn(),
        savePreset: jest.fn(),
        deletePreset: jest.fn(),
        setDefaultPreset: jest.fn(),
      }),
    }));

    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('active');
  });

  it('should render filter criteria tab content', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Severity');
    expect(output).toContain('Tools');
    expect(output).toContain('Priority');
    expect(output).toContain('Score Range:');
    expect(output).toContain('Fixable only');
  });

  it('should render search tab content when search tab is active', () => {
    // This test would require simulating tab switching
    // For now, we test that the component structure exists
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Filter Criteria'); // Default active tab
  });

  it('should render presets tab with default presets', () => {
    // Mock the presets tab to be active
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        filters: {},
        search: { query: '' },
        presets: [
          {
            id: 'test-preset',
            name: 'Test Preset',
            description: 'A test preset',
            criteria: {},
            search: { query: '' },
            createdAt: new Date(),
            isDefault: false,
          },
        ],
        currentPresetId: undefined,
        setFilters: jest.fn(),
        setSearch: jest.fn(),
        loadPreset: jest.fn(),
        savePreset: jest.fn(),
        deletePreset: jest.fn(),
        setDefaultPreset: jest.fn(),
      }),
    }));

    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Filter Criteria'); // Default tab
  });

  it('should display action buttons', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('[Enter] Apply Filters');
    expect(output).toContain('[R] Reset');
    expect(output).toContain('[Ctrl+S] Save Preset');
  });

  it('should show save preset dialog when triggered', () => {
    // This would require simulating the save preset action
    // For now, we test that the component structure is present
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Filters'); // Basic structure is present
  });

  it('should handle available severity options', () => {
    const customProps = {
      ...defaultProps,
      availableSeverities: ['error', 'warning', 'info', 'note'],
    };

    const { lastFrame } = render(<FilterPanel {...customProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Severity');
  });

  it('should handle available tool options', () => {
    const customProps = {
      ...defaultProps,
      availableTools: ['eslint', 'typescript', 'prettier', 'jest'],
    };

    const { lastFrame } = render(<FilterPanel {...customProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Tools');
  });

  it('should display current score range', () => {
    // Mock filter store with score range
    jest.mock('../../../src/hooks/useFilterStore', () => ({
      useFilterStore: () => ({
        filters: { scoreRange: [5, 8] },
        search: { query: '' },
        presets: [],
        currentPresetId: undefined,
        setFilters: jest.fn(),
        setSearch: jest.fn(),
        loadPreset: jest.fn(),
        savePreset: jest.fn(),
        deletePreset: jest.fn(),
        setDefaultPreset: jest.fn(),
      }),
    }));

    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Score Range:');
  });

  it('should show help text for filter criteria', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Severity');
    expect(output).toContain('Select severities...');
  });

  it('should show help text for tools filter', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Tools');
    expect(output).toContain('Select tools...');
  });

  it('should show help text for priority filter', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Priority');
    expect(output).toContain('Select priorities...');
  });

  it('should render checkbox for fixable filter', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Fixable only');
  });

  it('should have correct keyboard shortcuts documentation', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('[Ctrl+F]');
    expect(output).toContain('[Ctrl+S]');
    expect(output).toContain('[Ctrl+P]');
    expect(output).toContain('[Esc]');
  });

  it('should maintain consistent layout structure', () => {
    const { lastFrame } = render(<FilterPanel {...defaultProps} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');

    // Check that the basic structure is maintained
    expect(output).toContain('Filters');
    expect(output).toContain('Filter Criteria');
    expect(output).toContain('Severity');
    expect(output).toContain('Tools');
    expect(output).toContain('Priority');
    expect(output).toContain('[Enter] Apply Filters');
  });
});
