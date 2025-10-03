/**
 * Sort controls component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import type { SortField, SortOrder } from '../../types/dashboard';

interface SortControlsProps {
  onSortChange?: (field: SortField, order: SortOrder) => void;
}

export function SortControls({
  onSortChange: _onSortChange,
}: SortControlsProps): React.ReactElement {
  const {
    ui: { sortBy, sortOrder },
    setSortOrder,
  } = useDashboardStore();

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortOrder(field, order);
    _onSortChange?.(field, order);
  };

  const _toggleSortOrder = (field: SortField) => {
    const newOrder: SortOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    handleSortChange(field, newOrder);
  };

  const sortFields: Array<{ field: SortField; label: string; width: number }> = [
    { field: 'score', label: 'Score', width: 8 },
    { field: 'severity', label: 'Sev', width: 6 },
    { field: 'filePath', label: 'File', width: 30 },
    { field: 'toolName', label: 'Tool', width: 12 },
    { field: 'lineNumber', label: 'Line', width: 6 },
  ];

  return (
    <Box marginBottom={1} borderStyle="single" borderColor="gray" paddingX={1}>
      <Box justifyContent="space-between">
        {sortFields.map(({ field, label, width: _width }) => {
          const isActive = sortBy === field;
          const orderSymbol = isActive ? (sortOrder === 'asc' ? '↑' : '↓') : ' ';

          return (
            <Box key={field} marginRight={1}>
              <Text color={isActive ? 'cyan' : 'gray'} underline={isActive} bold={isActive}>
                {label}
              </Text>
              <Box marginLeft={1}>
                <Text color={isActive ? 'yellow' : 'gray'}>{orderSymbol}</Text>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Click headers or use Tab to sort
        </Text>
      </Box>
    </Box>
  );
}
