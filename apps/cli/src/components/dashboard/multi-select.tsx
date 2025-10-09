/**
 * Multi-Select Component
 * Allows selecting multiple items from a list with keyboard navigation
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface MultiSelectProps {
  items: string[];
  selectedItems: string[];
  onChange: (selectedItems: string[]) => void;
  placeholder?: string;
  maxHeight?: number;
  searchable?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  items,
  selectedItems,
  onChange,
  placeholder = 'Select items...',
  maxHeight = 5,
  searchable: _searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Filter items based on search term
  const filteredItems = items.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));

  // Get display items (show selected items when closed, filtered items when open)
  const _displayItems = isOpen ? filteredItems : selectedItems;

  // Handle keyboard navigation
  useInput((input, key) => {
    if (!isOpen) {
      if (key.return) {
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (true) {
      case key.return: {
        // Toggle selection
        const focusedItem = filteredItems[focusedIndex];
        if (focusedItem) {
          const isSelected = selectedItems.includes(focusedItem);
          const newSelection = isSelected
            ? selectedItems.filter(item => item !== focusedItem)
            : [...selectedItems, focusedItem];
          onChange(newSelection);
        }
        break;
      }

      case key.escape:
        setIsOpen(false);
        setSearchTerm('');
        break;

      case key.upArrow:
        setFocusedIndex(prev => Math.max(0, prev - 1));
        break;

      case key.downArrow:
        setFocusedIndex(prev => Math.min(filteredItems.length - 1, prev + 1));
        break;

      case key.ctrl && input === 'a':
        // Select all filtered items
        onChange([...new Set([...selectedItems, ...filteredItems])]);
        break;

      case key.ctrl && input === 'n':
        // Deselect all
        onChange([]);
        break;

      default:
        // Handle search input
        if (input && !key.ctrl && !key.meta) {
          setSearchTerm(prev => prev + input);
          setFocusedIndex(0);
        }
        break;
    }
  });

  // Auto-focus logic
  useEffect(() => {
    if (isOpen && focusedIndex >= filteredItems.length) {
      setFocusedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, focusedIndex, isOpen]);

  const _handleRemoveItem = (itemToRemove: string) => {
    onChange(selectedItems.filter(item => item !== itemToRemove));
  };

  if (!isOpen) {
    return (
      <Box flexDirection="column">
        {/* Selected items display */}
        <Box flexDirection="row" borderStyle="single" borderColor="gray" padding={1} minHeight={3}>
          {selectedItems.length === 0 ? (
            <Text color="gray">{placeholder}</Text>
          ) : (
            <Box flexDirection="row" flexWrap="wrap">
              {selectedItems.map(item => (
                <Box
                  key={item}
                  flexDirection="row"
                  marginRight={1}
                  marginBottom={1}
                  paddingX={1}
                  backgroundColor="blue"
                >
                  <Text color="white">{item}</Text>
                  <Text color="red" bold>
                    {' '}
                    ×
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Text color="gray" dimColor>
          [Enter] to open • {selectedItems.length} selected
        </Text>
      </Box>
    );
  }

  // Open state with search and list
  return (
    <Box flexDirection="column">
      {/* Search input */}
      <Box flexDirection="row" borderStyle="single" borderColor="blue" padding={1}>
        <Text color="blue">Search: </Text>
        <Text>{searchTerm}</Text>
        <Text color="gray">_</Text>
      </Box>

      {/* Filtered items list */}
      <Box flexDirection="column" borderStyle="single" borderColor="gray">
        {filteredItems.length === 0 ? (
          <Box padding={1}>
            <Text color="gray">No items found</Text>
          </Box>
        ) : (
          filteredItems.slice(0, maxHeight).map((item, index) => {
            const isSelected = selectedItems.includes(item);
            const isFocused = index === focusedIndex;

            return (
              <Box
                key={item}
                flexDirection="row"
                padding={1}
                backgroundColor={
                  isFocused ? (isSelected ? 'green' : 'blue') : isSelected ? 'cyan' : undefined
                }
              >
                <Text color={isSelected || isFocused ? 'white' : 'black'}>
                  {isSelected ? '✓' : ' '} {item}
                </Text>
              </Box>
            );
          })
        )}

        {/* Show more indicator */}
        {filteredItems.length > maxHeight && (
          <Box padding={1} borderTop={true}>
            <Text color="gray">...and {filteredItems.length - maxHeight} more items</Text>
          </Box>
        )}
      </Box>

      {/* Help text */}
      <Box flexDirection="row" marginTop={1}>
        <Text color="gray">
          [↑↓] Navigate • [Enter] Select • [Esc] Close • [Ctrl+A] All • [Ctrl+N] None
        </Text>
      </Box>
    </Box>
  );
};

export default MultiSelect;
