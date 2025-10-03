import { DependencyInfo } from './types';
export declare class DependencyChecker {
    private readonly COMPATIBILITY_MATRIX;
    private readonly VERSION_CONFLICTS;
    detectDependencies(rootPath: string): Promise<DependencyInfo[]>;
    checkCompatibility(deps: DependencyInfo[]): Promise<{
        compatible: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    getMinimumVersion(tool: string): string;
    getRecommendedVersion(tool: string): string;
    private checkDependencyCompatibility;
    private getCompatibilityIssues;
    private checkVersionConflicts;
    private generateUpgradeRecommendations;
    private cleanVersion;
    private compareVersions;
    private satisfiesVersion;
    private loadPackageJson;
}
//# sourceMappingURL=dependency-checker.d.ts.map