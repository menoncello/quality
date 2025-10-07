/**
 * Dashboard Navigator Component Tests
 */

import { describe, it, expect, jest } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { DashboardNavigator } from '../../../src/components/dashboard/dashboard-navigator';
import type { DashboardView } from '../../../src/types/dashboard';

describe('DashboardNavigator', () => {
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();

  it('should display current view information', () => {
    const { lastFrame } = render(
      <DashboardNavigator currentView="dashboard" onNavigate={mockNavigate} onGoBack={mockGoBack} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI color codes
    expect(output).toContain('Navigator');
    expect(output).toContain('Current: Dashboard Overview');
  });

  it('should show navigation shortcuts', () => {
    const { lastFrame } = render(
      <DashboardNavigator currentView="dashboard" onNavigate={mockNavigate} onGoBack={mockGoBack} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI color codes
    expect(output).toContain('Quick Nav:');
    expect(output).toContain('[Ctrl+D] Dashboard');
    expect(output).toContain('[Ctrl+I] Issues');
  });

  it('should show path as root when no navigation history', () => {
    const { lastFrame } = render(
      <DashboardNavigator currentView="dashboard" onNavigate={mockNavigate} onGoBack={mockGoBack} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI color codes
    expect(output).toContain('Path: Root');
  });

  it('should show back navigation when available', () => {
    const { lastFrame } = render(
      <DashboardNavigator
        currentView="issue-details"
        onNavigate={mockNavigate}
        onGoBack={mockGoBack}
      />
    );

    expect(lastFrame()).toContain('[Esc] Back');
  });

  it('should handle available views', () => {
    const customViews: DashboardView[] = ['dashboard', 'issue-list'];
    const { lastFrame } = render(
      <DashboardNavigator
        currentView="dashboard"
        onNavigate={mockNavigate}
        onGoBack={mockGoBack}
        availableViews={customViews}
      />
    );

    // Should not crash and still show basic navigation
    expect(lastFrame()).toContain('Navigator');
  });

  it('should render keyboard shortcuts', () => {
    const { lastFrame } = render(
      <DashboardNavigator currentView="dashboard" onNavigate={mockNavigate} onGoBack={mockGoBack} />
    );

    expect(lastFrame()).toContain('[Ctrl+D]');
    expect(lastFrame()).toContain('[Ctrl+I]');
    expect(lastFrame()).toContain('[Ctrl+C]');
    expect(lastFrame()).toContain('[Ctrl+T]');
  });

  it('should show back navigation when available', () => {
    const { lastFrame } = render(
      <DashboardNavigator
        currentView="issue-details"
        onNavigate={mockNavigate}
        onGoBack={mockGoBack}
      />
    );

    expect(lastFrame()).toContain('[Esc] Back');
  });
});
