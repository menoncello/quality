/**
 * Triage Suggestion Component
 * Displays automated triage recommendations with actions
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { TriageSuggestion as TriageSuggestionType } from '@dev-quality/types';

interface TriageSuggestionProps {
  suggestion: TriageSuggestionType;
  onAccept?: () => void;
  onReject?: () => void;
  interactive?: boolean;
}

const getActionColor = (action: string): string => {
  switch (action) {
    case 'fix-now':
      return 'red';
    case 'schedule':
      return 'yellow';
    case 'delegate':
      return 'blue';
    case 'monitor':
      return 'cyan';
    case 'ignore':
      return 'gray';
    default:
      return 'white';
  }
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'green';
  if (confidence >= 0.6) return 'yellow';
  if (confidence >= 0.4) return 'orange';
  return 'red';
};

export const TriageSuggestion: React.FC<TriageSuggestionProps> = ({
  suggestion,
  onAccept,
  onReject,
  interactive = false,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const actions = ['accept', 'reject'];

  useInput((input, key) => {
    if (!interactive) return;

    if (key.leftArrow) {
      setSelectedIndex(prev => (prev - 1 + actions.length) % actions.length);
    } else if (key.rightArrow) {
      setSelectedIndex(prev => (prev + 1) % actions.length);
    } else if (key.return) {
      if (selectedIndex === 0 && onAccept) {
        onAccept();
      } else if (selectedIndex === 1 && onReject) {
        onReject();
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={getActionColor(suggestion.action)}>
          {suggestion.action.toUpperCase()}
        </Text>
        <Text> (Priority: {suggestion.priority}/10)</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">Reasoning: </Text>
        <Text>{suggestion.reasoning}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">Effort: </Text>
        <Text>{suggestion.estimatedEffort}h</Text>
        <Text color="gray"> | Confidence: </Text>
        <Text color={getConfidenceColor(suggestion.confidence)}>
          {(suggestion.confidence * 100).toFixed(0)}%
        </Text>
      </Box>

      {suggestion.assignee && (
        <Box marginBottom={1}>
          <Text color="gray">Assignee: </Text>
          <Text>{suggestion.assignee}</Text>
        </Box>
      )}

      {suggestion.deadline && (
        <Box marginBottom={1}>
          <Text color="gray">Deadline: </Text>
          <Text>{suggestion.deadline.toLocaleDateString()}</Text>
        </Box>
      )}

      {interactive && (
        <Box marginTop={1}>
          {actions.map((action, index) => (
            <Box key={action} marginRight={1}>
              <Text
                color={index === selectedIndex ? 'blue' : 'gray'}
                underline={index === selectedIndex}
              >
                [{action.toUpperCase()}]
              </Text>
            </Box>
          ))}
          <Text color="gray"> (Use arrow keys and Enter to select)</Text>
        </Box>
      )}
    </Box>
  );
};

export default TriageSuggestion;
