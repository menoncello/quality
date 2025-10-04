import React from 'react';
import { Box, Text } from 'ink';

interface CoverageSummaryProps {
  summary: {
    overallCoverage: number;
    lineCoverage: number;
    branchCoverage: number;
    functionCoverage: number;
    statementCoverage: number;
    qualityScore: number;
    grade: string;
    riskLevel: string;
    totalFiles: number;
    coveredFiles: number;
    partiallyCoveredFiles: number;
    uncoveredFiles: number;
  };
}

export const CoverageSummary: React.FC<CoverageSummaryProps> = ({ summary }) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'green';
      case 'B':
        return 'green';
      case 'C':
        return 'yellow';
      case 'D':
        return 'red';
      case 'F':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'green';
    if (coverage >= 80) return 'yellow';
    if (coverage >= 70) return 'red';
    return 'red';
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          Coverage Summary
        </Text>
      </Box>

      {/* Main coverage metrics */}
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text>Overall Coverage: </Text>
          <Text bold color={getCoverageColor(summary.overallCoverage)}>
            {summary.overallCoverage.toFixed(1)}%
          </Text>
          <Text> (Grade: </Text>
          <Text bold color={getGradeColor(summary.grade)}>
            {summary.grade}
          </Text>
          <Text>)</Text>
        </Box>

        <Box>
          <Text>Quality Score: </Text>
          <Text bold color={getCoverageColor(summary.qualityScore)}>
            {summary.qualityScore.toFixed(1)}
          </Text>
          <Text> (Risk: </Text>
          <Text bold color={getRiskColor(summary.riskLevel)}>
            {summary.riskLevel.toUpperCase()}
          </Text>
          <Text>)</Text>
        </Box>
      </Box>

      {/* Detailed coverage metrics */}
      <Box flexDirection="column" marginBottom={1}>
        <Box justifyContent="space-between" width={50}>
          <Text>Lines:</Text>
          <Text color={getCoverageColor(summary.lineCoverage)}>
            {summary.lineCoverage.toFixed(1)}%
          </Text>
        </Box>
        <Box justifyContent="space-between" width={50}>
          <Text>Branches:</Text>
          <Text color={getCoverageColor(summary.branchCoverage)}>
            {summary.branchCoverage.toFixed(1)}%
          </Text>
        </Box>
        <Box justifyContent="space-between" width={50}>
          <Text>Functions:</Text>
          <Text color={getCoverageColor(summary.functionCoverage)}>
            {summary.functionCoverage.toFixed(1)}%
          </Text>
        </Box>
        <Box justifyContent="space-between" width={50}>
          <Text>Statements:</Text>
          <Text color={getCoverageColor(summary.statementCoverage)}>
            {summary.statementCoverage.toFixed(1)}%
          </Text>
        </Box>
      </Box>

      {/* File statistics */}
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>File Statistics:</Text>
        </Box>
        <Box justifyContent="space-between" width={50}>
          <Text>Total Files:</Text>
          <Text>{summary.totalFiles}</Text>
        </Box>
        <Box justifyContent="space-between" width={50}>
          <Text color="green">Covered:</Text>
          <Text color="green">{summary.coveredFiles}</Text>
        </Box>
        <Box justifyContent="space-between" width={50}>
          <Text color="yellow">Partial:</Text>
          <Text color="yellow">{summary.partiallyCoveredFiles}</Text>
        </Box>
        <Box justifyContent="space-between" width={50}>
          <Text color="red">Uncovered:</Text>
          <Text color="red">{summary.uncoveredFiles}</Text>
        </Box>
      </Box>
    </Box>
  );
};
