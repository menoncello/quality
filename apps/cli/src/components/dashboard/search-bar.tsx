/**
 * Search Bar Component
 * Real-time search with advanced options
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useFilterStore } from '../../hooks/useFilterStore';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  showAdvanced?: boolean;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search issues...',
  showAdvanced = true,
  autoFocus = false,
}) => {
  const {
    search,
    setSearch,
    filterResults: _filterResults,
    totalResults,
    isLoading,
  } = useFilterStore();

  const [isFocused, setIsFocused] = useState(autoFocus);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search.query.trim()) {
        onSearch(search.query.trim());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search.query, onSearch]);

  // Update search history
  useEffect(() => {
    if (search.query.trim() && !searchHistory.includes(search.query.trim())) {
      setSearchHistory(prev => [...prev.slice(-9), search.query.trim()]);
    }
  }, [search.query, searchHistory]);

  // Keyboard navigation
  useInput((input, key) => {
    if (!isFocused) {
      if (input === '/' && !key.ctrl) {
        setIsFocused(true);
        return;
      }
      return;
    }

    switch (true) {
      case key.escape:
        setIsFocused(false);
        setShowAdvancedOptions(false);
        break;

      case key.ctrl && input === 'r':
        // Toggle regex
        setSearch({ useRegex: !search.useRegex });
        break;

      case key.ctrl && input === 'c':
        // Toggle case sensitivity
        setSearch({ caseSensitive: !search.caseSensitive });
        break;

      case key.ctrl && input === 'a':
        // Show advanced options
        setShowAdvancedOptions(!showAdvancedOptions);
        break;

      case key.upArrow:
        // Navigate search history
        if (searchHistory.length > 0) {
          const newIndex = Math.min(historyIndex + 1, searchHistory.length - 1);
          setHistoryIndex(newIndex);
          setSearch({ query: searchHistory[searchHistory.length - 1 - newIndex] });
        }
        break;

      case key.downArrow:
        // Navigate search history
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setSearch({ query: searchHistory[searchHistory.length - 1 - newIndex] });
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setSearch({ query: '' });
        }
        break;

      case key.tab && showAdvanced: {
        // Cycle through search fields
        const fields = ['message', 'filePath', 'ruleId', 'toolName'];
        const currentFieldIndex = search.fields.indexOf(
          search.fields[search.fields.length - 1] as 'message' | 'filePath' | 'ruleId' | 'toolName'
        );
        const nextFieldIndex = (currentFieldIndex + 1) % fields.length;
        const newFields = [...search.fields];

        if (key.shift) {
          // Remove last field
          if (newFields.length > 1) {
            newFields.pop();
          }
        } else {
          // Add next field if not already present
          const nextField = fields[nextFieldIndex] as
            | 'message'
            | 'filePath'
            | 'ruleId'
            | 'toolName';
          if (!newFields.includes(nextField)) {
            newFields.push(nextField);
          }
        }

        setSearch({ fields: newFields });
        break;
      }

      case key.ctrl && input === 'h':
        // Clear search history
        setSearchHistory([]);
        setHistoryIndex(-1);
        break;

      case key.return:
        // Trigger search immediately
        if (search.query.trim()) {
          onSearch(search.query.trim());
        }
        break;

      default:
        break;
    }
  });

  const _handleInputChange = (value: string) => {
    setSearch({ query: value });
    setHistoryIndex(-1); // Reset history index when typing
  };

  const _clearSearch = () => {
    setSearch({ query: '' });
    setHistoryIndex(-1);
    setIsFocused(false);
  };

  const getSearchFieldDisplay = () => {
    if (search.fields.length === 4) return 'All';
    if (search.fields.length === 1) return search.fields[0];
    return `${search.fields.length} fields`;
  };

  const getStatusColor = () => {
    if (isLoading) return 'yellow';
    if (search.query.trim()) return 'green';
    return 'gray';
  };

  return (
    <Box flexDirection="column">
      {/* Main search bar */}
      <Box flexDirection="row" alignItems="center">
        <Text color={isFocused ? 'blue' : 'gray'} bold>
          {' '}
          🔍{' '}
        </Text>

        <Box flexGrow={1}>
          <Text color={isFocused ? 'green' : 'gray'}>{search.query || placeholder}</Text>
        </Box>

        {/* Search status */}
        <Box paddingLeft={1}>
          <Text color={getStatusColor()}>
            {isLoading ? '⏳' : search.query.trim() ? '✓' : ' / '}
          </Text>
        </Box>

        {/* Results count */}
        {search.query.trim() && (
          <Box paddingLeft={1}>
            <Text color="cyan">({totalResults} results)</Text>
          </Box>
        )}

        {/* Clear button */}
        {search.query.trim() && (
          <Box paddingLeft={1}>
            <Text color="red">[X]</Text>
          </Box>
        )}
      </Box>

      {/* Search options bar */}
      {showAdvanced && (showAdvancedOptions || search.query.trim()) && (
        <Box flexDirection="row" marginTop={1} paddingX={1} backgroundColor="gray">
          <Text color="black" dimColor>
            Fields: <Text bold>{getSearchFieldDisplay()}</Text>
          </Text>
          <Box paddingLeft={2}>
            <Text color="black" dimColor>
              Case: <Text bold>{search.caseSensitive ? 'Yes' : 'No'}</Text>
            </Text>
          </Box>
          <Box paddingLeft={2}>
            <Text color="black" dimColor>
              Regex: <Text bold>{search.useRegex ? 'Yes' : 'No'}</Text>
            </Text>
          </Box>

          {searchHistory.length > 0 && (
            <Box paddingLeft={2}>
              <Text color="black" dimColor>
                History: {searchHistory.length} items
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Help text */}
      {isFocused && (
        <Box flexDirection="row" marginTop={1}>
          <Text color="gray" dimColor>
            [↑↓] History • [Ctrl+R] Regex • [Ctrl+C] Case • [Ctrl+A] Advanced • [Esc] Focus out
            {showAdvanced && ' • [Tab] Fields • [Ctrl+H] Clear history'}
          </Text>
        </Box>
      )}

      {/* Search history dropdown */}
      {isFocused && searchHistory.length > 0 && historyIndex >= 0 && (
        <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="gray">
          <Text color="gray" bold>
            Search History:
          </Text>
          {searchHistory
            .slice(-5)
            .reverse()
            .map((query, index) => (
              <Box
                key={query}
                flexDirection="row"
                padding={1}
                backgroundColor={index === historyIndex ? 'blue' : undefined}
              >
                <Text color={index === historyIndex ? 'white' : 'black'}>{query}</Text>
              </Box>
            ))}
        </Box>
      )}

      {/* No focus indicator */}
      {!isFocused && (
        <Box flexDirection="row" marginTop={1}>
          <Text color="gray" dimColor>
            Press [/] to focus search
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default SearchBar;
