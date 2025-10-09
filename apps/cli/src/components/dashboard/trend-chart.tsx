/**
 * Trend Chart Component
 * ASCII-based trend visualization for comparison metrics
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { ComparisonResult } from '../../hooks/useComparisonStore';

interface TrendChartProps {
  trends: ComparisonResult['trends'];
  showCharts: boolean;
  showDiffs: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ trends, showCharts, showDiffs }) => {
  const severityData = useMemo(() => {
    const maxValue = Math.max(...trends.severity.map(t => Math.max(t.baseline, t.comparison)));
    return {
      data: trends.severity.map(trend => ({
        label: trend.type,
        baseline: trend.baseline,
        comparison: trend.comparison,
        diff: trend.diff,
        trend: trend.trend,
      })),
      maxValue,
    };
  }, [trends.severity]);

  const toolsData = useMemo(() => {
    const maxValue = Math.max(...trends.tools.map(t => Math.max(t.baseline, t.comparison)));
    return {
      data: trends.tools.map(trend => ({
        label: trend.tool,
        baseline: trend.baseline,
        comparison: trend.comparison,
        diff: trend.diff,
        trend: trend.trend,
      })),
      maxValue,
    };
  }, [trends.tools]);

  const categoriesData = useMemo(() => {
    const maxValue = Math.max(...trends.categories.map(t => Math.max(t.baseline, t.comparison)));
    return {
      data: trends.categories.map(trend => ({
        label: trend.category,
        baseline: trend.baseline,
        comparison: trend.comparison,
        diff: trend.diff,
        trend: trend.trend,
      })),
      maxValue,
    };
  }, [trends.categories]);

  const createSimpleBarChart = (
    data: Array<{ label: string; baseline: number; comparison: number }>,
    maxValue: number
  ) => {
    const chartWidth = 30;
    const maxBarLength = chartWidth - 10; // Leave space for labels

    return data.map(item => {
      const baselineLength = Math.round((item.baseline / maxValue) * maxBarLength);
      const comparisonLength = Math.round((item.comparison / maxValue) * maxBarLength);

      const baselineBar = '█'.repeat(Math.max(1, baselineLength));
      const comparisonBar = '░'.repeat(Math.max(1, comparisonLength));

      return (
        <Box key={item.label} flexDirection="row">
          <Box width={12}>
            <Text color="gray" dimColor>
              {item.label}
            </Text>
          </Box>
          <Box flexDirection="row" width={chartWidth}>
            <Text color="blue">{baselineBar}</Text>
            <Text color="green">{comparisonBar}</Text>
          </Box>
          <Box width={15}>
            <Text color="gray" dimColor>
              {item.baseline} → {item.comparison}
            </Text>
          </Box>
        </Box>
      );
    });
  };

  const createSparkline = (values: number[]) => {
    if (values.length === 0) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    return values
      .map(value => {
        const normalized = (value - min) / range;
        const index = Math.floor(normalized * (chars.length - 1));
        return chars[Math.min(index, chars.length - 1)];
      })
      .join('');
  };

  const getTrendSymbol = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'red';
      case 'down':
        return 'green';
      default:
        return 'yellow';
    }
  };

  if (!showCharts) {
    return (
      <Box flexDirection="column">
        <Text color="gray">Charts are disabled. Enable them with [C] key.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Severity Trends */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="blue">
          Severity Trends
        </Text>

        {showDiffs && (
          <Box flexDirection="row" marginTop={1} marginBottom={1}>
            <Box width={12}>
              <Text color="gray" dimColor>
                Type
              </Text>
            </Box>
            <Box width={30}>
              <Text color="gray" dimColor>
                Baseline vs Comparison
              </Text>
            </Box>
            <Box width={15}>
              <Text color="gray" dimColor>
                Values
              </Text>
            </Box>
            <Box width={15}>
              <Text color="gray" dimColor>
                Change
              </Text>
            </Box>
          </Box>
        )}

        {createSimpleBarChart(severityData.data, severityData.maxValue)}

        {showDiffs && (
          <Box flexDirection="column" marginTop={1}>
            {severityData.data.map(trend => (
              <Box key={trend.label} flexDirection="row">
                <Box width={12}>
                  <Text color="gray" dimColor>
                    {trend.label}
                  </Text>
                </Box>
                <Box width={30}>
                  <Text color="gray" dimColor>
                    {createSparkline([trend.baseline, trend.comparison])}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color="gray" dimColor>
                    {trend.baseline} → {trend.comparison}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color={getTrendColor(trend.trend)} dimColor>
                    {getTrendSymbol(trend.trend)} {trend.diff > 0 ? '+' : ''}
                    {trend.diff}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Tools Trends */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="blue">
          Tool Trends
        </Text>

        {showDiffs && (
          <Box flexDirection="row" marginTop={1} marginBottom={1}>
            <Box width={12}>
              <Text color="gray" dimColor>
                Tool
              </Text>
            </Box>
            <Box width={30}>
              <Text color="gray" dimColor>
                Baseline vs Comparison
              </Text>
            </Box>
            <Box width={15}>
              <Text color="gray" dimColor>
                Values
              </Text>
            </Box>
            <Box width={15}>
              <Text color="gray" dimColor>
                Change
              </Text>
            </Box>
          </Box>
        )}

        {createSimpleBarChart(toolsData.data, toolsData.maxValue)}

        {showDiffs && (
          <Box flexDirection="column" marginTop={1}>
            {toolsData.data.map(trend => (
              <Box key={trend.label} flexDirection="row">
                <Box width={12}>
                  <Text color="gray" dimColor>
                    {trend.label}
                  </Text>
                </Box>
                <Box width={30}>
                  <Text color="gray" dimColor>
                    {createSparkline([trend.baseline, trend.comparison])}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color="gray" dimColor>
                    {trend.baseline} → {trend.comparison}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color={getTrendColor(trend.trend)} dimColor>
                    {getTrendSymbol(trend.trend)} {trend.diff > 0 ? '+' : ''}
                    {trend.diff}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Categories Trends */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="blue">
          Category Trends
        </Text>

        {showDiffs && (
          <Box flexDirection="row" marginTop={1} marginBottom={1}>
            <Box width={12}>
              <Text color="gray" dimColor>
                Category
              </Text>
            </Box>
            <Box width={30}>
              <Text color="gray" dimColor>
                Baseline vs Comparison
              </Text>
            </Box>
            <Box width={15}>
              <Text color="gray" dimColor>
                Values
              </Text>
            </Box>
            <Box width={15}>
              <Text color="gray" dimColor>
                Change
              </Text>
            </Box>
          </Box>
        )}

        {createSimpleBarChart(categoriesData.data, categoriesData.maxValue)}

        {showDiffs && (
          <Box flexDirection="column" marginTop={1}>
            {categoriesData.data.map(trend => (
              <Box key={trend.label} flexDirection="row">
                <Box width={12}>
                  <Text color="gray" dimColor>
                    {trend.label}
                  </Text>
                </Box>
                <Box width={30}>
                  <Text color="gray" dimColor>
                    {createSparkline([trend.baseline, trend.comparison])}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color="gray" dimColor>
                    {trend.baseline} → {trend.comparison}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color={getTrendColor(trend.trend)} dimColor>
                    {getTrendSymbol(trend.trend)} {trend.diff > 0 ? '+' : ''}
                    {trend.diff}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Box flexDirection="row" marginTop={2} borderTop={true} paddingY={1}>
        <Box flexDirection="row">
          <Text color="blue" dimColor>
            █ Baseline
          </Text>
          <Box paddingLeft={2}>
            <Text color="gray" dimColor>
              ░ Comparison
            </Text>
          </Box>
          <Box paddingLeft={2}>
            <Text color="gray" dimColor>
              📈 Up
            </Text>
          </Box>
          <Box paddingLeft={2}>
            <Text color="gray" dimColor>
              📉 Down
            </Text>
          </Box>
          <Box paddingLeft={2}>
            <Text color="gray" dimColor>
              ➡️ Stable
            </Text>
          </Box>
        </Box>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>
          [C] Toggle Charts [D] Toggle Details
        </Text>
      </Box>
    </Box>
  );
};
