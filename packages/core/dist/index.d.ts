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
    executeAnalysis(toolName: string, config: any, options: CommandOptions): Promise<AnalysisResult>;
    validateConfiguration(toolName: string, config: any): boolean;
}
export declare const pluginManager: PluginManager;
export { AutoConfigurationDetectionEngine } from './detection/detection-engine';
export { ProjectDetector } from './detection/project-detector';
export { ToolDetector } from './detection/tool-detector';
export { DependencyChecker } from './detection/dependency-checker';
export { StructureAnalyzer } from './detection/structure-analyzer';
export type { DetectedProject, DetectedTool, ConfigFile, DependencyInfo, ProjectStructure, DetectionResult, DetectionEngine, ConfigAnalyzer, DependencyChecker as DependencyCheckerInterface, StructureAnalyzer as StructureAnalyzerInterface, } from './detection/types';
export type { PluginInterface, ProjectConfiguration, CommandOptions, AnalysisResult };
//# sourceMappingURL=index.d.ts.map