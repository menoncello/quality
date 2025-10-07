// Core plugin interfaces and types
export type {
  AnalysisPlugin,
  PluginConfig,
  AnalysisContext,
  ToolResult,
  Issue,
  ToolMetrics,
  CoverageData,
  ValidationResult,
  PluginMetrics,
  CacheInterface,
  Logger,
  ToolConfiguration,
  ProjectConfiguration,
  AnalysisResult,
  ResultSummary,
  AIPrompt
} from './analysis-plugin.js';

// Plugin management
export { PluginManager } from './plugin-manager.js';
export { PluginLoader } from './plugin-loader.js';
export { PluginSandbox } from './plugin-sandbox.js';
export { PluginDependencyResolver } from './plugin-dependency-resolver.js';

// Base adapter
export { BaseToolAdapter } from './base-tool-adapter.js';

// Built-in tool adapters
export { ESLintAdapter } from './builtin/eslint-adapter.js';
export { PrettierAdapter } from './builtin/prettier-adapter.js';
export { TypeScriptAdapter } from './builtin/typescript-adapter.js';
export { BunTestAdapter } from './builtin/bun-test-adapter.js';

// Plugin registry and enhanced loader
export { PluginRegistry } from './plugin-registry.js';
export type {
  PluginMetadata,
  PluginManifest,
  PluginSource,
  PluginInstallation,
  PluginRegistryEntry,
  PluginSearchFilters
} from './plugin-registry.js';

export { PluginLoaderV2 } from './plugin-loader-v2.js';
export type {
  PluginLoadingOptions,
  PluginLoadingResult
} from './plugin-loader-v2.js';