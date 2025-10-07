/**
 * Priority Badge Component
 * Displays priority level with color coding
 */

import React from 'react';
import { Text } from 'ink';

interface PriorityBadgeProps {
  score: number;
  level?: 'critical' | 'high' | 'medium' | 'low';
  showScore?: boolean;
}

const getPriorityColor = (level: string): string => {
  switch (level) {
    case 'critical':
      return 'red';
    case 'high':
      return 'yellow';
    case 'medium':
      return 'blue';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
};

const getPriorityFromScore = (score: number): 'critical' | 'high' | 'medium' | 'low' => {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ score, level, showScore = true }) => {
  const priorityLevel = level ?? getPriorityFromScore(score);
  const color = getPriorityColor(priorityLevel);
  const label = priorityLevel.toUpperCase();

  return (
    <Text color={color} bold>
      {showScore ? `${label} (${score.toFixed(1)})` : label}
    </Text>
  );
};

export default PriorityBadge;
