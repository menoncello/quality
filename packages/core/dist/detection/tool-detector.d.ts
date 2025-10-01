import { DetectedTool, ConfigFile } from './types';
export declare class ToolDetector {
    private readonly TOOL_CONFIGS;
    detectTools(rootPath: string): Promise<DetectedTool[]>;
    detectConfigs(rootPath: string): Promise<ConfigFile[]>;
    private detectSingleTool;
    private findConfigPath;
    private parseConfigFile;
    private getConfigFormat;
    private extractVersion;
    private getToolPriority;
    private loadPackageJson;
}
