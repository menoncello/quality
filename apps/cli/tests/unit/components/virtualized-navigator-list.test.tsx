/**
 * Virtualized Navigator List Component Tests
 */

import { describe, it, expect, jest } from 'bun:test';
import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { VirtualizedNavigatorList } from '../../../src/components/dashboard/virtualized-navigator-list';
import type { Issue } from '../../../src/types/analysis';
import type { IssueWithPriority } from '../../../src/types/dashboard';

describe('VirtualizedNavigatorList', () => {
  const mockIssues: Issue[] = [
    {
      id: '1',
      type: 'error',
      toolName: 'eslint',
      filePath: '/src/components/Button.tsx',
      lineNumber: 23,
      message: 'Missing semicolon',
      ruleId: 'semi',
      fixable: true,
      score: 5,
    },
    {
      id: '2',
      type: 'warning',
      toolName: 'typescript',
      filePath: '/src/utils/helpers.ts',
      lineNumber: 45,
      message: 'Unused variable',
      ruleId: 'no-unused-vars',
      fixable: false,
      score: 3,
    },
    {
      id: '3',
      type: 'info',
      toolName: 'prettier',
      filePath: '/src/services/api.ts',
      lineNumber: 67,
      message: 'Format issue',
      fixable: true,
      score: 2,
    },
  ];

  const mockPriorityIssues: IssueWithPriority[] = [
    {
      ...mockIssues[0],
      priorityScore: 7.5,
      priorityLevel: 'high',
      priority: {
        id: 'p1',
        issueId: '1',
        severity: 8,
        impact: 7,
        effort: 3,
        businessValue: 9,
        finalScore: 7.5,
        context: {} as any,
        classification: {} as any,
        triageSuggestion: {} as any,
        scoringFactors: {} as any,
        metadata: {} as any,
      },
    },
    {
      ...mockIssues[1],
      priorityScore: 4.2,
      priorityLevel: 'medium',
      priority: {
        id: 'p2',
        issueId: '2',
        severity: 5,
        impact: 4,
        effort: 3,
        businessValue: 6,
        finalScore: 4.2,
        context: {} as any,
        classification: {} as any,
        triageSuggestion: {} as any,
        scoringFactors: {} as any,
        metadata: {} as any,
      },
    },
  ];

  const mockOnSelect = jest.fn();

  it('should render virtualized list', () => {
    const { lastFrame } = render(
      <VirtualizedNavigatorList items={mockIssues} selectedIndex={0} onSelect={mockOnSelect} />
    );

    expect(lastFrame()).toContain('Showing 1-3 of 3 items');
    expect(lastFrame()).toContain('Selected: 1/3');
    expect(lastFrame()).toContain('1. Missing semicolon');
    expect(lastFrame()).toContain('ERROR');
    expect(lastFrame()).toContain('eslint');
  });

  it('should render priority issues with priority score', () => {
    const { lastFrame } = render(
      <VirtualizedNavigatorList
        items={mockPriorityIssues}
        selectedIndex={0}
        onSelect={mockOnSelect}
      />
    );

    expect(lastFrame()).toContain('P:7.5');
    expect(lastFrame()).toContain('1. Missing semicolon');
    expect(lastFrame()).toContain('P:4.2');
    expect(lastFrame()).toContain('2. Unused variable');
  });

  it('should truncate long messages', () => {
    const longMessageIssues: Issue[] = [
      {
        ...mockIssues[0],
        message:
          'This is a very long error message that should be truncated because it exceeds the display limit for the virtualized list component in the CLI dashboard',
      },
    ];

    const { lastFrame } = render(
      <VirtualizedNavigatorList
        items={longMessageIssues}
        selectedIndex={0}
        onSelect={mockOnSelect}
      />
    );

    expect(lastFrame()).toContain('...');
    expect(lastFrame()).not.toContain('display limit for the virtualized list');
  });

  it('should handle empty item list', () => {
    const { lastFrame } = render(
      <VirtualizedNavigatorList items={[]} selectedIndex={0} onSelect={mockOnSelect} />
    );

    expect(lastFrame()).toContain('Showing 0-0 of 0 items');
  });

  it('should display navigation help', () => {
    const { lastFrame } = render(
      <VirtualizedNavigatorList items={mockIssues} selectedIndex={0} onSelect={mockOnSelect} />
    );

    expect(lastFrame()).toContain('Navigation: ↑↓ Page↑↓ Home End [1-9] | Enter to select');
  });

  it('should use custom item renderer', () => {
    const customRenderer = jest.fn().mockReturnValue(<Text>Custom Item</Text>);

    render(
      <VirtualizedNavigatorList
        items={mockIssues}
        selectedIndex={0}
        onSelect={mockOnSelect}
        renderItem={customRenderer}
      />
    );

    expect(customRenderer).toHaveBeenCalled();
  });

  it('should use custom item key generator', () => {
    const customKeyGenerator = jest.fn().mockReturnValue('custom-key');

    render(
      <VirtualizedNavigatorList
        items={mockIssues}
        selectedIndex={0}
        onSelect={mockOnSelect}
        getItemKey={customKeyGenerator}
      />
    );

    expect(customKeyGenerator).toHaveBeenCalled();
  });

  it('should show scroll indicator for large lists', () => {
    // Create a large list that would require scrolling
    const largeIssues: Issue[] = Array.from({ length: 100 }, (_, index) => ({
      ...mockIssues[0],
      id: `issue-${index}`,
      message: `Issue ${index + 1}`,
      lineNumber: index + 1,
    }));

    const { lastFrame } = render(
      <VirtualizedNavigatorList
        items={largeIssues}
        selectedIndex={50}
        onSelect={mockOnSelect}
        windowSize={5}
        height={10}
      />
    );

    expect(lastFrame()).toContain('Scroll:');
  });
});
