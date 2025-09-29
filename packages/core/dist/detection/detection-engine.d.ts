import { DetectionResult, DetectionEngine } from './types';
export declare class AutoConfigurationDetectionEngine implements DetectionEngine {
    private projectDetector;
    private toolDetector;
    private dependencyChecker;
    private structureAnalyzer;
    constructor();
    detectProject(rootPath: string): Promise<import("./types").DetectedProject>;
    detectTools(rootPath: string): Promise<import("./types").DetectedTool[]>;
    detectConfigs(rootPath: string): Promise<import("./types").ConfigFile[]>;
    detectDependencies(rootPath: string): Promise<import("./types").DependencyInfo[]>;
    detectStructure(rootPath: string): Promise<import("./types").ProjectStructure>;
    detectAll(rootPath: string): Promise<DetectionResult>;
    private generateIssues;
    private generateRecommendations;
}
//# sourceMappingURL=detection-engine.d.ts.map