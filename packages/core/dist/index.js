import { create } from 'zustand';
export const useCoreStore = create((set, get) => ({
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
    plugins = new Map();
    register(plugin) {
        this.plugins.set(plugin.name, plugin);
    }
    get(name) {
        return this.plugins.get(name);
    }
    list() {
        return Array.from(this.plugins.values());
    }
    async executeAnalysis(toolName, config, options) {
        const plugin = this.get(toolName);
        if (!plugin) {
            throw new Error(`Plugin '${toolName}' not found`);
        }
        return plugin.analyze(config, options);
    }
    validateConfiguration(toolName, config) {
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
// Plugin System exports
export * from './plugins/index.js';
// Analysis Engine exports
export * from './analysis/index.js';
// Coverage Analysis exports
export * from './types/coverage.js';
// Additional exports that CLI needs
export { AnalysisEngine } from './analysis/analysis-engine.js';
export { CoverageAnalysisEngine } from './analysis/coverage-analysis-engine.js';
export { BunTestAdapter } from './plugins/builtin/bun-test-adapter.js';
//# sourceMappingURL=index.js.map