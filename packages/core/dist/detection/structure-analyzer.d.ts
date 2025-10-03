import { ProjectStructure } from './types';
export declare class StructureAnalyzer {
    private readonly MONOREPO_PATTERNS;
    private readonly SOURCE_PATTERNS;
    private readonly TEST_PATTERNS;
    private readonly CONFIG_PATTERNS;
    analyzeStructure(rootPath: string): Promise<ProjectStructure>;
    detectMonorepoType(rootPath: string): Promise<ProjectStructure['workspaceType']>;
    private detectMonorepo;
    private detectPackages;
    private findPackageDirectories;
    private findDirectoriesByPatterns;
    private detectPackageManager;
    calculateComplexity(structure: ProjectStructure): 'simple' | 'medium' | 'complex';
}
//# sourceMappingURL=structure-analyzer.d.ts.map