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
//# sourceMappingURL=index.js.map