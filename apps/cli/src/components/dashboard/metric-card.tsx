/**
 * Metric Card Component
 * Displays a single metric with optional trend indicator
 */

import React from 'react';
import { Box, Text } from 'ink';

interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  unit?: string;
  color?: 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'cyan' | 'magenta';
  size?: 'small' | 'medium' | 'large';
  showTrend?: boolean;
  width?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  unit = '',
  color = 'blue',
  size = 'medium',
  showTrend = false,
  width = 20,
}) => {
  const getTrend = () => {
    if (previousValue === undefined || typeof value !== 'number') return null;

    const diff = value - previousValue;
    const percentChange = previousValue !== 0 ? (diff / previousValue) * 100 : 0;

    let trend: string;
    let trendColor: string;

    if (diff > 0) {
      trend = '📈';
      trendColor = 'red';
    } else if (diff < 0) {
      trend = '📉';
      trendColor = 'green';
    } else {
      trend = '➡️';
      trendColor = 'yellow';
    }

    return { trend, trendColor, diff, percentChange };
  };

  const trend = getTrend();

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { titleSize: 'small', valueSize: 'small' };
      case 'large':
        return { titleSize: 'medium', valueSize: 'large' };
      default:
        return { titleSize: 'small', valueSize: 'medium' };
    }
  };

  const { titleSize: _titleSize, valueSize: _valueSize } = getSizeClasses();

  return (
    <Box flexDirection="column" width={width} padding={1} borderStyle="round" borderColor={color}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={color}>{title}</Text>
        {trend && showTrend && <Text color={trend.trendColor}>{trend.trend}</Text>}
      </Box>

      <Box flexDirection="row" alignItems="flex-start" marginTop={1}>
        <Text color={color} bold>
          {value}
        </Text>
        {unit && (
          <Box paddingLeft={1}>
            <Text color={color} dimColor>
              {unit}
            </Text>
          </Box>
        )}
      </Box>

      {trend && showTrend && (
        <Box flexDirection="row" marginTop={1}>
          <Text color={trend.trendColor} dimColor>
            {trend.diff > 0 ? '+' : ''}
            {trend.diff}
          </Text>
          <Box paddingLeft={1}>
            <Text color="gray" dimColor>
              ({trend.percentChange > 0 ? '+' : ''}
              {trend.percentChange.toFixed(1)}%)
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
