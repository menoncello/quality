import React from 'react';
import { Box, Text } from 'ink';
import { CoverageBar } from './coverage-bar.js';

interface CriticalPathsProps {
  criticalPaths: Array<{
    id: string;
    name: string;
    description: string;
    currentCoverage: number;
    requiredCoverage: number;
    coverageGap: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    priority: number;
    recommendations: string[];
  }>;
}

export const CriticalPaths: React.FC<CriticalPathsProps> = ({ criticalPaths }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'red';
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'red';
    if (priority >= 60) return 'yellow';
    if (priority >= 40) return 'green';
    return 'gray';
  };

  if (criticalPaths.length === 0) {
    return (
      <Box padding={1}>
        <Text color="gray">No critical paths identified</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>Critical Paths Analysis</Text>
      </Box>

      {criticalPaths.map((path, _index) => (
        <Box key={path.id} flexDirection="column" marginBottom={2} padding={1}>
          <Box marginBottom={1}>
            <Text bold color="blue">
              {path.name}
            </Text>
            <Text color="gray"> | </Text>
            <Text color={getImpactColor(path.impact)}>{path.impact.toUpperCase()}</Text>
            <Text color="gray"> | </Text>
            <Text color={getPriorityColor(path.priority)}>Priority: {path.priority}</Text>
          </Box>

          <Box marginBottom={1}>
            <Text color="gray">{path.description}</Text>
          </Box>

          <Box marginBottom={1}>
            <CoverageBar label="Coverage" coverage={path.currentCoverage} />
            <Box paddingLeft={32}>
              <Text color="gray">
                Required: {path.requiredCoverage}% | Gap: {path.coverageGap.toFixed(1)}%
              </Text>
            </Box>
          </Box>

          {path.recommendations.length > 0 && (
            <Box paddingLeft={2} flexDirection="column">
              <Box marginBottom={1}>
                <Text bold color="yellow">
                  Recommendations:
                </Text>
              </Box>
              {path.recommendations.map((rec, recIndex) => (
                <Box key={recIndex} paddingLeft={2}>
                  <Text color="gray">• {rec}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};
