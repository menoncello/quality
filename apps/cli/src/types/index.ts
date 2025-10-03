/**
 * Main types index file for CLI dashboard
 */

// Re-export all types from individual modules
export * from './dashboard';
export * from './export';
export * from './filters';
export * from './analysis';

// Import and re-export AnalysisResult with extended interface
export type { AnalysisResult } from './analysis';
