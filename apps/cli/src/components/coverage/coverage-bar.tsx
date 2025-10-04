import React from 'react';
import { Box, Text } from 'ink';

interface CoverageBarProps {
  label: string;
  coverage: number;
  showPercentage?: boolean;
  color?: string;
}

export const CoverageBar: React.FC<CoverageBarProps> = ({
  label,
  coverage,
  showPercentage = true,
  color,
}) => {
  const width = 30;
  const getCoverageColor = (cov: number) => {
    if (color) return color;
    if (cov >= 90) return 'green';
    if (cov >= 80) return 'yellow';
    if (cov >= 70) return 'red';
    return 'red';
  };

  const filledWidth = Math.round((coverage / 100) * width);
  const emptyWidth = width - filledWidth;

  const filledBar = '█'.repeat(filledWidth);
  const emptyBar = '░'.repeat(emptyWidth);
  const bar = `${filledBar}${emptyBar}`;

  return (
    <Box justifyContent="space-between" width={60}>
      <Box width={20}>
        <Text>{label}:</Text>
      </Box>
      <Text>
        <Text color={getCoverageColor(coverage)}>[{bar}]</Text>
        {showPercentage && <Text color={getCoverageColor(coverage)}> {coverage.toFixed(1)}%</Text>}
      </Text>
    </Box>
  );
};
