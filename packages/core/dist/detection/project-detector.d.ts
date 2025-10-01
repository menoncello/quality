import { DetectedProject } from './types';
export declare class ProjectDetector {
    private readonly FRAMEWORK_PATTERNS;
    private readonly BUILD_SYSTEMS;
    detectProject(rootPath: string): Promise<DetectedProject>;
    private parsePackageJson;
    private determineProjectType;
    private detectFrameworks;
    private detectBuildSystems;
    private detectPackageManager;
    private hasTypeScript;
    private hasTests;
    private hasMonorepoConfig;
}
