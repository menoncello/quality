/**
 * Filter Panel Component
 * Multi-criteria filtering interface for dashboard issues
 */

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useFilterStore, type FilterCriteria, type FilterPreset } from '../../hooks/useFilterStore';
import { MultiSelect } from './multi-select';
import { RangeSlider } from './range-slider';

interface FilterPanelProps {
  availableSeverities: string[];
  availableTools: string[];
  availableFiles: string[];
  availableModules: string[];
  onApply: () => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  availableSeverities,
  availableTools,
  availableFiles: _availableFiles,
  availableModules: _availableModules,
  onApply: _onApply,
  onReset: _onReset,
}) => {
  const {
    filters,
    search,
    presets,
    currentPresetId,
    setFilters,
    setSearch,
    loadPreset,
    savePreset,
    deletePreset,
    setDefaultPreset,
  } = useFilterStore();

  const [activeTab, setActiveTab] = useState<'criteria' | 'search' | 'presets'>('criteria');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  // Get active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.severity?.length) count++;
    if (filters.tools?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.files?.length) count++;
    if (filters.modules?.length) count++;
    if (filters.hasFix !== undefined) count++;
    if (filters.scoreRange && (filters.scoreRange[0] > 1 || filters.scoreRange[1] < 10)) count++;
    if (search.query.trim()) count++;
    return count;
  }, [filters, search]);

  // Keyboard navigation
  useInput((input, key) => {
    if (key.ctrl && input === 'f') {
      setActiveTab('criteria');
    } else if (key.ctrl && input === 's') {
      setActiveTab('search');
    } else if (key.ctrl && input === 'p') {
      setActiveTab('presets');
    } else if (key.escape) {
      setShowSaveDialog(false);
      setPresetName('');
      setPresetDescription('');
    }
  });

  const _handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName.trim(), presetDescription.trim());
      setShowSaveDialog(false);
      setPresetName('');
      setPresetDescription('');
    }
  };

  const handleDeletePreset = (presetId: string) => {
    deletePreset(presetId);
  };

  const handleSetDefaultPreset = (presetId: string) => {
    setDefaultPreset(presetId);
  };

  return (
    <Box flexDirection="column" width={80}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Text bold color="blue">
          Filters
        </Text>
        {activeFilterCount > 0 && (
          <Text color="cyan" backgroundColor="blue">
            {' '}
            {activeFilterCount} active{' '}
          </Text>
        )}
        <Box flexGrow={1} />
        <Text color="gray">[Ctrl+F] Filters [Ctrl+S] Search [Ctrl+P] Presets [Esc] Close</Text>
      </Box>

      {/* Tab Navigation */}
      <Box flexDirection="row" marginBottom={1}>
        {[
          { key: 'criteria', label: 'Filter Criteria' },
          { key: 'search', label: 'Search' },
          { key: 'presets', label: 'Presets' },
        ].map(tab => (
          <Box
            key={tab.key}
            marginRight={1}
            paddingX={1}
            backgroundColor={activeTab === tab.key ? 'blue' : 'gray'}
          >
            <Text color={activeTab === tab.key ? 'white' : 'black'} bold={activeTab === tab.key}>
              {tab.label}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Tab Content */}
      {activeTab === 'criteria' && (
        <FilterCriteriaTab
          filters={filters}
          availableSeverities={availableSeverities}
          availableTools={availableTools}
          availableFiles={_availableFiles}
          availableModules={_availableModules}
          onFiltersChange={setFilters}
        />
      )}

      {activeTab === 'search' && <SearchTab search={search} onSearchChange={setSearch} />}

      {activeTab === 'presets' && (
        <PresetsTab
          presets={presets}
          currentPresetId={currentPresetId}
          onLoadPreset={loadPreset}
          onDeletePreset={handleDeletePreset}
          onSetDefaultPreset={handleSetDefaultPreset}
          onSaveNew={() => setShowSaveDialog(true)}
        />
      )}

      {/* Save Preset Dialog */}
      {showSaveDialog && (
        <Box
          flexDirection="column"
          marginTop={1}
          padding={1}
          borderStyle="round"
          borderColor="blue"
        >
          <Text bold color="blue">
            Save Current Filters as Preset
          </Text>
          <Box flexDirection="column" marginTop={1}>
            <Text color="gray">Name:</Text>
            <Box paddingLeft={1}>
              <Text color="yellow">"{presetName || '(empty)'}"</Text>
            </Box>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            <Text color="gray">Description:</Text>
            <Box paddingLeft={1}>
              <Text color="yellow">"{presetDescription || '(empty)'}"</Text>
            </Box>
          </Box>
          <Box flexDirection="row" marginTop={1}>
            <Text color="green">[Enter] Save</Text>
            <Box paddingLeft={2}>
              <Text color="red">[Esc] Cancel</Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Action Buttons */}
      <Box flexDirection="row" marginTop={2}>
        <Box backgroundColor="green">
          <Text color="black"> [Enter] Apply Filters </Text>
        </Box>
        <Box paddingLeft={1} backgroundColor="yellow">
          <Text color="black"> [R] Reset </Text>
        </Box>
        <Box paddingLeft={1} backgroundColor="blue">
          <Text color="black"> [Ctrl+S] Save Preset </Text>
        </Box>
      </Box>
    </Box>
  );
};

interface FilterCriteriaTabProps {
  filters: FilterCriteria;
  availableSeverities: string[];
  availableTools: string[];
  availableFiles: string[];
  availableModules: string[];
  onFiltersChange: (filters: Partial<FilterCriteria>) => void;
}

const FilterCriteriaTab: React.FC<FilterCriteriaTabProps> = ({
  filters,
  availableSeverities,
  availableTools,
  availableFiles: _availableFiles,
  availableModules: _availableModules,
  onFiltersChange,
}) => {
  return (
    <Box flexDirection="column">
      {/* Severity Filter */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          Severity
        </Text>
        <MultiSelect
          items={availableSeverities}
          selectedItems={filters.severity ?? []}
          onChange={severity => onFiltersChange({ severity })}
          placeholder="Select severities..."
        />
      </Box>

      {/* Tools Filter */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          Tools
        </Text>
        <MultiSelect
          items={availableTools}
          selectedItems={filters.tools ?? []}
          onChange={tools => onFiltersChange({ tools })}
          placeholder="Select tools..."
        />
      </Box>

      {/* Priority Filter */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          Priority
        </Text>
        <MultiSelect
          items={['critical', 'high', 'medium', 'low']}
          selectedItems={filters.priority ?? []}
          onChange={priority => onFiltersChange({ priority })}
          placeholder="Select priorities..."
        />
      </Box>

      {/* Score Range Filter */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          Score Range: {filters.scoreRange?.[0] ?? 1} - {filters.scoreRange?.[1] ?? 10}
        </Text>
        <RangeSlider
          min={1}
          max={10}
          value={filters.scoreRange ?? [1, 10]}
          onChange={scoreRange => onFiltersChange({ scoreRange })}
        />
      </Box>

      {/* Fixable Filter */}
      <Box flexDirection="row" marginBottom={1}>
        <Text color="cyan">[F] Fixable only:</Text>
        <Box paddingLeft={1}>
          <Text color={filters.hasFix === true ? 'green' : 'gray'}>
            {filters.hasFix === true ? '☑' : '☐'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

interface SearchTabProps {
  search: {
    query: string;
    fields: ('message' | 'filePath' | 'ruleId' | 'toolName')[];
    caseSensitive: boolean;
    useRegex: boolean;
  };
  onSearchChange: (search: Partial<SearchTabProps['search']>) => void;
}

const SearchTab: React.FC<SearchTabProps> = ({ search, onSearchChange }) => {
  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          Search Query
        </Text>
        <Box flexDirection="row">
          <Text color="gray">Query:</Text>
          <Box paddingLeft={1}>
            <Text color="yellow">"{search.query || '(empty)'}"</Text>
          </Box>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          Search Fields
        </Text>
        <MultiSelect
          items={['message', 'filePath', 'ruleId', 'toolName']}
          selectedItems={search.fields}
          onChange={fields => onSearchChange({ fields: fields as (typeof search.fields)[0][] })}
          placeholder="Select fields to search..."
        />
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Text color="cyan">[C] Case sensitive:</Text>
        <Box paddingLeft={1}>
          <Text color={search.caseSensitive ? 'green' : 'gray'}>
            {search.caseSensitive ? '☑' : '☐'}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Text color="cyan">[R] Use regex:</Text>
        <Box paddingLeft={1}>
          <Text color={search.useRegex ? 'green' : 'gray'}>{search.useRegex ? '☑' : '☐'}</Text>
        </Box>
      </Box>
    </Box>
  );
};

interface PresetsTabProps {
  presets: FilterPreset[];
  currentPresetId?: string;
  onLoadPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  onSetDefaultPreset: (presetId: string) => void;
  onSaveNew: () => void;
}

const PresetsTab: React.FC<PresetsTabProps> = ({
  presets,
  currentPresetId,
  onLoadPreset: _onLoadPreset,
  onDeletePreset: _onDeletePreset,
  onSetDefaultPreset: _onSetDefaultPreset,
  onSaveNew: _onSaveNew,
}) => {
  return (
    <Box flexDirection="column">
      <Box flexDirection="row" marginBottom={1}>
        <Text bold color="cyan">
          Filter Presets
        </Text>
        <Box flexGrow={1} />
        <Text color="blue" inverse={true}>
          {' '}
          [N] New Preset{' '}
        </Text>
      </Box>

      {presets.map(preset => (
        <Box
          key={preset.id}
          flexDirection="column"
          marginBottom={1}
          padding={1}
          borderStyle="round"
          borderColor={currentPresetId === preset.id ? 'green' : 'gray'}
        >
          <Box flexDirection="row">
            <Text bold>
              {preset.name}
              {preset.isDefault && <Text color="yellow"> (default)</Text>}
            </Text>
            {currentPresetId === preset.id && <Text color="green"> ✓</Text>}
          </Box>
          <Text color="gray">{preset.description}</Text>
          <Box flexDirection="row" marginTop={1}>
            <Text color="blue">[Enter] Load</Text>
            <Box paddingLeft={2}>
              <Text color="green">[D] Set Default</Text>
            </Box>
            {!preset.isDefault && (
              <Box paddingLeft={2}>
                <Text color="red">[Delete] Remove</Text>
              </Box>
            )}
          </Box>
        </Box>
      ))}

      {presets.length === 0 && (
        <Box flexDirection="row" padding={2} borderStyle="round" borderColor="gray">
          <Text color="gray">No presets saved yet. Create your first preset!</Text>
        </Box>
      )}
    </Box>
  );
};

export default FilterPanel;
