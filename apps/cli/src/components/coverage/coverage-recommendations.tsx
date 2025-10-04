import React from 'react';
import { Box, Text } from 'ink';

interface CoverageRecommendationsProps {
  recommendations: Array<{
    id: string;
    type: 'test' | 'refactor' | 'architecture' | 'strategy';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: {
      coverageImprovement: number;
      riskReduction: number;
      qualityScore: number;
    };
    effort: 'low' | 'medium' | 'high';
    actionItems: string[];
  }>;
  maxRecommendations?: number;
}

export const CoverageRecommendations: React.FC<CoverageRecommendationsProps> = ({
  recommendations,
  maxRecommendations = 5,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'test':
        return 'blue';
      case 'refactor':
        return 'yellow';
      case 'architecture':
        return 'magenta';
      case 'strategy':
        return 'cyan';
      default:
        return 'gray';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
      default:
        return 'gray';
    }
  };

  const sortedRecommendations = [...recommendations]
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, maxRecommendations);

  if (recommendations.length === 0) {
    return (
      <Box padding={1}>
        <Text color="green">No recommendations - great job!</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>
          Coverage Recommendations (showing {sortedRecommendations.length} of{' '}
          {recommendations.length})
        </Text>
      </Box>

      {sortedRecommendations.map((rec, _index) => (
        <Box key={rec.id} flexDirection="column" marginBottom={2} padding={1}>
          <Box marginBottom={1}>
            <Text bold color="blue">
              {rec.title}
            </Text>
            <Text color="gray"> | </Text>
            <Text color={getPriorityColor(rec.priority)}>{rec.priority.toUpperCase()}</Text>
            <Text color="gray"> | </Text>
            <Text color={getTypeColor(rec.type)}>{rec.type}</Text>
            <Text color="gray"> | </Text>
            <Text color={getEffortColor(rec.effort)}>{rec.effort} effort</Text>
          </Box>

          <Box marginBottom={1}>
            <Text>{rec.description}</Text>
          </Box>

          <Box marginBottom={1}>
            <Text bold color="green">
              Expected Impact:
            </Text>
            <Text>
              {' '}
              Coverage: +{rec.impact.coverageImprovement}% | Risk: -{rec.impact.riskReduction}% |
              Quality: +{rec.impact.qualityScore}
            </Text>
          </Box>

          <Box paddingLeft={2} flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color="yellow">
                Action Items:
              </Text>
            </Box>
            {rec.actionItems.map((item, itemIndex) => (
              <Box key={itemIndex} paddingLeft={2}>
                <Text color="gray">• {item}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      {recommendations.length > maxRecommendations && (
        <Box marginTop={1}>
          <Text color="gray">
            ... and {recommendations.length - maxRecommendations} more recommendations
          </Text>
        </Box>
      )}
    </Box>
  );
};
