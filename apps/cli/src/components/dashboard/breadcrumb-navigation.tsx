/**
 * Breadcrumb Navigation Component
 * Displays hierarchical navigation path with keyboard support
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { NavigationBreadcrumb } from '../../types/dashboard';

interface BreadcrumbNavigationProps {
  breadcrumbs: NavigationBreadcrumb[];
  onSelect?: (breadcrumb: NavigationBreadcrumb, index: number) => void;
  showSeparator?: boolean;
  maxItems?: number;
}

const SEPARATOR = ' › ';

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  breadcrumbs,
  onSelect,
  showSeparator = true,
  maxItems = 10,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  useInput((input, key) => {
    if (breadcrumbs.length === 0 || !onSelect) return;

    if (key.leftArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setSelectedIndex(prev => Math.min(breadcrumbs.length - 1, prev + 1));
    } else if (key.return && selectedIndex >= 0 && selectedIndex < breadcrumbs.length) {
      const selectedBreadcrumb = breadcrumbs[selectedIndex];
      if (selectedBreadcrumb) {
        onSelect(selectedBreadcrumb, selectedIndex);
      }
    }
  });

  // Limit breadcrumbs to prevent overflow
  const displayBreadcrumbs = breadcrumbs.slice(-maxItems);
  const hasMoreItems = breadcrumbs.length > maxItems;

  const renderBreadcrumb = (breadcrumb: NavigationBreadcrumb, index: number, isLast: boolean) => {
    const isSelected = selectedIndex === index;
    const displayLabel =
      breadcrumb.label.length > 20 ? `${breadcrumb.label.slice(0, 17)}...` : breadcrumb.label;

    return (
      <Box key={breadcrumb.id}>
        <Text color={isSelected ? 'blue' : 'gray'} underline={isSelected} bold={isSelected}>
          {displayLabel}
        </Text>
        {!isLast && showSeparator && <Text color="gray">{SEPARATOR}</Text>}
      </Box>
    );
  };

  return (
    <Box flexDirection="row" alignItems="center">
      {hasMoreItems && (
        <Box marginRight={1}>
          <Text color="gray">...</Text>
          <Text color="gray">{SEPARATOR}</Text>
        </Box>
      )}

      {displayBreadcrumbs.map((breadcrumb, index) =>
        renderBreadcrumb(breadcrumb, index, index === displayBreadcrumbs.length - 1)
      )}

      {selectedIndex >= 0 && selectedIndex < displayBreadcrumbs.length && (
        <Box marginLeft={1}>
          <Text color="gray">(Selected: {displayBreadcrumbs[selectedIndex]?.label})</Text>
        </Box>
      )}

      {breadcrumbs.length > 0 && onSelect && (
        <Box marginLeft={1}>
          <Text color="gray" italic>
            [Use arrow keys to select, Enter to navigate]
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default BreadcrumbNavigation;
