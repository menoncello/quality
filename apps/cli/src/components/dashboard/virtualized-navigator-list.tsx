/**
 * Virtualized Navigator List Component
 * Optimized for handling large datasets (10K+ items) with virtual scrolling
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { Issue } from '../../types/analysis';
import type { IssueWithPriority } from '../../types/dashboard';

interface VirtualizedNavigatorListProps {
  items: (Issue | IssueWithPriority)[];
  selectedIndex: number;
  onSelect: (item: Issue | IssueWithPriority, index: number) => void;
  renderItem?: (
    item: Issue | IssueWithPriority,
    index: number,
    isSelected: boolean
  ) => React.ReactNode;
  getItemKey?: (item: Issue | IssueWithPriority, index: number) => string;
  height?: number;
  windowSize?: number;
  itemHeight?: number;
}

interface VirtualizedItem {
  item: Issue | IssueWithPriority;
  index: number;
  key: string;
}

export const VirtualizedNavigatorList: React.FC<VirtualizedNavigatorListProps> = ({
  items,
  selectedIndex,
  onSelect,
  renderItem,
  getItemKey,
  height = 20,
  windowSize = 10,
  itemHeight = 2,
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Calculate visible window
  const startIndex = items.length === 0 ? 0 : Math.floor(scrollTop / itemHeight);
  const endIndex = items.length === 0 ? 0 : Math.min(startIndex + windowSize, items.length - 1);
  const visibleItems = items.length === 0 ? [] : items.slice(startIndex, endIndex + 1);

  // Default item key generator
  const defaultGetItemKey = (item: Issue | IssueWithPriority, index: number): string => {
    return item.id || `item-${index}`;
  };

  const keyGenerator = getItemKey ?? defaultGetItemKey;

  // Default render item
  const defaultRenderItem = (
    item: Issue | IssueWithPriority,
    index: number,
    isSelected: boolean
  ): React.ReactNode => {
    const isPriorityIssue = 'priorityScore' in item;
    const issueNumber = startIndex + index + 1;
    const truncatedMessage =
      item.message.length > 50 ? item.message.slice(0, 50) + '...' : item.message;

    return (
      <Box key={keyGenerator(item, startIndex + index)}>
        <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
          <Box>
            <Text color={isSelected ? 'blue' : 'white'}>
              {issueNumber}. {truncatedMessage}
            </Text>
          </Box>
          <Box flexDirection="row" gap={2}>
            <Text color={getSeverityColor(item.type)}>{item.type.toUpperCase()}</Text>
            {isPriorityIssue && item.priorityScore && (
              <Text color={getPriorityColor(item.priorityScore)}>
                P:{item.priorityScore.toFixed(1)}
              </Text>
            )}
            <Text color="gray">{item.toolName}</Text>
          </Box>
        </Box>
      </Box>
    );
  };

  const itemRenderer = renderItem ?? defaultRenderItem;

  // Handle keyboard navigation
  useInput((input, key) => {
    if (isNavigating) return;

    setIsNavigating(true);

    if (key.upArrow && selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      const newScrollTop = Math.max(0, newIndex * itemHeight - (windowSize * itemHeight) / 2);
      setScrollTop(newScrollTop);
      const selectedItem = items[newIndex];
      if (selectedItem) onSelect(selectedItem, newIndex);
    } else if (key.downArrow && selectedIndex < items.length - 1) {
      const newIndex = selectedIndex + 1;
      const newScrollTop = Math.max(0, newIndex * itemHeight - (windowSize * itemHeight) / 2);
      setScrollTop(newScrollTop);
      const selectedItem = items[newIndex];
      if (selectedItem) onSelect(selectedItem, newIndex);
    } else if (key.pageUp && selectedIndex > 0) {
      const newIndex = Math.max(0, selectedIndex - windowSize);
      const newScrollTop = Math.max(0, newIndex * itemHeight - (windowSize * itemHeight) / 2);
      setScrollTop(newScrollTop);
      const selectedItem = items[newIndex];
      if (selectedItem) onSelect(selectedItem, newIndex);
    } else if (key.pageDown && selectedIndex < items.length - 1) {
      const newIndex = Math.min(items.length - 1, selectedIndex + windowSize);
      const newScrollTop = Math.max(0, newIndex * itemHeight - (windowSize * itemHeight) / 2);
      setScrollTop(newScrollTop);
      const selectedItem = items[newIndex];
      if (selectedItem) onSelect(selectedItem, newIndex);
    } else if (key.return) {
      const selectedItem = items[selectedIndex];
      if (selectedItem) onSelect(selectedItem, selectedIndex);
    } else if (input >= '1' && input <= '9') {
      const index = parseInt(input) - 1;
      if (index < items.length) {
        const newScrollTop = Math.max(0, index * itemHeight - (windowSize * itemHeight) / 2);
        setScrollTop(newScrollTop);
        const selectedItem = items[index];
        if (selectedItem) onSelect(selectedItem, index);
      }
    }

    // Reset navigation flag after a short delay
    setTimeout(() => setIsNavigating(false), 100);
  });

  const renderVirtualizedItem = (item: VirtualizedItem, index: number) => {
    const isSelected = startIndex + index === selectedIndex;
    return itemRenderer(item.item, startIndex + index, isSelected);
  };

  return (
    <Box flexDirection="column" height={height}>
      {/* Header with stats */}
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1} paddingX={1}>
        <Text color="gray">
          Showing {items.length === 0 ? 0 : startIndex + 1}-{items.length === 0 ? 0 : endIndex + 1}{' '}
          of {items.length} items
        </Text>
        <Text color="gray">
          Selected: {items.length === 0 ? 0 : selectedIndex + 1}/{items.length}
        </Text>
      </Box>

      {/* Virtualized list */}
      <Box flexDirection="column" borderStyle="round" borderColor="gray">
        {visibleItems.map((item, index) => {
          const virtualItem: VirtualizedItem = {
            item,
            index: startIndex + index,
            key: keyGenerator(item, startIndex + index),
          };
          return renderVirtualizedItem(virtualItem, index);
        })}
      </Box>

      {/* Scroll indicator */}
      {items.length > windowSize && (
        <Box marginTop={1}>
          <Text color="gray">
            Scroll: {Math.round((scrollTop / (items.length * itemHeight - height)) * 100)}%
          </Text>
        </Box>
      )}

      {/* Navigation help */}
      <Box marginTop={1}>
        <Text color="gray" italic>
          Navigation: ↑↓ Page↑↓ Home End [1-9] | Enter to select
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Get color for severity level
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'info':
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Get color for priority score
 */
function getPriorityColor(score: number): string {
  if (score >= 8) return 'red';
  if (score >= 6) return 'yellow';
  if (score >= 4) return 'blue';
  return 'green';
}

export default VirtualizedNavigatorList;
