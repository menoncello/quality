/**
 * Comparison Summary Component
 * Displays summary metrics and key insights from comparison
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { ComparisonResult } from '../../hooks/useComparisonStore';

interface ComparisonSummaryProps {
  comparison: ComparisonResult;
}

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({ comparison }) => {
  const { baseline, comparison: comp, summary } = comparison;

  const getTrendIndicator = (value: number) => {
    if (value > 0) return { symbol: '📈', color: 'red', text: 'increased' };
    if (value < 0) return { symbol: '📉', color: 'green', text: 'decreased' };
    return { symbol: '➡️', color: 'yellow', text: 'unchanged' };
  };

  const getImprovementStatus = () => {
    if (summary.improvementRate > 10) {
      return { text: 'Significant Improvement', color: 'green' };
    }
    if (summary.improvementRate > 0) {
      return { text: 'Improvement', color: 'green' };
    }
    if (summary.improvementRate > -10) {
      return { text: 'Minor Degradation', color: 'yellow' };
    }
    return { text: 'Significant Degradation', color: 'red' };
  };

  const totalIssuesTrend = getTrendIndicator(summary.totalIssuesDiff);
  const criticalIssuesTrend = getTrendIndicator(summary.criticalIssuesDiff);
  const scoreTrend = getTrendIndicator(summary.scoreDiff);
  const improvementStatus = getImprovementStatus();

  return (
    <Box flexDirection="column">
      {/* Overview Section */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="blue">
          Overview
        </Text>
        <Box flexDirection="row" marginTop={1}>
          <Text color="gray">
            Comparing {baseline.version ?? baseline.id.slice(0, 8)} (
            {baseline.timestamp.toLocaleDateString()})
          </Text>
          <Text color="gray"> with </Text>
          <Text color="gray">
            {comp.version ?? comp.id.slice(0, 8)} ({comp.timestamp.toLocaleDateString()})
          </Text>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="blue">
          Key Metrics
        </Text>

        <Box flexDirection="row" marginTop={1}>
          <Box width={30}>
            <Text>Total Issues</Text>
          </Box>
          <Box width={15}>
            <Text color="gray">{baseline.metadata.totalIssues}</Text>
          </Box>
          <Box width={3}>
            <Text color="gray">→</Text>
          </Box>
          <Box width={15}>
            <Text color="gray">{comp.metadata.totalIssues}</Text>
          </Box>
          <Box width={10}>
            <Text color={totalIssuesTrend.color}>
              {totalIssuesTrend.symbol} {Math.abs(summary.totalIssuesDiff)}
            </Text>
          </Box>
          <Box>
            <Text color={totalIssuesTrend.color} dimColor>
              ({totalIssuesTrend.text})
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row">
          <Box width={30}>
            <Text>Critical Issues</Text>
          </Box>
          <Box width={15}>
            <Text color="gray">{baseline.metadata.criticalIssues}</Text>
          </Box>
          <Box width={3}>
            <Text color="gray">→</Text>
          </Box>
          <Box width={15}>
            <Text color="gray">{comp.metadata.criticalIssues}</Text>
          </Box>
          <Box width={10}>
            <Text color={criticalIssuesTrend.color}>
              {criticalIssuesTrend.symbol} {Math.abs(summary.criticalIssuesDiff)}
            </Text>
          </Box>
          <Box>
            <Text color={criticalIssuesTrend.color} dimColor>
              ({criticalIssuesTrend.text})
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row">
          <Box width={30}>
            <Text>Quality Score</Text>
          </Box>
          <Box width={15}>
            <Text color="gray">{baseline.metadata.score}</Text>
          </Box>
          <Box width={3}>
            <Text color="gray">→</Text>
          </Box>
          <Box width={15}>
            <Text color="gray">{comp.metadata.score}</Text>
          </Box>
          <Box width={10}>
            <Text color={scoreTrend.color}>
              {scoreTrend.symbol} {Math.abs(summary.scoreDiff)}
            </Text>
          </Box>
          <Box>
            <Text color={scoreTrend.color} dimColor>
              ({scoreTrend.text})
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Issues Changes */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="blue">
          Issues Changes
        </Text>

        <Box flexDirection="row" marginTop={1}>
          <Box width={25}>
            <Text color="green">New Issues:</Text>
          </Box>
          <Box width={10}>
            <Text color="green" bold>
              +{summary.newIssuesCount}
            </Text>
          </Box>
          <Box>
            <Text color="gray" dimColor>
              (introduced in comparison)
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row">
          <Box width={25}>
            <Text color="red">Resolved Issues:</Text>
          </Box>
          <Box width={10}>
            <Text color="red" bold>
              -{summary.resolvedIssuesCount}
            </Text>
          </Box>
          <Box>
            <Text color="gray" dimColor>
              (fixed in comparison)
            </Text>
          </Box>
        </Box>

        <Box flexDirection="row">
          <Box width={25}>
            <Text color="gray">Unchanged Issues:</Text>
          </Box>
          <Box width={10}>
            <Text color="gray">{summary.unchangedIssuesCount}</Text>
          </Box>
          <Box>
            <Text color="gray" dimColor>
              (persisting issues)
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Severity Breakdown */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="blue">
          Severity Breakdown
        </Text>

        {comparison.trends.severity.map(trend => {
          const severityTrend = getTrendIndicator(trend.diff);
          return (
            <Box flexDirection="row" key={trend.type} marginTop={1}>
              <Box width={15}>
                <Text bold>{trend.type.toUpperCase()}:</Text>
              </Box>
              <Box width={10}>
                <Text color="gray">{trend.baseline}</Text>
              </Box>
              <Box width={3}>
                <Text color="gray">→</Text>
              </Box>
              <Box width={10}>
                <Text color="gray">{trend.comparison}</Text>
              </Box>
              <Box width={8}>
                <Text color={severityTrend.color}>
                  {severityTrend.symbol} {Math.abs(trend.diff)}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Overall Status */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="blue">
          Overall Status
        </Text>

        <Box flexDirection="row" marginTop={1}>
          <Text color={improvementStatus.color} bold>
            {improvementStatus.text}
          </Text>
          <Box flexGrow={1} />
          <Text color="gray">Improvement Rate: {summary.improvementRate.toFixed(2)}%</Text>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color="gray" dimColor>
            {summary.improvementRate > 0
              ? `🟢 Good progress! ${summary.resolvedIssuesCount} issues resolved with ${summary.newIssuesCount} new issues introduced.`
              : `⚠️  Need attention. ${summary.newIssuesCount} new issues introduced while only ${summary.resolvedIssuesCount} were resolved.`}
          </Text>
        </Box>
      </Box>

      {/* Tool Analysis */}
      <Box flexDirection="column">
        <Text bold color="blue">
          Tool Analysis
        </Text>

        {comparison.trends.tools.map(trend => {
          const toolTrend = getTrendIndicator(trend.diff);
          return (
            <Box flexDirection="row" key={trend.tool} marginTop={1}>
              <Box width={15}>
                <Text>{trend.tool}:</Text>
              </Box>
              <Box width={10}>
                <Text color="gray">{trend.baseline}</Text>
              </Box>
              <Box width={3}>
                <Text color="gray">→</Text>
              </Box>
              <Box width={10}>
                <Text color="gray">{trend.comparison}</Text>
              </Box>
              <Box width={8}>
                <Text color={toolTrend.color}>
                  {toolTrend.symbol} {Math.abs(trend.diff)}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
