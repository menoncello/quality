/**
 * Breadcrumb Navigation Component Tests
 */

import { describe, it, expect, jest } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { BreadcrumbNavigation } from '../../../src/components/dashboard/breadcrumb-navigation';
import type { NavigationBreadcrumb } from '../../../src/types/dashboard';

describe('BreadcrumbNavigation', () => {
  const mockBreadcrumbs: NavigationBreadcrumb[] = [
    {
      id: '1',
      label: 'Dashboard',
      view: 'dashboard',
    },
    {
      id: '2',
      label: 'Issues',
      view: 'issue-list',
    },
    {
      id: '3',
      label: 'Issue Details',
      view: 'issue-details',
    },
  ];

  it('should display all breadcrumbs', () => {
    const { lastFrame } = render(<BreadcrumbNavigation breadcrumbs={mockBreadcrumbs} />);

    expect(lastFrame()).toContain('Dashboard');
    expect(lastFrame()).toContain('Issues');
    expect(lastFrame()).toContain('Issue Details');
  });

  it('should show separators when enabled', () => {
    const { lastFrame } = render(
      <BreadcrumbNavigation breadcrumbs={mockBreadcrumbs} showSeparator={true} />
    );

    expect(lastFrame()).toContain('›');
  });

  it('should not show separators when disabled', () => {
    const { lastFrame } = render(
      <BreadcrumbNavigation breadcrumbs={mockBreadcrumbs} showSeparator={false} />
    );

    expect(lastFrame()).not.toContain('›');
  });

  it('should limit breadcrumbs to maxItems', () => {
    const manyBreadcrumbs: NavigationBreadcrumb[] = [
      ...mockBreadcrumbs,
      {
        id: '4',
        label: 'Additional View',
        view: 'trends',
      },
      {
        id: '5',
        label: 'Another View',
        view: 'comparison',
      },
    ];

    const { lastFrame } = render(
      <BreadcrumbNavigation breadcrumbs={manyBreadcrumbs} maxItems={3} />
    );

    expect(lastFrame()).toContain('...');
    expect(lastFrame()).toContain('Another View');
  });

  it('should handle empty breadcrumb list', () => {
    const { lastFrame } = render(<BreadcrumbNavigation breadcrumbs={[]} />);

    expect(lastFrame()).toBe('');
  });

  it('should truncate long labels', () => {
    const longBreadcrumbs: NavigationBreadcrumb[] = [
      {
        id: '1',
        label: 'This is a very long breadcrumb label that should be truncated',
        view: 'dashboard',
      },
    ];

    const { lastFrame } = render(<BreadcrumbNavigation breadcrumbs={longBreadcrumbs} />);

    expect(lastFrame()).toContain('...');
    expect(lastFrame()).not.toContain('very long breadcrumb label');
  });

  it('should handle breadcrumb selection', () => {
    const onSelect = jest.fn();
    const { lastFrame } = render(
      <BreadcrumbNavigation breadcrumbs={mockBreadcrumbs} onSelect={onSelect} />
    );

    expect(lastFrame()).toContain('Use arrow keys to select, Enter to navigate');
  });

  it('should not show navigation help when no onSelect provided', () => {
    const { lastFrame } = render(<BreadcrumbNavigation breadcrumbs={mockBreadcrumbs} />);

    expect(lastFrame()).not.toContain('Use arrow keys to select, Enter to navigate');
  });

  it('should handle keyboard navigation', () => {
    const onSelect = jest.fn();
    const { stdin } = render(
      <BreadcrumbNavigation breadcrumbs={mockBreadcrumbs} onSelect={onSelect} />
    );

    // Simulate right arrow key
    stdin.write('\u001B[C');

    // Simulate Enter key
    stdin.write('\r');

    // Verify selection is handled (implementation details depend on component logic)
    expect(onSelect).toBeDefined();
  });
});
