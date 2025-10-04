export interface ProjectConfiguration {
    name: string;
    version: string;
    description: string;
    type: "frontend" | "backend" | "fullstack" | "monorepo";
    frameworks: string[];
    tools: ToolConfiguration[];
    paths: {
        source: string;
        tests: string;
        config: string;
        output: string;
    };
    settings: {
        verbose: boolean;
        quiet: boolean;
        json: boolean;
        cache: boolean;
    };
}
export interface ToolConfiguration {
    name: string;
    version: string;
    enabled: boolean;
    config: Record<string, unknown>;
    priority: number;
}
export interface CommandOptions {
    verbose?: boolean;
    quiet?: boolean;
    json?: boolean;
    config?: string;
    cache?: boolean;
    help?: boolean;
}
export interface AnalysisResult {
    tool: string;
    success: boolean;
    data: unknown;
    timestamp: string;
    duration: number;
}
export interface ReportData {
    project: ProjectConfiguration;
    results: AnalysisResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        warnings: number;
    };
    generatedAt: string;
}
export interface PluginInterface {
    name: string;
    version: string;
    analyze: (config: ToolConfiguration, options: CommandOptions) => Promise<AnalysisResult>;
    configure: (config: Record<string, unknown>) => ToolConfiguration;
    validate: (config: ToolConfiguration) => boolean;
}
export interface CacheEntry {
    key: string;
    data: unknown;
    timestamp: string;
    ttl: number;
}
export * from './prioritization';
//# sourceMappingURL=index.d.ts.map