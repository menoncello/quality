/**
 * Color coding utilities for dashboard components
 */

import type { IssueSeverity } from '../types/dashboard';

/**
 * Get color for severity level
 */
export function getSeverityColor(severity: IssueSeverity): string {
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
 * Get background color for severity level
 */
export function getSeverityBackgroundColor(severity: IssueSeverity): string {
  switch (severity) {
    case 'error':
      return '#ff0000';
    case 'warning':
      return '#ffff00';
    case 'info':
      return '#0000ff';
    default:
      return '#808080';
  }
}

/**
 * Get symbol for severity level
 */
export function getSeveritySymbol(severity: IssueSeverity): string {
  switch (severity) {
    case 'error':
      return '✗';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '•';
  }
}

/**
 * Get color for score ranges
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 80) return 'blue';
  if (score >= 70) return 'yellow';
  if (score >= 60) return 'magenta';
  return 'red';
}

/**
 * Get color for coverage percentage
 */
export function getCoverageColor(coverage: number): string {
  if (coverage >= 80) return 'green';
  if (coverage >= 60) return 'yellow';
  if (coverage >= 40) return 'magenta';
  return 'red';
}

/**
 * Get color for status indicators
 */
export function getStatusColor(status: 'success' | 'warning' | 'error' | 'loading'): string {
  switch (status) {
    case 'success':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    case 'loading':
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Get color for priority levels
 */
export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Color mapping for common terminal colors
 */
export const TerminalColors = {
  red: '#ff0000',
  green: '#00ff00',
  yellow: '#ffff00',
  blue: '#0000ff',
  magenta: '#ff00ff',
  cyan: '#00ffff',
  white: '#ffffff',
  gray: '#808080',
  black: '#000000',
} as const;

/**
 * Check if terminal supports color
 */
export function supportsColor(): boolean {
  return process.stdout.isTTY && process.env['TERM'] !== 'dumb' && !process.env['NO_COLOR'];
}
