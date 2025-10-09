import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileUtils } from '@dev-quality/utils';
import { ProjectStructure } from './types';

export class StructureAnalyzer {
  private readonly MONOREPO_PATTERNS = {
    npm: ['package.json', 'workspaces'],
    yarn: ['package.json', 'workspaces'],
    pnpm: ['pnpm-workspace.yaml'],
    nx: ['nx.json'],
    turbo: ['turbo.json'],
    lerna: ['lerna.json'],
    rush: ['rush.json'],
  };

  private readonly SOURCE_PATTERNS = [
    'src',
    'lib',
    'source',
    'app',
    'components',
    'pages',
    'views',
    'services',
    'utils',
    'helpers',
    'hooks',
    'types',
    'interfaces',
  ];

  private readonly TEST_PATTERNS = [
    'test',
    'tests',
    '__tests__',
    'spec',
    'specs',
    'e2e',
    'integration',
    'unit',
  ];

  private readonly CONFIG_PATTERNS = ['config', 'configs', '.config', 'configuration', 'conf'];

  async analyzeStructure(rootPath: string): Promise<ProjectStructure> {
    const isMonorepo = this.detectMonorepo(rootPath);
    const workspaceType = isMonorepo ? await this.detectMonorepoType(rootPath) : null;
    const packages = isMonorepo ? await this.detectPackages(rootPath) : [];
    const sourceDirectories = await this.findDirectoriesByPatterns(rootPath, this.SOURCE_PATTERNS);
    const testDirectories = await this.findDirectoriesByPatterns(rootPath, this.TEST_PATTERNS);
    const configDirectories = await this.findDirectoriesByPatterns(rootPath, this.CONFIG_PATTERNS);

    const structure: ProjectStructure = {
      isMonorepo,
      workspaceType,
      packages,
      sourceDirectories,
      testDirectories,
      configDirectories,
      complexity: 'simple',
    };

    structure.complexity = this.calculateComplexity(structure);

    return structure;
  }

  async detectMonorepoType(rootPath: string): Promise<ProjectStructure['workspaceType']> {
    // Check for specific monorepo tools FIRST (turbo, nx, lerna, pnpm, rush)
    // These take precedence over generic npm/yarn workspaces
    for (const [type, patterns] of Object.entries(this.MONOREPO_PATTERNS)) {
      if (type === 'npm'  || type === 'yarn') continue; // Handle these last

      for (const pattern of patterns) {
        if (existsSync(join(rootPath, pattern))) {
          return type as ProjectStructure['workspaceType'];
        }
      }
    }

    // Check npm/yarn workspaces last
    const packageJsonPath = join(rootPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkgJson = fileUtils.readJsonSync<{ workspaces?: unknown }>(packageJsonPath);

        // Check npm/yarn workspaces
        if (pkgJson.workspaces) {
          const packageManager = this.detectPackageManager(rootPath);
          return packageManager === 'yarn' ? 'yarn' : 'npm';
        }
      } catch (_error) {
         
     
    // eslint-disable-next-line no-console
    console.warn('Failed to read package.json for monorepo type detection:');
        // Continue
      }
    }

    return null;
  }

  private detectMonorepo(rootPath: string): boolean {
    // Check workspaces in package.json
    const packageJsonPath = join(rootPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkgJson = fileUtils.readJsonSync<{ workspaces?: unknown }>(packageJsonPath);
        if (pkgJson.workspaces) {
          return true;
        }
      } catch (_error) {
         
     
    // eslint-disable-next-line no-console
    console.warn('Failed to read package.json:');
        // Continue
      }
    }

    // Check for monorepo configuration files
    const monorepoFiles = [
      'pnpm-workspace.yaml',
      'nx.json',
      'turbo.json',
      'lerna.json',
      'rush.json',
    ];

    return monorepoFiles.some(file => existsSync(join(rootPath, file)));
  }

  private async detectPackages(rootPath: string): Promise<string[]> {
    const packages: string[] = [];
    const packageJsonPath = join(rootPath, 'package.json');

    if (existsSync(packageJsonPath)) {
      try {
        const pkgJson = fileUtils.readJsonSync<{
          workspaces?: string[] | { packages?: string[] };
        }>(packageJsonPath);

        // Check npm/yarn workspaces
        if (pkgJson.workspaces) {
          const workspaces = pkgJson.workspaces;
          if (Array.isArray(workspaces)) {
            packages.push(...workspaces);
          } else if (workspaces.packages) {
            packages.push(...workspaces.packages);
          }
        }
      } catch (_error) {
        // Continue
      }
    }

    // Check pnpm workspaces
    const pnpmWorkspacePath = join(rootPath, 'pnpm-workspace.yaml');
    if (existsSync(pnpmWorkspacePath)) {
      try {
        const content = readFileSync(pnpmWorkspacePath, 'utf-8');
        const packagesMatch = content.match(/packages:\s*\n((?:\s*-\s*[^\n]+\n?)*)/);
        if (packagesMatch?.[1]) {
          const packageLines = packagesMatch[1].split('\n').filter(line => line.trim());
          for (const line of packageLines) {
            const packagePath = line.replace(/^\s*-\s*/, '').trim();
            if (packagePath) {
              packages.push(packagePath);
            }
          }
        }
      } catch (_error) {
        // Continue
      }
    }

    // Find directories with package.json files
    const allPackageDirs = await this.findPackageDirectories(rootPath);
    packages.push(...allPackageDirs.filter(dir => dir !== '.'));

    return [...new Set(packages)];
  }

  private async findPackageDirectories(rootPath: string): Promise<string[]> {
    const packageDirs: string[] = [];

    const scanDirectory = (dir: string): void => {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = join(dir, entry.name);
          const packageJsonPath = join(fullPath, 'package.json');

          if (existsSync(packageJsonPath)) {
            const relativePath = relative(rootPath, fullPath);
            packageDirs.push(relativePath);
          }

          // Recursively scan, but avoid node_modules
          if (entry.name !== 'node_modules') {
            scanDirectory(fullPath);
          }
        }
      }
    };

    scanDirectory(rootPath);
    return packageDirs;
  }

  private async findDirectoriesByPatterns(rootPath: string, patterns: string[]): Promise<string[]> {
    const directories: string[] = [];

    const scanDirectory = (dir: string, currentDepth = 0): void => {
      // Limit depth to avoid excessive scanning
      if (currentDepth > 3) return;

      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = join(dir, entry.name);
          const relativePath = relative(rootPath, fullPath);

          // Check if directory name matches unknown pattern
          if (
            patterns.some(
              pattern =>
                (entry?.name === pattern || entry?.name?.includes(pattern)) ?? entry.name.toLowerCase().includes(pattern.toLowerCase())
            )
          ) {
            directories.push(relativePath);
          }

          // Recursively scan, but avoid node_modules and hidden directories
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            scanDirectory(fullPath, currentDepth + 1);
          }
        }
      }
    };

    scanDirectory(rootPath);
    return [...new Set(directories)];
  }

  private detectPackageManager(rootPath: string): 'npm' | 'yarn' | 'pnpm' | 'bun' {
    // Only detect package manager if there's a package.json in the same directory
    const packageJsonPath = join(rootPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return 'npm';
    }

    // Check for lock files in the specific directory only
    if (existsSync(join(rootPath, 'bun.lockb'))) {
      return 'bun';
    }
    if (existsSync(join(rootPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (existsSync(join(rootPath, 'yarn.lock'))) {
      return 'yarn';
    }
    if (existsSync(join(rootPath, 'bun.lock'))) {
      return 'bun';
    }
    if (existsSync(join(rootPath, 'package-lock.json'))) {
      return 'npm';
    }

    return 'npm';
  }

  calculateComplexity(structure: ProjectStructure): 'simple' | 'medium' | 'complex' {
    let score = 0;

    // Base complexity from project type
    if (structure.isMonorepo) {
      score += 3;
    }

    // Package count complexity
    if (structure.packages.length > 10) {
      score += 4;
    } else if (structure.packages.length > 5) {
      score += 2;
    } else if (structure.packages.length > 2) {
      score += 1;
    }

    // Source directory complexity
    if (structure.sourceDirectories.length > 10) {
      score += 2;
    } else if (structure.sourceDirectories.length > 5) {
      score += 1;
    }

    // Test directory complexity
    if (structure.testDirectories.length > 5) {
      score += 2;
    } else if (structure.testDirectories.length > 2) {
      score += 1;
    }

    // Configuration complexity
    if (structure.configDirectories.length > 3) {
      score += 2;
    } else if (structure.configDirectories.length > 1) {
      score += 1;
    }

    // Workspace type complexity
    if (structure.workspaceType === 'nx'  || structure.workspaceType === 'rush') {
      score += 2;
    } else if (structure.workspaceType === 'turbo'  || structure.workspaceType === 'lerna') {
      score += 1;
    }

    // Calculate final complexity
    if (score >= 8) {
      return 'complex';
    } else if (score >= 4) {
      return 'medium';
    } else {
      return 'simple';
    }
  }
}
