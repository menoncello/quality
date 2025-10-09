import { PluginInterface, ProjectConfiguration, CommandOptions, AnalysisResult } from '@dev-quality/types';
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
export declare const useCoreStore: import("zustand").UseBoundStore<import("zustand").StoreApi<CoreState>>;
export declare class PluginManager {
    private plugins;
    register(plugin: PluginInterface): void;
    get(name: string): PluginInterface | undefined;
    list(): PluginInterface[];
    executeAnalysis(toolName: string, config: unknown, options: CommandOptions): Promise<AnalysisResult>;
    validateConfiguration(toolName: string, config: unknown): boolean;
}
export declare const pluginManager: PluginManager;
export { AutoConfigurationDetectionEngine } from './detection/detection-engine';
export { ProjectDetector } from './detection/project-detector';
export { ToolDetector } from './detection/tool-detector';
export { DependencyChecker } from './detection/dependency-checker';
export { StructureAnalyzer } from './detection/structure-analyzer';
export { DetectionCache } from './detection/detection-cache';
export type { DetectedProject, DetectedTool, ConfigFile, DependencyInfo, ProjectStructure, DetectionResult, DetectionEngine, ConfigAnalyzer, DependencyChecker as DependencyCheckerInterface, StructureAnalyzer as StructureAnalyzerInterface, } from './detection/types';
export type { ProjectConfiguration, AnalysisResult, ValidationResult as PluginValidationResult } from './plugins/index';
export * from './types/coverage';
export type { Issue, ToolResult, CoverageData, AnalysisContext, ToolConfiguration } from './plugins/analysis-plugin';
export { AnalysisEngine } from './analysis/analysis-engine';
export { CoverageAnalysisEngine } from './analysis/coverage-analysis-engine';
export { BunTestAdapter } from './plugins/builtin/bun-test-adapter';
export type { CoverageReport, EnhancedCoverageData } from './types/coverage';
export type { AnalysisProgress } from './analysis/analysis-engine';
export * from './prioritization/index';
export { prioritizationFactory } from './prioritization/index';
//# sourceMappingURL=index.d.ts.map