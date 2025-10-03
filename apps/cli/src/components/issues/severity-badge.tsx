/**
 * Severity badge component
 */

import React from 'react';
import { Text } from 'ink';
import { getSeverityColor, getSeveritySymbol } from '../../utils/color-coding';
import type { IssueSeverity } from '../../types/dashboard';

interface SeverityBadgeProps {
  severity: IssueSeverity;
  showSymbol?: boolean;
  compact?: boolean;
}

export function SeverityBadge({
  severity,
  showSymbol = true,
  compact = false,
}: SeverityBadgeProps): React.ReactElement {
  const color = getSeverityColor(severity);
  const symbol = getSeveritySymbol(severity);
  const label = severity.toUpperCase();

  if (compact) {
    return (
      <Text color={color} backgroundColor="black">
        {showSymbol ? symbol : ''}
        {label.charAt(0)}
      </Text>
    );
  }

  return (
    <Text color={color} backgroundColor="black">
      {showSymbol && <Text>{symbol}</Text>}
      <Text bold>{label}</Text>
    </Text>
  );
}
