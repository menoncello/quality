import { fileUtils } from '@dev-quality/utils';
import { DependencyInfo } from './types';

export class DependencyChecker {
  private readonly COMPATIBILITY_MATRIX: Record<
    string,
    { minimum: string; recommended: string; incompatible: string[] }
  > = {
    // DevQuality tool requirements
    typescript: {
      minimum: '4.9.0',
      recommended: '5.3.3',
      incompatible: ['<4.9.0'],
    },
    eslint: {
      minimum: '8.0.0',
      recommended: '8.57.0',
      incompatible: ['<8.0.0'],
    },
    prettier: {
      minimum: '2.0.0',
      recommended: '3.0.0',
      incompatible: ['<2.0.0'],
    },
    // Testing frameworks
    jest: {
      minimum: '29.0.0',
      recommended: '29.7.0',
      incompatible: ['<29.0.0'],
    },
    vitest: {
      minimum: '0.34.0',
      recommended: '1.0.0',
      incompatible: ['<0.34.0'],
    },
    // Build tools
    webpack: {
      minimum: '5.0.0',
      recommended: '5.89.0',
      incompatible: ['<5.0.0'],
    },
    vite: {
      minimum: '4.0.0',
      recommended: '5.0.0',
      incompatible: ['<4.0.0'],
    },
    // Framework-specific
    react: {
      minimum: '16.8.0',
      recommended: '18.2.0',
      incompatible: ['<16.8.0'],
    },
    next: {
      minimum: '13.0.0',
      recommended: '14.0.0',
      incompatible: ['<13.0.0'],
    },
  };

  private readonly VERSION_CONFLICTS = {
    // TypeScript conflicts
    'typescript@<4.9.0': ['next@>=13.0.0', 'react@>=18.0.0'],
    'typescript@>=5.0.0': ['some-old-framework@<2.0.0'],

    // React conflicts
    'react@<16.8.0': ['react-hooks@>=1.0.0'],
    'react@>=18.0.0': ['some-old-library@<1.0.0'],

    // Build tool conflicts
    'webpack@<5.0.0': ['webpack-dev-server@>=4.0.0'],
    'vite@<3.0.0': ['@vitejs/plugin-react@>=2.0.0'],
  };

  async detectDependencies(rootPath: string): Promise<DependencyInfo[]> {
    const packageJson = this.loadPackageJson(rootPath);
    const dependencies: DependencyInfo[] = [];

    // Map package.json types to DependencyInfo types
    const depTypeMap = {
      dependencies: 'dependency' as const,
      devDependencies: 'devDependency' as const,
      peerDependencies: 'peerDependency' as const,
      optionalDependencies: 'devDependency' as const, // Treat optional as dev
    };

    // Process all dependency types
    const depTypes = Object.keys(depTypeMap) as Array<keyof typeof depTypeMap>;

    for (const depType of depTypes) {
      const typedPackageJson = packageJson as Record<string, Record<string, string>>;
      if (typedPackageJson[depType]) {
        for (const [name, version] of Object.entries(typedPackageJson[depType])) {
          const compatibility = this.checkDependencyCompatibility(name, version);
          const issues = this.getCompatibilityIssues(name, version);

          dependencies.push({
            name,
            version,
            type: depTypeMap[depType],
            compatibility,
            issues,
          });
        }
      }
    }

    return dependencies;
  }

  async checkCompatibility(deps: DependencyInfo[]): Promise<{
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let compatible = true;

    // Check individual compatibility
    for (const dep of deps) {
      if (dep.compatibility === 'incompatible') {
        compatible = false;
        issues.push(...dep.issues);
      }
    }

    // Check version conflicts
    const conflicts = this.checkVersionConflicts(deps);
    if (conflicts.length > 0) {
      compatible = false;
      issues.push(...conflicts);
    }

    // Generate recommendations
    const upgradeRecommendations = this.generateUpgradeRecommendations(deps);
    recommendations.push(...upgradeRecommendations);

    return {
      compatible,
      issues: [...new Set(issues)], // Remove duplicates
      recommendations: [...new Set(recommendations)],
    };
  }

  getMinimumVersion(tool: string): string {
    return this.COMPATIBILITY_MATRIX[tool]?.minimum ?? '0.0.0';
  }

  getRecommendedVersion(tool: string): string {
    return this.COMPATIBILITY_MATRIX[tool]?.recommended ?? 'latest';
  }

  private checkDependencyCompatibility(
    name: string,
    version: string
  ): DependencyInfo['compatibility'] {
    const matrix = this.COMPATIBILITY_MATRIX[name];
    if (!matrix) {
      return 'unknown';
    }

    const cleanVersion = this.cleanVersion(version);
    const minVersion = matrix.minimum;
    const incompatibleVersions = matrix.incompatible ?? [];

    // Check against incompatible versions
    for (const incompatible of incompatibleVersions) {
      if (this.satisfiesVersion(cleanVersion, incompatible)) {
        return 'incompatible';
      }
    }

    // Check minimum version
    if (this.compareVersions(cleanVersion, minVersion) < 0) {
      return 'incompatible';
    }

    return 'compatible';
  }

  private getCompatibilityIssues(name: string, version: string): string[] {
    const issues: string[] = [];
    const matrix = this.COMPATIBILITY_MATRIX[name];

    if (!matrix) {
      return issues;
    }

    const cleanVersion = this.cleanVersion(version);
    const minVersion = matrix.minimum;

    if (this.compareVersions(cleanVersion, minVersion) < 0) {
      issues.push(`${name}@${version} is below minimum required version ${minVersion}`);
    }

    return issues;
  }

  private checkVersionConflicts(deps: DependencyInfo[]): string[] {
    const conflicts: string[] = [];
    const depMap = new Map(deps.map(d => [d.name, d.version]));

    for (const [conflictPattern, conflictingDeps] of Object.entries(this.VERSION_CONFLICTS)) {
      const [depName, versionRange] = conflictPattern.split('@');
      if (!depName || !versionRange) continue;

      const currentDep = depMap.get(depName);

      if (currentDep && this.satisfiesVersion(currentDep, versionRange)) {
        for (const conflictingDep of conflictingDeps) {
          const [conflictingName, conflictingRange] = conflictingDep.split('@');
          if (!conflictingName || !conflictingRange) continue;

          const conflictingVersion = depMap.get(conflictingName);

          if (conflictingVersion && this.satisfiesVersion(conflictingVersion, conflictingRange)) {
            conflicts.push(
              `Version conflict: ${depName}@${currentDep} conflicts with ${conflictingName}@${conflictingVersion}`
            );
          }
        }
      }
    }

    return conflicts;
  }

  private generateUpgradeRecommendations(deps: DependencyInfo[]): string[] {
    const recommendations: string[] = [];

    for (const dep of deps) {
      const matrix = this.COMPATIBILITY_MATRIX[dep.name];
      if (matrix && dep.compatibility === 'incompatible') {
        const recommended: string = matrix.recommended;
        recommendations.push(`Upgrade ${dep.name} from ${dep.version} to ${recommended}`);
      }
    }

    return recommendations;
  }

  private cleanVersion(version: string): string {
    // Remove npm version prefixes and suffixes
    return (
      version
        .replace(/^[\^~]/, '')
        .replace(/-.*$/, '')
        .split(' ')[0]  || '0.0.0'
    );
  }

  private compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i]  || 0;
      const num2 = v2[i] ?? 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  private satisfiesVersion(version: string, range: string): boolean {
    const cleanVersion = this.cleanVersion(version);

    if (range.startsWith('>=')) {
      return this.compareVersions(cleanVersion, range.substring(2)) >= 0;
    } else if (range.startsWith('>')) {
      return this.compareVersions(cleanVersion, range.substring(1)) > 0;
    } else if (range.startsWith('<=')) {
      return this.compareVersions(cleanVersion, range.substring(2)) <= 0;
    } else if (range.startsWith('<')) {
      return this.compareVersions(cleanVersion, range.substring(1)) < 0;
    } else if (range.includes('-')) {
      // Handle range like "1.0.0-2.0.0"
      const [min, max] = range.split('-');
      if (!min || !max) return false;
      return (
        this.compareVersions(cleanVersion, min) >= 0 && this.compareVersions(cleanVersion, max) <= 0
      );
    } else {
      // Exact version
      return cleanVersion === range;
    }
  }

  private loadPackageJson(rootPath: string): unknown{
    const packageJsonPath = `${rootPath}/package.json`;
    try {
      return fileUtils.readJsonSync(packageJsonPath);
    } catch (_error) {
      return {};
    }
  }
}
