/**
 * Type transformation utilities for bridging core and CLI types
 */

import type {
  Issue as CLIIssue,
  AnalysisResult as CLIAnalysisResult,
  ExtendedToolResult,
} from '../types/analysis';
import type { Issue as CoreIssue, AnalysisResult as CoreAnalysisResult } from '@dev-quality/core';

// Proper type definitions instead of any
type _any = unknown;

/**
 * Transform a Core Issue to CLI Issue with strict type checking
 */
export function transformCoreIssueToCLI(coreIssue: CoreIssue): CLIIssue {
  // Validate and transform the type field
  const validTypes = ['error', 'warning', 'info'] as const;
  const type = coreIssue.type.toLowerCase();

  if (!validTypes.includes(type as 'error' | 'warning' | 'info')) {
    throw new Error(
      `Invalid issue type: ${coreIssue.type}. Must be one of: ${validTypes.join(', ')}`
    );
  }

  return {
    ...coreIssue,
    type: type as 'error' | 'warning' | 'info',
  };
}

/**
 * Transform an array of Core Issues to CLI Issues
 */
export function transformCoreIssuesToCLI(coreIssues: CoreIssue[]): CLIIssue[] {
  return coreIssues.map(transformCoreIssueToCLI);
}

/**
 * Type guard to check if a string is a valid issue type
 */
export function isValidIssueType(type: string): type is 'error' | 'warning' | 'info' {
  return ['error', 'warning', 'info'].includes(type.toLowerCase());
}

/**
 * Safe transformation that filters out invalid issues
 */
export function safeTransformCoreIssuesToCLI(coreIssues: CoreIssue[]): CLIIssue[] {
  return coreIssues
    .filter(issue => isValidIssueType(issue.type))
    .map(issue => ({
      ...issue,
      type: issue.type.toLowerCase() as 'error' | 'warning' | 'info',
    }));
}

/**
 * Transform a Core AnalysisResult to CLI AnalysisResult
 */
export function transformCoreAnalysisResultToCLI(
  coreResult: CoreAnalysisResult
): CLIAnalysisResult {
  // Handle the interface differences between core and CLI AnalysisResult
  // Use type assertions to access properties that may not exist in the interface
  const coreResultAny = coreResult as _any;
  return {
    id: coreResultAny.id ?? `analysis-${Date.now()}`,
    projectId: coreResultAny.projectId ?? 'unknown-project',
    timestamp:
      typeof coreResult.timestamp === 'string' ? coreResult.timestamp : new Date().toISOString(),
    duration: coreResultAny.duration ?? 0,
    overallScore: coreResultAny.overallScore ?? 0,
    toolResults: (coreResultAny.toolResults ?? []).map((toolResult: any) => ({
      ...toolResult,
      issues: transformCoreIssuesToCLI(toolResult.issues),
    })) as ExtendedToolResult[],
    summary: coreResultAny.summary ?? {
      totalIssues: 0,
      totalErrors: 0,
      totalWarnings: 0,
      totalFixable: 0,
      overallScore: 0,
      toolCount: 0,
      executionTime: 0,
    },
    aiPrompts: coreResultAny.aiPrompts ?? [],
  };
}
