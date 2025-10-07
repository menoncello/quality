/**
 * Trend Chart Component Tests
 */

import { describe, it, expect, jest } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { TrendChart } from '../../../src/components/dashboard/trend-chart';

describe('TrendChart', () => {
  const mockTrends = {
    severity: [
      { type: 'error', baseline: 3, comparison: 2, diff: -1, trend: 'down' as const },
      { type: 'warning', baseline: 4, comparison: 4, diff: 0, trend: 'stable' as const },
      { type: 'info', baseline: 3, comparison: 2, diff: -1, trend: 'down' as const },
    ],
    tools: [
      { tool: 'eslint', baseline: 6, comparison: 5, diff: -1, trend: 'down' as const },
      { tool: 'typescript', baseline: 4, comparison: 3, diff: -1, trend: 'down' as const },
    ],
    categories: [
      { category: 'security', baseline: 2, comparison: 1, diff: -1, trend: 'down' as const },
      { category: 'performance', baseline: 3, comparison: 3, diff: 0, trend: 'stable' as const },
      { category: 'maintainability', baseline: 5, comparison: 4, diff: -1, trend: 'down' as const },
    ],
  };

  it('should render trend charts when enabled', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Severity Trends');
    expect(output).toContain('Tool Trends');
    expect(output).toContain('Category Trends');
  });

  it('should show disabled message when charts are disabled', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={false} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Charts are disabled');
    expect(output).toContain('Enable them with [C] key');
  });

  it('should display severity data correctly', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={false} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('error');
    expect(output).toContain('warning');
    expect(output).toContain('info');
  });

  it('should display tool data correctly', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={false} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('eslint');
    expect(output).toContain('typescript');
  });

  it('should display category data correctly', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={false} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('security');
    expect(output).toContain('performance');
    expect(output).toContain('maintainabil'); // Wrapped at 12 chars
  });

  it('should show diff details when enabled', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Type');
    expect(output).toContain('Values');
    expect(output).toContain('Change');
    expect(output).toContain('3 → 2');
    expect(output).toContain('-1');
  });

  it('should hide diff details when disabled', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={false} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).not.toContain('Type');
    expect(output).not.toContain('Values');
    expect(output).not.toContain('Change');
  });

  it('should display sparkline visualizations', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    // Sparklines use special Unicode characters
    expect(output).toMatch(/[▁▂▃▄▅▆▇█]/);
  });

  it('should show trend indicators', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('📉'); // Down trend
    expect(output).toContain('➡️'); // Stable trend
  });

  it('should display legend', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('█ Baseline');
    expect(output).toContain('░ Comparison');
    expect(output).toContain('📈 Up');
    expect(output).toContain('📉 Down');
    expect(output).toContain('➡️ Stable');
  });

  it('should show keyboard shortcuts', () => {
    const { lastFrame } = render(
      <TrendChart trends={mockTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('[C] Toggle Charts');
    expect(output).toContain('[D] Toggle Details');
  });

  it('should handle empty trends data', () => {
    const emptyTrends = {
      severity: [],
      tools: [],
      categories: [],
    };

    const { lastFrame } = render(
      <TrendChart trends={emptyTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('Severity Trends');
    expect(output).toContain('Tool Trends');
    expect(output).toContain('Category Trends');
  });

  it('should handle single trend data points', () => {
    const singleTrend = {
      severity: [{ type: 'error', baseline: 5, comparison: 5, diff: 0, trend: 'stable' as const }],
      tools: [{ tool: 'eslint', baseline: 5, comparison: 5, diff: 0, trend: 'stable' as const }],
      categories: [
        { category: 'security', baseline: 5, comparison: 5, diff: 0, trend: 'stable' as const },
      ],
    };

    const { lastFrame } = render(
      <TrendChart trends={singleTrend} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('error');
    expect(output).toContain('eslint');
    expect(output).toContain('security');
  });

  it('should handle increasing trends correctly', () => {
    const increasingTrends = {
      severity: [{ type: 'error', baseline: 2, comparison: 5, diff: 3, trend: 'up' as const }],
      tools: [],
      categories: [],
    };

    const { lastFrame } = render(
      <TrendChart trends={increasingTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('2 → 5');
    expect(output).toContain('+3');
    expect(output).toContain('📈');
  });

  it('should handle large values correctly', () => {
    const largeTrends = {
      severity: [
        { type: 'error', baseline: 100, comparison: 200, diff: 100, trend: 'up' as const },
      ],
      tools: [],
      categories: [],
    };

    const { lastFrame } = render(
      <TrendChart trends={largeTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('100 → 200');
    expect(output).toContain('+100');
  });

  it('should handle zero values correctly', () => {
    const zeroTrends = {
      severity: [{ type: 'error', baseline: 0, comparison: 0, diff: 0, trend: 'stable' as const }],
      tools: [],
      categories: [],
    };

    const { lastFrame } = render(
      <TrendChart trends={zeroTrends} showCharts={true} showDiffs={true} />
    );

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, '');
    expect(output).toContain('0 → 0');
    expect(output).toContain('➡️ 0'); // Zero values don't show +0
  });
});
