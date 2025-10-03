/**
 * Export menu component
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useExport } from '../../hooks/useExport';
import { useMenuNavigation } from '../../hooks/useNavigation';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import type { ExportFormat } from '../../types/export';

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportMenu({ isOpen, onClose }: ExportMenuProps): React.ReactElement | null {
  if (!isOpen) return null;

  const {
    supportedFormats,
    exportResults,
    isExporting,
    exportProgress,
    exportError,
    resetExportState,
  } = useExport();
  const { toggleExportMenu } = useDashboardStore();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeIssues, setIncludeIssues] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeFixed, setIncludeFixed] = useState(false);

  // Calculate total menu items
  const formatItems = supportedFormats.length;
  const optionItems = 4; // summary, issues, metrics, fixed
  const actionItems = 2; // export, cancel
  const totalItems = formatItems + optionItems + actionItems;

  const { selectedIndex } = useMenuNavigation(
    totalItems,
    index => handleMenuAction(index),
    onClose,
    isOpen
  );

  const handleMenuAction = async (index: number) => {
    let currentOffset = 0;

    // Check if it's a format item
    if (index < formatItems) {
      const format = supportedFormats[index];
      setSelectedFormat(format ?? null);
      return;
    }
    currentOffset += formatItems;

    // Check if it's an option item
    if (index < currentOffset + optionItems) {
      const optionIndex = index - currentOffset;
      switch (optionIndex) {
        case 0:
          setIncludeSummary(!includeSummary);
          break;
        case 1:
          setIncludeIssues(!includeIssues);
          break;
        case 2:
          setIncludeMetrics(!includeMetrics);
          break;
        case 3:
          setIncludeFixed(!includeFixed);
          break;
      }
      return;
    }
    currentOffset += optionItems;

    // Check if it's an action item
    if (index < currentOffset + actionItems) {
      const actionIndex = index - currentOffset;
      if (actionIndex === 0) {
        // Export action
        if (selectedFormat) {
          await performExport(selectedFormat);
        }
      } else if (actionIndex === 1) {
        // Cancel action
        resetExportState();
        onClose();
        toggleExportMenu();
      }
      return;
    }
  };

  const performExport = async (format: ExportFormat) => {
    const result = await exportResults(format.id, {
      includeSummary,
      includeIssues,
      includeMetrics,
      includeFixed,
    });

    if (result.success) {
      // Auto-close on success
      setTimeout(() => {
        onClose();
        toggleExportMenu();
        resetExportState();
      }, 2000);
    }
  };

  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape && !isExporting) {
      resetExportState();
      onClose();
      toggleExportMenu();
    }
  });

  // Render format section
  const renderFormatSection = () => (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Export Format
        </Text>
      </Box>
      {supportedFormats.map((format, index) => {
        const isSelected = selectedFormat?.id === format.id;
        const isHighlighted = index === selectedIndex;

        return (
          <Box key={format.id} marginLeft={1}>
            <Text color={isHighlighted ? 'white' : 'gray'}>[{isSelected ? '✓' : ' '}]</Text>
            <Text color={isHighlighted ? 'white' : 'reset'}>
              {' '}
              {format.name} (.{format.extension})
            </Text>
            <Text color="gray" dimColor>
              {' '}
              - {format.description}
            </Text>
          </Box>
        );
      })}
    </Box>
  );

  // Render options section
  const renderOptionsSection = () => {
    const optionStartIndex = supportedFormats.length;

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Export Options
          </Text>
        </Box>

        <Box marginLeft={1}>
          <Text color={optionStartIndex === selectedIndex ? 'white' : 'gray'}>
            [{optionStartIndex === selectedIndex ? '>' : ' '}]
          </Text>
          <Text color={optionStartIndex === selectedIndex ? 'white' : 'reset'}>
            {' '}
            [{includeSummary ? '✓' : ' '}] Include summary
          </Text>
        </Box>

        <Box marginLeft={1}>
          <Text color={optionStartIndex + 1 === selectedIndex ? 'white' : 'gray'}>
            [{optionStartIndex + 1 === selectedIndex ? '>' : ' '}]
          </Text>
          <Text color={optionStartIndex + 1 === selectedIndex ? 'white' : 'reset'}>
            {' '}
            [{includeIssues ? '✓' : ' '}] Include issues
          </Text>
        </Box>

        <Box marginLeft={1}>
          <Text color={optionStartIndex + 2 === selectedIndex ? 'white' : 'gray'}>
            [{optionStartIndex + 2 === selectedIndex ? '>' : ' '}]
          </Text>
          <Text color={optionStartIndex + 2 === selectedIndex ? 'white' : 'reset'}>
            {' '}
            [{includeMetrics ? '✓' : ' '}] Include metrics
          </Text>
        </Box>

        <Box marginLeft={1}>
          <Text color={optionStartIndex + 3 === selectedIndex ? 'white' : 'gray'}>
            [{optionStartIndex + 3 === selectedIndex ? '>' : ' '}]
          </Text>
          <Text color={optionStartIndex + 3 === selectedIndex ? 'white' : 'reset'}>
            {' '}
            [{includeFixed ? '✓' : ' '}] Include fixed issues
          </Text>
        </Box>
      </Box>
    );
  };

  // Render actions section
  const renderActionsSection = () => {
    const actionStartIndex = supportedFormats.length + 4;
    const exportIndex = actionStartIndex;
    const cancelIndex = actionStartIndex + 1;

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Actions
          </Text>
        </Box>

        <Box marginLeft={1}>
          <Text color={exportIndex === selectedIndex ? 'white' : 'gray'}>
            [{exportIndex === selectedIndex ? '>' : ' '}]
          </Text>
          <Text color={exportIndex === selectedIndex ? 'white' : selectedFormat ? 'green' : 'gray'}>
            {' '}
            Export {selectedFormat ? `as ${selectedFormat.name}` : '(select format first)'}
          </Text>
        </Box>

        <Box marginLeft={1}>
          <Text color={cancelIndex === selectedIndex ? 'white' : 'gray'}>
            [{cancelIndex === selectedIndex ? '>' : ' '}]
          </Text>
          <Text color={cancelIndex === selectedIndex ? 'white' : 'red'}> Cancel</Text>
        </Box>
      </Box>
    );
  };

  // Render progress
  const renderProgress = () => {
    if (!isExporting || !exportProgress) return null;

    return (
      <Box
        flexDirection="column"
        marginBottom={1}
        padding={1}
        borderStyle="single"
        borderColor="blue"
      >
        <Box marginBottom={1}>
          <Text bold color="blue">
            Exporting...
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text>{exportProgress.currentStep}</Text>
        </Box>
        <Box>
          <Text>Progress: {exportProgress.percentage}%</Text>
          {exportProgress.bytesWritten && (
            <Text> Size: {(exportProgress.bytesWritten / 1024).toFixed(1)}KB</Text>
          )}
        </Box>
      </Box>
    );
  };

  // Render result
  const renderResult = () => {
    if (!exportProgress || exportProgress.percentage < 100) return null;

    return (
      <Box
        flexDirection="column"
        marginBottom={1}
        padding={1}
        borderStyle="single"
        borderColor={exportError ? 'red' : 'green'}
      >
        {exportError ? (
          <>
            <Box marginBottom={1}>
              <Text bold color="red">
                Export Failed
              </Text>
            </Box>
            <Text color="red">{exportError}</Text>
          </>
        ) : (
          <>
            <Box marginBottom={1}>
              <Text bold color="green">
                Export Complete
              </Text>
            </Box>
            <Text color="green">Report saved successfully!</Text>
          </>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="blue" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          Export Options
        </Text>
      </Box>

      {renderFormatSection()}
      {renderOptionsSection()}
      {renderActionsSection()}
      {renderProgress()}
      {renderResult()}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ↑↓ Navigate | Space: Toggle | Enter: Select | Esc: Close
        </Text>
      </Box>
    </Box>
  );
}
