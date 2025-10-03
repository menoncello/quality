import { create } from 'zustand';
import {
  PluginInterface,
  ProjectConfiguration,
  CommandOptions,
  AnalysisResult,
} from '@dev-quality/types';

interface CoreState {
  currentProject: ProjectConfiguration | null;
  plugins: Map<string, PluginInterface>;
  isLoading: boolean;
  error: string | null;

  actions: {
    setProject: (project: ProjectConfiguration) => void;
    registerPlugin: (plugin: PluginInterface) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
  };
}

export const useCoreStore = create<CoreState>((set, get) => ({
  currentProject: null,
  plugins: new Map(),
  isLoading: false,
  error: null,

  actions: {
    setProject: project => set({ currentProject: project }),
    registerPlugin: plugin => {
      const plugins = new Map(get().plugins);
      plugins.set(plugin.name, plugin);
      set({ plugins });
    },
    setLoading: loading => set({ isLoading: loading }),
    setError: error => set({ error }),
    clearError: () => set({ error: null }),
  },
}));

export class PluginManager {
  private plugins: Map<string, PluginInterface> = new Map();

  register(plugin: PluginInterface): void {
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): PluginInterface | undefined {
    return this.plugins.get(name);
  }

  list(): PluginInterface[] {
    return Array.from(this.plugins.values());
  }

  async executeAnalysis(
    toolName: string,
    config: any,
    options: CommandOptions
  ): Promise<AnalysisResult> {
    const plugin = this.get(toolName);
    if (!plugin) {
      throw new Error(`Plugin '${toolName}' not found`);
    }

    return plugin.analyze(config, options);
  }

  validateConfiguration(toolName: string, config: any): boolean {
    const plugin = this.get(toolName);
    if (!plugin) {
      return false;
    }

    return plugin.validate(config);
  }
}

export const pluginManager = new PluginManager();

// Auto-Configuration Detection Engine exports
export { AutoConfigurationDetectionEngine } from './detection/detection-engine';
export { ProjectDetector } from './detection/project-detector';
export { ToolDetector } from './detection/tool-detector';
export { DependencyChecker } from './detection/dependency-checker';
export { StructureAnalyzer } from './detection/structure-analyzer';
export { DetectionCache } from './detection/detection-cache';
export type {
  DetectedProject,
  DetectedTool,
  ConfigFile,
  DependencyInfo,
  ProjectStructure,
  DetectionResult,
  DetectionEngine,
  ConfigAnalyzer,
  DependencyChecker as DependencyCheckerInterface,
  StructureAnalyzer as StructureAnalyzerInterface,
} from './detection/types';

export type { PluginInterface, ProjectConfiguration, CommandOptions, AnalysisResult };

// Plugin System exports
export * from './plugins/index.js';

// Analysis Engine exports
export * from './analysis/index.js';

// Coverage Analysis exports
export * from './types/coverage.js';

// Additional type exports for CLI compatibility
export type { Issue, ToolResult, CoverageData, AnalysisContext } from './plugins/analysis-plugin.js';

// Additional exports that CLI needs
export { AnalysisEngine } from './analysis/analysis-engine.js';
export { CoverageAnalysisEngine } from './analysis/coverage-analysis-engine.js';
