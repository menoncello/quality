import React from 'react';
import { Box, Text } from 'ink';
import { CoverageBar } from './coverage-bar.js';

interface FileCoverageListProps {
  files: Array<{
    filePath: string;
    relativePath: string;
    overallCoverage: number;
    lineCoverage: number;
    branchCoverage: number;
    functionCoverage: number;
    statementCoverage: number;
    riskScore: number;
  }>;
  maxFiles?: number;
  sortBy?: 'coverage' | 'risk' | 'path';
}

export const FileCoverageList: React.FC<FileCoverageListProps> = ({
  files,
  maxFiles = 10,
  sortBy = 'coverage',
}) => {
  const getSortedFiles = () => {
    const sorted = [...files];

    switch (sortBy) {
      case 'coverage':
        return sorted.sort((a, b) => a.overallCoverage - b.overallCoverage);
      case 'risk':
        return sorted.sort((a, b) => b.riskScore - a.riskScore);
      case 'path':
        return sorted.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
      default:
        return sorted;
    }
  };

  const displayFiles = getSortedFiles().slice(0, maxFiles);

  if (files.length === 0) {
    return (
      <Box padding={1}>
        <Text color="gray">No coverage data available</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>
          File Coverage (showing {displayFiles.length} of {files.length} files, sorted by {sortBy})
        </Text>
      </Box>

      {displayFiles.map((file, index) => (
        <Box key={index} flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text bold color="blue">
              {file.relativePath}
            </Text>
            <Text color="gray"> (risk: {file.riskScore.toFixed(1)})</Text>
          </Box>

          <Box paddingLeft={2} flexDirection="column">
            <CoverageBar label="Overall" coverage={file.overallCoverage} />
            <CoverageBar label="Lines" coverage={file.lineCoverage} />
            <CoverageBar label="Branches" coverage={file.branchCoverage} />
            <CoverageBar label="Functions" coverage={file.functionCoverage} />
            <CoverageBar label="Statements" coverage={file.statementCoverage} />
          </Box>
        </Box>
      ))}

      {files.length > maxFiles && (
        <Box marginTop={1}>
          <Text color="gray">... and {files.length - maxFiles} more files</Text>
        </Box>
      )}
    </Box>
  );
};
