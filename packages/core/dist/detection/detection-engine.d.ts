import { DetectionCache } from './detection-cache';
import { DetectionResult, DetectionEngine } from './types';
export declare class AutoConfigurationDetectionEngine implements DetectionEngine {
    private projectDetector;
    private toolDetector;
    private dependencyChecker;
    private structureAnalyzer;
    private cache;
    constructor(cache?: DetectionCache);
    detectProject(rootPath: string): Promise<import("./types").DetectedProject>;
    detectTools(rootPath: string): Promise<import("./types").DetectedTool[]>;
    detectConfigs(rootPath: string): Promise<import("./types").ConfigFile[]>;
    detectDependencies(rootPath: string): Promise<import("./types").DependencyInfo[]>;
    detectStructure(rootPath: string): Promise<import("./types").ProjectStructure>;
    detectAll(rootPath: string): Promise<DetectionResult>;
    /**
     * Clear cache for a specific path or all caches
     */
    clearCache(rootPath?: string): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        fileCache: {
            size: number;
            maxSize: number;
        };
        configCache: {
            size: number;
            maxSize: number;
        };
        dependencyCache: {
            size: number;
            maxSize: number;
        };
        resultCache: {
            size: number;
            maxSize: number;
        };
    };
    private generateIssues;
    private generateRecommendations;
}
//# sourceMappingURL=detection-engine.d.ts.map